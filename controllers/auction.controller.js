const chalk = require('chalk');
const del = require('delete');
const moment = require('moment');
const requestIp = require('request-ip');
const request = require('request');
const winston = require('winston');
const validator = require('validator');
const xssFilters = require('xss-filters');
// Models ..
const Auction = require('../models/auction');
const AuctionViews = require('../models/auctionViews');
const Comments = require('../models/comments');
const FollowedAuctions = require('../models/followedAuctions');
const Notifications = require('../models/notifications');
const User = require('../models/user');
const AuctionStats = require("../models/auctionStats");
const auctionBids = require("../models/auctionBids");




// Controllers ...
const commons = require('./common.controller.js');

const uiDateFormat = 'YYYY-MM-DD HH:mm';

exports.createAuctionGet = function(req, res) {
  'use strict'
  User.getPrimeCompanies(function (err, data) {
    let companies = [];
    for (let i = 0; i < data.length; i++) {
      companies[i] = data[i].name;
    }
    res.render('auction/create', {
      companyList: companies, //Companies for dropdown option.
      user: req.params.username,
    });
  })
}

exports.createAuctionPost = function (req, res) {
  if (!req.user) {
    console.log("*******HERE IN NOT REQ USER**********")
    req.flash('error', 'Session expired.');
    res.send({
      "Error": 1
    });
  } else if (req.user.pin != req.body.pin) {
    res.send({
      "Error": 5
    });
  } else {

    // Validation & XSS vulnerability
    let aName = req.body.auctionName;
    let isName = /[^A-Za-z0-9_-]/;
    let isNumber = /^-?(?:\d+|\d{1,3}(?:,\d{3})+)?(?:\.\d+)?$/

    if (isName.test(aName) ||
      validator.isEmpty(req.body.auctionUseCase) ||
      validator.isEmpty(req.body.auctionDesc) ||
      (!isNumber.test(req.body.auctionMinBid)) ||
      validator.isEmpty(req.body.auctionMinBid) ||
      (req.body.subType == undefined) ||
      (req.files.length == "0")
    ) {
      return res.send({
        "Error": 2,
      });
    }

    if (req.body.auctionBuyOut != "") {
      if (req.body.auctionBuyOut == "0") {
        return res.send({
          "Error": 3,
        });
      }
      if (req.body.auctionMinBid > req.body.auctionBuyOut) {
        return res.send({
          "Error": 4,
        });
      }
    }

    if(req.body.subType != undefined){
      let subType = req.body.subType;
      for (let i = 0; i < subType.length; i++) {
        if (subType[i] == "I conﬁrm this is not a DDoS ") {
          subType.pop()
        }
      }
    }

    let newAuction = new Auction({
      user: xssFilters.inHTMLData(req.user.userName),
      name: xssFilters.inHTMLData(req.body.auctionName),
      case: xssFilters.inHTMLData(req.body.auctionUseCase),
      os: xssFilters.inHTMLData(req.body.operatingSystem),
      type: xssFilters.inHTMLData(req.body.auctionType),
      subType: xssFilters.inHTMLData(subType),
      impactedCompany: xssFilters.inHTMLData(req.body.impactedCompany),
      manufacturer: xssFilters.inHTMLData(req.body.manufacturer),
      minimumBid: xssFilters.inHTMLData(req.body.auctionMinBid),
      buyoutPrice: xssFilters.inHTMLData(req.body.auctionBuyOut),
      description: xssFilters.inHTMLData(req.body.description),
    });

    if (req.body.expirationDate) {
      newAuction["expirationDate"] = (new Date(req.body.expirationDate)).toISOString();
    }
    if (req.files) {
      newAuction["document"] = req.files;
    } else {
      return res.send({
        "Error": 2,
      });
    }
    Auction.createAuction(newAuction, function (err, auction) {
      if (err) {
        winston.error(chalk.red(err));
        req.flash('error', 'Submission automatically denied and logged.');
        let newNotification = `Submission was automatically denied.`;
        commons.setUserNotification(req.user.userName, newNotification);
        res.send({
          "Error": 1
        });
      } else {
        // Set auction name for user notification.
        var auc_name = "";
        if (req.body.auctionName.length > 33) {
          auc_name = req.body.auctionName.slice(0, 30) + "...";
        } else {
          auc_name = req.body.auctionName;
        }
        // Set user notification.
        let newNotification = `<a class="notificationLink" href="/users/` + req.user.userName + `/auctions/` + auc_name + `">Your auction is pending review.</a> `;
        commons.setUserNotification(req.user.userName, newNotification);
      }
    });
    req.flash('success', `Thanks for your submission!
                Now the GREYRALLY team goes to work. You’ll be notified when your auction is live.`);
    res.send({
      "Error": 0,
      "user": req.user.userName,
      "auction": req.body.auctionName
    });
  }
}

exports.viewAuctionDetailsGet = async function(req, res) {
  console.log(`Get auction called`)
  const auctionName = req.params.auction;

  let auctionDetails;
  try {
    const auctionDetailsMongoose = await Auction.getAuctionBynameAndUpdateViews(auctionName);
    if (! auctionDetailsMongoose) {
      res.render('404');
      return Promise.resolve();
    }
    auctionDetails = auctionDetailsMongoose.toObject();
  } catch(err) {
    winston.error(chalk.red(err));
    res.render('500');
    return Promise.resolve();
  }

  auctionDetails["userRating"] = await commons.userRatings(auctionDetails.user)
  // Check whether auction is followed by user or not.
  let isFollowing = await FollowedAuctions.getOneAuction({
    $and: [{
        user: req.user.userName
      },
      {
        status: 1
      },
      {
        auction: auctionName
      },
    ]
  }, {
    _id: 0
  });

  auctionDetails['isFollowing'] = 0;
  if (isFollowing) {
    auctionDetails['isFollowing'] = 1;
  }

  if(auctionDetails.user == req.user.userName) {
    auctionDetails['ownAuction'] = 1;
  } else {
    auctionDetails['ownAuction'] = 0;
  }

  // Setup date format.
  auctionDetails.listingDate = moment(auctionDetails.listingDate).format(uiDateFormat);
  auctionDetails.expirationDate = moment(auctionDetails.expirationDate).format(uiDateFormat);
  auctionDetails.roughTimeAcquired = auctionDetails.roughTimeAcquired
    ? moment(auctionDetails.roughTimeAcquired).format(uiDateFormat)
    : '-';

  // Counting no of view based on ipAddress:user==============================
  let auctionView = new AuctionViews({
    user: req.user.userName,
    auction: auctionName,
    ipv4: requestIp.getClientIp(req)
  })

  let query = {
    $and: [{
        user: req.user.userName,
      },
      {
        ipv4: auctionView.ipv4,
      },
      {
        auction: auctionName,
      }
    ]
  }

  AuctionViews.getAuctionView(query, function (err, response) {
    if (err) {
      winston.error(chalk.red(err));
    } else {
      if(response == null && auctionDetails.ownAuction == 0) {
        AuctionViews.addAuctionView(auctionView, function(err, auction) {          
          if(err) {
            winston.error(chalk.red(err));
            res.redirect('/signup');
          } else {
            Auction.updateAuctionView(auctionName, function (err) {
              if (err) winston.error(chalk.red(err));
              res.render('auction/details', {
                auction: auctionDetails,
                user: req.user.userName,
                msg: req.flash('success')
              });
            })
          }
        });
      } else {
        res.render('auction/details', {
          auction: auctionDetails,
          user: req.user.userName,
          msg: req.flash('success'),
        });
      }
    }
  });
  // =========================================================================
}

exports.listUserAuctions = function (req, res) {
  let user = req.params.username;
  let filtered = [];
  Auction.getUserAllAuctions(user, async function (err, auctions) {
    if (err) {
      res.send(JSON.stringify({
        Error: err
      }));
    } else {
      let userAuctions = JSON.parse(JSON.stringify(auctions));

      for (let i = 0; i < userAuctions.length; i++) {
        if (userAuctions[i].adminApproved == "1" &&
          userAuctions[i].status == "0" &&
          userAuctions[i].soldOut == "0") {
          userAuctions[i]["amount"] = "N/A";
          userAuctions[i]["BuyerBidder"] = "N/A";
          filtered.push(userAuctions[i])
        }
      }

      for (let i = 0; i < userAuctions.length; i++) {
        if (userAuctions[i].soldOut == 1) {
          let AuctionStat = await AuctionStats.getAuctionStats({
            auction: userAuctions[i].name
          });

          userAuctions[i]["BuyerBidder"] = AuctionStat.awardedTo;
          userAuctions[i]["amount"] = AuctionStat.finalAmmount;
          filtered.push(userAuctions[i])
        }
      }

      for (let i = 0; i < userAuctions.length; i++) {
        if (userAuctions[i].adminApproved == "1" && userAuctions[i].status == "1") {
          let auctionBid = await auctionBids.getAuctionBid({
            auction: userAuctions[i].name
          });
          if (auctionBid == null) {
            userAuctions[i]["amount"] = "N/A";
            userAuctions[i]["BuyerBidder"] = "N/A";
          } else {
            userAuctions[i]["amount"] = auctionBid.current_bid;
            userAuctions[i]["BuyerBidder"] = auctionBid.bided_by;
          }
          filtered.push(userAuctions[i])
        }
      }

      for (let i = 0; i < userAuctions.length; i++) {
        if (userAuctions[i].adminApproved == "0" && userAuctions[i].status == "0") {
          userAuctions[i]["BuyerBidder"] = "N/A";
          userAuctions[i]["amount"] = "N/A";

          filtered.push(userAuctions[i])
        }
      }

      for (let i = 0; i < filtered.length; i++) {

        let dateTime = new Date(filtered[i].expirationDate);
        filtered[i]["expirationDate"] = moment(dateTime).format(uiDateFormat);
      }
      res.render('auction/list', {
        auctions: filtered,
        user: user,
      })
    }
  });
}

exports.editAuctionGet = function (req, res) {
  let auctionName = req.params.auction;
  User.getPrimeCompanies(async function (err, data) {
    let companies = [];
    for (let i = 0; i < data.length; i++) {
      companies[i] = data[i].name;
    }
    let auction = await Auction.getAuctionByname(auctionName);
    let auctionDetails = JSON.parse(JSON.stringify(auction));
    // Removing unnecessary data from object.
    delete auctionDetails._id;
    delete auctionDetails.__v;
    auctionDetails['ownAuction'] = "";

    // Setup date format.
    let dateTime = new Date(auction.expirationDate);
    auctionDetails["expirationDate"] = moment(dateTime).format(uiDateFormat);

    if (auction.roughTimeAcquired !=  undefined) {
      let dateTime = new Date(auction.roughTimeAcquired);
      auctionDetails["roughTimeAcquired"] = moment(dateTime).format(uiDateFormat);
    }

    res.render('auction/edit', {
      auction: auctionDetails,
      companyList: companies,
      user: req.user.userName,
    });
  });
}

exports.editAuctionPost = function (req, res) {
  let modifiedAuction = {
    user: req.user.userName,
    name: req.body.auction_name,
    case: req.body.auction_case,
    os: req.body.operating_system,
    type: req.body.auction_type,
    impactedCompany: req.body.impacted_company,
    manufacturer: req.body.manufacturer,
    minimumBid: req.body.min_bid,
    buyoutPrice: req.body.buy_price,
    description: req.body.description,
  };
  if (req.body.expiration_date) {
    modifiedAuction["expirationDate"] = (new Date(req.body.expiration_date)).toISOString();
  }
  if (req.files) {
    // Remove old documents.

    modifiedAuction["document"] = req.files;
  }

  Auction.updateAuction(req.params.auction, modifiedAuction, function (err, auction) {
    if (err) {
      winston.error(chalk.red(err));
    } else {
      if (auction) {
        // Set user notification.
        commons.setUserNotification(req.user.userName,
          req.body.auction_name + " has been edited successfully.");
        res.redirect('/users/' + req.user.userName + '/auctions/' + req.body.auction_name);
      } else {
        req.flash('Email is not found');
        res.redirect(307, '/auctions');
      }
    }
  })
}

exports.checkAuctionAvailability = async function (req, res) {
  let auction = await Auction.getAuctionByname(decodeURI(req.body.auctionName));
  if (auction == null) {
    res.send({
      auctionAvailable: 0
    });
  } else {
    res.send({
      auctionAvailable: 1
    });
  }
}

// RATING AUCTION
exports.auctionRating = async function (req, res) {
  let ratingObj = {
    buyerRating: req.body.rating
  };
  Auction.updateAuction(req.params.auction, ratingObj, function (err, data) {
    // body...
    if (err) {
      winston.error(chalk.red(err));
    }
  });
  res.redirect("/users/" + req.user.userName + "/transactions")
}