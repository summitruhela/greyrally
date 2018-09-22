const chalk = require('chalk');
const ejs = require('ejs');
const flash = require('connect-flash');
const fs = require('fs');
const passport = require('passport');
const moment = require('moment');
const nodemailer = require('nodemailer');
const sb = require('satoshi-bitcoin');
const winston = require('winston');
const xssFilters = require('xss-filters');
const validator = require('validator');


// Models ..
const AdminConfig = require("../models/adminConfigs");
const Auction = require('../models/auction');
const AuctionStats = require("../models/auctionStats");
const Comments = require('../models/comments');
const FollowAuction = require('../models/followedAuctions');
const MsgLog = require('../models/messageLogs');
const Session = require('../models/session');
const User = require('../models/user');
const UserWallet = require("../models/userWallet");
const Notifications = require("../models/notifications");
const auctionBids = require("../models/auctionBids");
const wallet = require("../models/userWallet");

// Controllers ...
const commons = require('./common.controller.js');
const transactions = require('./transactions.controller.js');

// Mail credentials.
let transporter = nodemailer.createTransport({
  service: process.env.MAIL_SERVICE,
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // use SSL
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD
  }
});

//Login in functionality
exports.loginGet = function (req, res) {
  'use strict'
  if (req.user) {
    res.redirect("/");
  } else {
    res.render('login/login', {
      err: req.flash('error'),
      success: req.flash('success')
    });
  }
}

// Register functionality
exports.signupGet = function (req, res) {
  if (req.user) res.redirect("/");
  res.render('signup/signup');
}

// Home page.
exports.homePageGet = function (req, res) {
  if (req.user.role == "1") {
    res.redirect('/admin/login');
  } else {
    res.redirect('/users/' + req.user.userName + '/feed')
  }
}

// Register functionality
exports.signupPost = async function (req, res) {
console.log("!@@@@@@@@@@@@@@@@@@@@@",req.body)
  let isMailAvailable;
  try {
    isMailAvailable = await commons.checkEmailAvailability(req.body.email)
  } catch (err) {
    winston.error(chalk.red(err));
  }

  let isUsernameAvailable;
  try {
    isUsernameAvailable = await commons.checkusernameAvailability(req.body.username)
  } catch (err) {
    winston.error(chalk.red(err));
  }

  if (isUsernameAvailable && isMailAvailable) {
    req.flash('error', `Username and Email already registered.`);
    res.redirect('/login');
  } else if (isUsernameAvailable) {
    req.flash('error', `Username already registered.`);
    res.redirect('/login');
  } else if (isMailAvailable) {
    req.flash('error', `Email already registered.`);
    res.redirect('/login');
  }


  let email = xssFilters.inHTMLData(req.body.email);
  let username = xssFilters.inHTMLData(req.body.username);
  let password = req.body.password;
  let password2 = req.body.password2;
  let reason = xssFilters.inHTMLData(req.body.reason)
  let pgp = req.body.pgp.replace('Version: Keybase OpenPGP v1.0.0', '');
  let pgp2 = xssFilters.inHTMLData(pgp.replace('Comment: https://keybase.io/crypto', ''));

  if (req.body.role == "hacker") {
    //Role 2 will be for hacker...
    req.body["role"] = 2;
  } else {
    //Role 3 will be for company...
    req.body["role"] = 3;
  }
  let encryptedPin = commons.encrypt(req.body.pin);
  //var pinPromise = promisePin(req.body.pin);
  //var pinPromise = commons.promisePin(req.body.pin);
  let newUser = new User({
    email: email,
    userName: username,
    password: password,
    role: req.body.role,
    pin: encryptedPin,
    // pin: pin,
    pgp: pgp2,
    reasonToJoin: reason,
  });
  User.createUser(newUser, async function (error, user) {
    if (error) {
      winston.error(chalk.red(error));
    } else {
      let hash = commons.encrypt(newUser.userName);
      //compile ejs template into function
      let compiled = ejs.compile(fs.readFileSync('views/email-templates/register.ejs', 'utf8'));
      let html = compiled({
        hash: hash,
        host: process.env.APP_HOST,
        port: process.env.PORT
      });
      let TO_ADDRESS = newUser.email;
      let subject = "GREYRALLY - New registration";

      commons.mail(TO_ADDRESS, subject, html, async function (err, response) {
        if (err) {
          winston.error(chalk.red('ERROR!', err));
          req.flash('error', "ERROR:" + err);
          res.redirect('/login');
        } else {
          let session = new Session({
            user: user.userName,
            hash: hash,
          });

          // Storing hash in sessions.
          try {
            await Session.createSession(session);
          } catch (err) {
            winston.error(chalk.red(err));
          }

          req.flash('success', `Thanks! You're almost there. Please look for an email
            from GREY RALLY to verify your account.`);
          res.redirect('/login');
        }
      });
    }
  });
}

// Activate user account by mail address
exports.activeAccount = async function (req, res) {
  let username = commons.decrypt(req.query.hash);

  // Get session state.
  try {
    hashState = await Session.getSession({
      user: username
    });
  } catch (err) {
    hashState.status = 0;
    winston.error(chalk.red(err));
  }

  if (hashState.status == 1) {
    User.updateUserChange(username, {
      status: 1
    }, async function (err, user) {
      if (err) {
        winston.error(chalk.red(err));
      } else {
        // Expiring session hash.
        try {
          await Session.updateSession(username, {
            "status": 0
          });
        } catch (err) {
          winston.error(chalk.red(err));
        }

        // Generating new BTC address.
        try {
          response = await transactions.createBitcoinAdd(process.env.WALLET_NAME);
        } catch (err) {
          winston.error(chalk.red(err));
        }

        // Handling blockcypher api error.
        if (response.error) {
          throw response.error;
        }
console.log("@@@@@@@@@@@@@@@@@@@",user);
        // New wallet for user.
        let newWallet = new UserWallet({
          user: user.userName,
          email: user.email,
          privateAdd: commons.encrypt(response.private),
          BTCadd: response.address,
        });

        // Wallet entry in database for new bitcoin address.
        try {
          a = await UserWallet.newWalletForUser(newWallet);
        } catch (err) {
          throw err;
        }
        req.flash('success', 'Account activated successfully');
        res.redirect("/login");
      }
    });
  } else {
    req.flash('error', 'Session expired.');
    res.redirect("/login");
  }
}

// User Policies.
exports.policyGet = function (req, res) {
  if (req.isAuthenticated()) {
    res.render("policy/policy", {
      user: req.user.userName,
    });
  } else {
    res.render("policy/policy", {
      user: "NotLoggedIn",
    });
  }
}

// Forgot password.
exports.resetPasswordGet = function (req, res) {
  res.render('user/reset-password', {
    err: req.flash('error'),
    success: req.flash('success'),
  });
}

// Forgot password.
exports.resetPasswordPost = function (req, res) {
  let email = req.body.email;
  User.getUser({
    email: email
  }, function (err, user) {
    if (err) throw err;
    if (user) {
      let hash = commons.encrypt(user.userName);
      let newSession = new Session({
        user: user.userName,
        hash: hash,
      });

      Session.createSession(newSession, function (err, session) {
        if (err) winston.error(chalk.red(err));
      });

      //compile ejs template into function
      let compiled = ejs.compile(fs.readFileSync('views/email-templates/passwordReset.ejs', 'utf8'));
      let html = compiled({
        hash: hash,
        host: process.env.APP_HOST,
        port: process.env.PORT
      });
      let TO_ADDRESS = email;
      let subject = "GREYRALLY - Password Reset";
      commons.mail(TO_ADDRESS, subject, html, function (err, response) {
        if (err) {
          winston.error(chalk.red('ERROR!', err));
          return res.send('ERROR');
        } else {
          req.flash("success", "Link for reset password has been sent to your email address.");
          res.redirect('/reset-password');
        }
      });
    } else {
      req.flash('error', 'Email not registered.');
      res.redirect('/reset-password');
    }
  });
}

// Forgot password.
exports.userResetPasswordGet = async function (req, res) {
  let hash = req.query.hash;
  try {
    session = await Session.getSession({
      $and: [{
        hash: hash
      }, {
        status: "1"
      }]
    });
  } catch (err) {
    winston.error(chalk.red(err));
  }

  if (session) {
    res.render("user/confirm-reset-password", {
      hash: hash,
    });
  } else {
    req.flash('error', 'Session expired.');
    res.redirect('/login');
  }
}

// Forgot password.
exports.userResetPasswordPost = function (req, res) {
  if (req.body.password && req.body.Password2 && req.body.hash) {
    let decrypted = commons.decrypt(req.body.hash);
    User.findAndUdatePassword(decrypted, req.body.password, async function (err, data) {
      if (err) {
        winston.error(chalk.red(err));
      } else {

        try {
          await Session.updateSession(decrypted, {
            status: "0"
          });
        } catch (err) {
          winston.error(chalk.red(err));
        }

        //compile ejs template into function
        let compiled = ejs.compile(fs.readFileSync('views/email-templates/passwordResetSuccess.ejs', 'utf8'));
        let html = compiled({
          host: process.env.APP_HOST,
          port: process.env.PORT,
          timestamp: new Date(),
          browser: req.useragent.browser,
          os: req.useragent.os,
        });

        let TO_ADDRESS = data.email;
        let subject = "GREYRALLY - Password Reset";
        commons.mail(TO_ADDRESS, subject, html, function (err, response) {
          if (err) {
            winston.error(chalk.red('ERROR!', err));
            return res.send('ERROR');
          } else {
            req.flash("success", "Password Reset Successfully")
            res.redirect("/login");
          }
        });
      }
    })
  } else {
    res.redirect("/reset-password");
  }
}

// Follow auction.
exports.followAuction = async function (req, res) {

  let auction = await Auction.getAuctionByname(req.params.auction);
  let followAuction = new FollowAuction({
    user: req.params.username,
    rating: auction.adminRating,
    auction: req.params.auction,
    createdBy: auction.user,
    status: "1"
  })

  FollowAuction.followAuction(followAuction, function (err, res) {
    if (err) {
      winston.error(chalk.red(err));
    } else {
      // Set auction name for user notification.
      let auc_name = "";
      if (req.params.auction.length > 33) {
        auc_name = req.params.auction.slice(0, 30) + "...";
      } else {
        auc_name = req.params.auction;
      }
      // Set user notification.
      let newNotification = `<a class="notificationLink" href="/users/` + req.user.userName + `/auctions/` + req.params.auction + `">` + auc_name + `</a> has been followed successfully.`;
      commons.setUserNotification(req.user.userName, newNotification);
    }
  })
  const redirectToUrl = req.query.fromSrc
    ? req.query.fromSrc
    : '/users/' + req.params.username + '/feed';
  res.redirect(redirectToUrl);
}

// Unfollow auction.
exports.unfollowAuction = function (req, res) {
  let user = req.params.username;
  let auction = req.params.auction;
  FollowAuction.unfollowAuction(user, auction, function (err, res) {
    if (err) {
      winston.error(chalk.red(err));
    } else {
      // Set auction name for user notification.
      let auc_name = "";
      if (req.params.auction.length > 33) {
        auc_name = req.params.auction.slice(0, 30) + "...";
      } else {
        auc_name = req.params.auction;
      }
      // Set user notification.
      let newNotification = `<a class="notificationLink" href="/users/` + req.user.userName + `/auctions/` + req.params.auction + `">` + auc_name + `</a> has been unfollowed successfully.`;
      commons.setUserNotification(req.user.userName, newNotification);
    }
  })
  const redirectToUrl = req.query.fromSrc
    ? req.query.fromSrc
    : '/users/' + req.params.username + '/feed';
  res.redirect(redirectToUrl);
}

// Followed auctions.
exports.userFollowedAuctions = function (req, res) {
  let user = req.params.username;
  FollowAuction.getFollowedAuctions(user, async function (err, followedAuctions) {

    if (err) {
      res.send(JSON.stringify({
        Error: err
      }));
    } else {
      let a = JSON.parse(JSON.stringify(followedAuctions));

      for (let i = 0; i < followedAuctions.length; i++) {
        a[i]["auctionDetails"] = await Auction.getAuctionByname(a[i].auction);

        a[i]["date"] = moment(a[i]["auctionDetails"].expirationDate).format("YYYY-MM-DD HH:mm");
      }

      res.render('user/followed', {
        followedAuctions: a,
        user: user,
      })
    }
  });
}

// User feed.
exports.userFeed = async function (req, res) {
  let date = new Date();
  let allAuctionList = await Auction.getAuctions({
    "status": "1",
    "adminApproved": "1",
    "soldOut":{$ne:1}
  })
  let auctionListUser = await Auction.getAuctions({
    "user": req.user.userName
  });
  //console.log(`Hot auctionsList ${allAuctionList.length} and auctionUserList  ${auctionListUser.length}`)
  let AuctionTotal = allAuctionList.length 

  FollowAuction.getFollowedAuctions(req.params.username, function (err, followedAuction) {
    if (err) winston.error(chalk.red(err));
    let limit = req.query.limit || 10;
    Auction.hotAuctions(limit, async function (err, hotAuctions) {
      if (err) {
        res.send("Error", err);
      } else {

        // Remove auction which already followed by current user.
        for (let i = 0; i < hotAuctions.length; i++) {
          hotAuctions[i] = JSON.parse(JSON.stringify(hotAuctions[i]));
          for (let j = 0; j < followedAuction.length; j++) {
            if (hotAuctions.length &&
              followedAuction[j].user == req.params.username &&
              hotAuctions[i].name == followedAuction[j].auction) {
              hotAuctions[i]["following"] = 1;
            }

            if (hotAuctions[i].user == req.user.userName) {
              hotAuctions[i]["ownAuction"] = 1;
            }
          }
        }

        // Remove expired auction.
        for (let i = 0; i < hotAuctions.length; i++) {
          let q = new Date();
          let m = q.getMonth();
          let d = q.getDate();
          let y = q.getFullYear();
          let date = new Date(y, m, d);

          if (date > hotAuctions[i].expirationDate) {
            if (hotAuctions[i].currentBid > 0) {
              obj = {
                "status": 0,
                "soldOut": 1
              };
            } else {
              obj = {
                "status": 0
              };
            }
            Auction.updateAuction(hotAuctions[i].name, obj, function (err) {
              if (err) {
                winston.error(chalk.red(err));
              } else {
                if (Number(hotAuctions[i].currentBid) > 0) {
                  // Entry will be inserted into db as sold out.
                  let auctionStats = new AuctionStats({
                    auction: hotAuctions[i].name,
                    auctionCreatedBy: hotAuctions[i].user,
                    awardedTo: req.user.userName,
                    finalAmmount: ((Number(hotAuctions[i].currentBid)) + 5),
                  });

                  try {
                    ab = AuctionStats.newEntry(auctionStats);
                  } catch (err) {
                    throw err;
                  }
                }
                hotAuctions.splice(i, 1);
              }
            })
          }
        }
      }
      
      let a = JSON.parse(JSON.stringify(hotAuctions));
      //Formating time stamp.
      for (let i = 0; i < a.length; i++) {
        let dateTime = new Date(a[i].expirationDate);
        a[i]["expirationDate"] = moment(dateTime).format("YYYY-MM-DD HH:mm");
        a[i]["userRating"] = await commons.userRatings(a[i].user);
      }
      res.render('user/feed', {
        hotAuctions: a,
        user: req.params.username,
        Auctionslength: AuctionTotal,
      })
    });
  })
}

// User profile.
exports.showUserProfile = function (req, res) {

  User.getUser({
      $and: [{
        userName: req.user.userName
      }, {
        deletedAt: ""
      }]
    },
    async function (err, user) {
      if (err) {
        winston.error(chalk.red(err));
      } else {
        try {
          created = await AuctionStats.countActiveAuctionsUserwise({
            "auctionCreatedBy": req.user.userName
          });
        } catch (err) {
          winston.error(chalk.red(err));
        }

        try {
          allAuctionList = await Auction.getAuctions({
            "status": "1",
            "adminApproved": "1"
          })
        } catch (err) {
          winston.error(chalk.red(err));
        }

        try {
          auctionCount = await Auction.countActiveAuctionsUserwise({
            "user": req.user.userName,
            "status": "1"
          });
        } catch (err) {
          winston.error(chalk.red(err));
        }


        rating = await commons.userRatings(req.user.userName)


        try {
          bought = await AuctionStats.countActiveAuctionsUserwise({
            "awardedTo": req.user.userName
          });
        } catch (err) {
          winston.error(chalk.red(err));
        }

        res.render("user/profile", {
          user: user.userName,
          errMsg: "",
          userInfo: user,
          created: created,
          bought: bought,
          rating: rating,
        });
      }
    }
  );
}

// Edit user profile.
exports.editUserGet = function (req, res) {
  res.render('user/edit-profile');
}

// Enable User.
exports.enableUser = function (req, res) {
  if (!req.user.userName) res.redirect(307, '/login');

  let obj = {
    "status": "1"
  };
  User.updateUser(req.user.userName, obj, function (err) {
    if (err) {
      winston.error(chalk.red(err));
    } else {
      Auction.updateMultiple(req.user.userName, {
        "status": "1"
      }, function (err) {
        if (err) {
          winston.error(chalk.red(err));
        } else {
          res.sendStatus(200);
        }
      })
    }
  })
}

// Change user password.
exports.changePass = function (req, res, done) {
  let reg = /[^a-zA-Z0-9]/g;
  if (req.user && req.user.pin == req.body.passPIN) {

    if ((req.body.newPwd.match(reg) == null) || (req.body.newPwd.length < 8)) {
      return res.status(200).send("4");
    }

    if (req.body.newPwd != req.body.cnfPwd) {
      return res.status(200).send("2");
    }

    User.getUser({
      userName: req.user.userName
    }, function (err, user) {
      if (err) throw err;
      if (!user) {
        return done(null, false, {
          message: 'Unknown User'
        });
      }
      User.comparePassword(req.body.oldPwd, user.password, function (err, isMatch) {
        if (err) winston.error(chalk.red(err));
        if (isMatch) {
          User.findAndUdatePassword(req.user.userName, req.body.newPwd, function (err, data) {
            if (err) {
              winston.error(chalk.red(err));
            } else {
              // Set user notification.
              commons.setUserNotification(req.user.userName,
                "Your password has been changed successfully");
              res.status(200).send("1");
            }
          })
        } else {
          res.status(200).send("0");
        }
      });
    });
  } else {
    res.status(200).send("3");
  }
}

// Change user email.
exports.changeEmail = function (req, res) {
  if (!validator.isEmail(req.body.email)) {
    return res.status(200).send("0");
  }
  if (req.user && req.user.pin == req.body.PIN) {
    User.updateUser(req.user.userName, {
      email: req.body.email
    }, function (err) {
      if (err) {
        winston.error(chalk.red(err));
        res.status(200).send("3");
      } else {
        commons.setUserNotification(req.user.userName,
          "Your email has been changed successfully");
        res.status(200).send("1");
      }
    })
  } else {
    res.status(200).send("2");
  }
}

// Change user PIN.
exports.changePIN = function (req, res) {

  if (req.user && commons.decrypt(req.user.pin) == JSON.stringify(req.body.oldPIN)) {
    
    if ((req.body.newPIN != req.body.cnfPIN) || (req.body.newPIN.length != 6)) {
      return res.status(200).send("2");
    }

    let encryptPIN = commons.encrypt(req.body.newPIN);

    User.updateUser(req.user, {
      pin: encryptPIN.toString()

    }, function (err) {
      if (err) {
        winston.error(chalk.red(err));
        res.status(200).send("0");
      } else {
        commons.setUserNotification(req.user.userName,
          "Your PIN has been changes successfully.");
        res.status(200).send("1");
      }
    });
  } else {
    res.status(200).send("0");
  }
}

// Change user's PGP public key.
exports.changePGP = function (req, res) {
  if (req.user && req.user.pin == req.body.pgpPIN) {
    if (validator.isEmpty(req.body.pgp)) {
      return res.status(200).send("3");
    }
    let pgp = req.body.pgp.replace('Version: Keybase OpenPGP v1.0.0', '');
    let pgp2 = pgp.replace('Comment: https://keybase.io/crypto', '');
    User.updateUser(req.user.userName, {
      pgp: xssFilters.inHTMLData(pgp2)
    }, function (err) {
      if (err) {
        winston.error(chalk.red(err));
        res.status(200).send("4");
      } else {
        commons.setUserNotification(req.user.userName,
          "Your PGP key has been changes successfully.");
        res.status(200).send("1");
      }
    })
  } else {
    res.status(200).send("2");
  }
}

// Bid on auction.
exports.bidAuction = async function (req, res) {
  if (req.user.pin != req.body.pin) {
    return res.status(200).send("2");
  }
  let newBid = {
    currentBid: req.body.bid
  };
  try {
    a = await wallet.getUserWallet({
      user: req.params.username
    });
  } catch (err) {
    winston.error(chalk.red(err));
  }

  if (a == null) {

    // Generating new BTC address.
    try {
      response = await transactions.createBitcoinAdd(process.env.WALLET_NAME);
    } catch (err) {
      throw err;
    }

    let newWallet = new UserWallet({
      user: req.params.username,
      email: req.user.email,
      privateAdd: commons.encrypt(response.private),
      BTCadd: response.address,
    });

    // Wallet entry in database for new bitcoin address.
    try {
      a = await UserWallet.newWalletForUser(newWallet);
    } catch (err) {
      throw err;
    }
  }

  // Get admin commission and transaction charge.
  try {
    config = await AdminConfig.getAdminConfig();
  } catch (err) {
    winston.error(err);
  }

  // Current Auction details.
  try {
    auction = await Auction.getAuctionByname(req.params.auction);
  } catch (err) {
    winston.error(chalk.red(err));
  }

  try {
    balance = await transactions.getAddrbalance(a.BTCadd);
  } catch (err) {
    throw err;
  }

  /* =========================================================================
    Other coast will be apply to buyer. It will be two fees of mining
    (0.0001 + 0.0001 BTC) which will be (1.64 USD + 1.64 USD = 3.28 USD)
    and admin commission will be % of auction price.
    ==========================================================================
  */

  // For 100 rs of auction and 10% admin commission will bw 10. So, commission = 10*100/100 =10.
  let adminCommission = (Number(config.commission) * (Number(newBid.currentBid))) / 100;
  // Transaction charge.
  let otherCost = adminCommission + (2 * Number(config.transactionCharge));
  // If Wallet have sufficient balance, Auction will move to admin confirmation.
  if (sb.toBitcoin(balance.balance + balance.unconfirmed_balance) > ((Number(newBid.currentBid) + otherCost))) {
    if (auction) {
      // Remove previous bid.
      try {
        aa = auctionBids.updateAuctionBid(req.params.auction, {
          "status": 0
        });
      } catch (err) {
        throw err;
      }

      // Add current bid as latest bid.
      let auctionBid = new auctionBids({
        auction: req.params.auction,
        auction_created_by: auction.user,
        bided_by: req.user.userName,
        last_bid: auction.currentBid,
        current_bid: req.body.bid,
        status: 1
      });

      // Set notification for bidder.
      commons.setUserNotification(auction.user,
        "Your auction " + req.params.auction + " has got bid of " + req.body.bid);

      // Set notification for seller.
      commons.setUserNotification(req.user.userName,
        "Your bid of " + req.body.bid + "for auction " + req.params.auction + "has been place successfully");

      try {
        aa = auctionBids.newEntry(auctionBid);
      } catch (err) {
        throw err;
      }
    } else {
      res.render("error");
    }

    Auction.updateAuction(req.params.auction, newBid, async function (err) {
      let btc = await commons.BTC(); // Getting bitcoin price.
      if (err) {
        winston.error(chalk.red(err))
      } else {
        req.io.emit('bidUpdate', {
          auction: req.params.auction,
          newBid: req.body.bid,
          bitcoinPrice: btc,
        });
        res.status(200).send("1");
      }
    })
  } else {
    res.status(200).send("0");
  }
}

// User review
exports.userReview = async function (req, res) {
  user = req.params.username;

  // Auction created by user.
  try {
    createdAuctions = await Auction.getAuctions({
      $and: [{
        user: user
      }, {
        status: 1
      }]
    });
  } catch (err) {
    winston.error(chalk.red(err));
  }

  // Auction purchased by user.
  try {
    purchased = await AuctionStats.getAuctionStats({
      $and: [{
        awardedTo: user
      }, {
        status: 1
      }]
    });
  } catch (err) {
    winston.error(chalk.red(err));
  }

  res.render('user/user-review', {
    user: req.user.userName,
    buyerOrSeller: user,
    created: createdAuctions,
    purchased: purchased,
  });
}

exports.landingPage = async function (req, res) {
  if (req.user) {
    return res.redirect('/' + req.user.userName);
  }

  let limit = req.query.limit || 10;
  let allAuctionList = await Auction.getAuctions({
    "status": "1",
    "adminApproved": "1"
  })

  Auction.hotAuctions(limit, async function (err, hotAuctions) {
    // let filtered = [];
    if (err) {
      res.send("Error", err);
    } else {
      let a = JSON.parse(JSON.stringify(hotAuctions));

      // Formating time stamp.
      for (let i = 0; i < a.length; i++) {
        let dateTime = new Date(a[i].expirationDate);
        a[i]["expirationDate"] = moment(dateTime).format("YYYY-MM-DD HH:mm");

        a[i]["userRating"] = await commons.userRatings(a[i].user)
      }
      res.render('landing', {
        hotAuctions: a,
        AuctionTotal: allAuctionList.length
      })
    }
  });
}


// Check login status for auction view.
exports.checkLoginStatus = function (req, res) {
  if (req.user) {
    res.redirect('/users/' + req.user.userName + '/auctions/' + req.params.auction);
  } else {
    res.redirect('/login');
  }
}

// Check login status for follow auction.
exports.preFollowAuction = function (req, res) {
  if (req.user) {
    let followUrl = '/users/' + req.user.userName + '/auctions/' + req.params.auction + '/follow';
    if (req.query.fromSrc) {
      followUrl += '?fromSrc=' + req.query.fromSrc;
    }
    res.redirect(followUrl);
  } else {
    res.redirect('/login');
  }
}

// Validate logged in user PIN.
exports.validatePIN = function (req, res) {
  if (req.user && req.user.pin == req.body.PIN) {
    res.status(200).json({
      status: 1
    });
  } else {
    res.status(200).json({
      status: 0
    });
  }
}

// Count no of unread notification by logged in user.
exports.countNotifications = async function (req, res) {

  let notificationsAndUnreadCount;
  try {
    notificationsAndUnreadCount = await Notifications.getNonDeletedNotificationsAndUnreadCountForUser(req.body.user);
  } catch (err) {
    winston.error(chalk.red(err));
    res.status(500).send({
      err: err
    })
  }

  notificationsAndUnreadCount.notifications = notificationsAndUnreadCount.notifications.map(notification => {
    notification = notification.toObject();
    notification.createdAt = moment(notification.createdAt).format("YYYY-MM-DD HH:mm");
    notification.id2 = commons.encrypt(notification._id).toString();
    return notification
  });

  res.status(200).send(notificationsAndUnreadCount);
}

exports.removeCurrentUserNotification = async function (req, res) {

  if (! req.user || ! req.user.userName) {
    res.status(403).send();
    return;
  } 
  const notificationId = req.body.notificationId;

  try {
    await Notifications.markNotificationToBeDeletedForUser(notificationId, req.user.userName);
    res.status(204).send();
  } catch (err) {
    winston.error(chalk.red(err));
    res.status(500).send({
      err: err
    });
  }
}

// Marks the current users notifications read.
exports.markCurrentUserNotificationsRead = async function (req, res) {
  if (! req.user || ! req.user.userName) {
    res.status(403).send();
    return;
  } 

  try {
    const markedReadCount = await Notifications.markNotificationsReadForUser(req.user.userName);
    res.status(204).send();
  } catch (err) {
    winston.error(chalk.red(err));
    res.status(500).send({
      err: err
    });
  }

}

exports.seller = async function (req, res) {
  let allAuctionList = await Auction.getAuctions({
    "status": "1",
    "adminApproved": "1"
  })

  User.getUser({
    userName: req.params.sellername
  }, async function (err, user) {
    if (err) throw err;
    if (user) {
      let allRatingDetails = [];
      rating = await commons.userRatings(user.userName);
      allRatingDetails[0] = await commons.userRatingsCount(user.userName, "30Days");
      allRatingDetails[1] = await commons.userRatingsCount(user.userName, "3Months");
      allRatingDetails[2] = await commons.userRatingsCount(user.userName, "");
      user["date"] = moment(user["createdAt"]).format("YYYY-MM-DD HH:mm");
      res.render("user/seller-rating", {
        user: req.user.userName,
        seller: user,
        rating: rating,
        allRatingDetails: allRatingDetails,
      })
    }
  })
}


exports.buyer = async function (req, res) {

  User.getUser({
    userName: req.params.buyername
  }, async function (err, user) {
    if (err) throw err;
    if (user) {
      let allAuctionList = await Auction.getAuctions({
        "status": "1",
        "adminApproved": "1"
      })
      let allRatingDetails = [];
      rating = await commons.userRatings(user.userName)
      allRatingDetails[0] = await commons.userRatingsCount(user.userName, "30Days");
      allRatingDetails[1] = await commons.userRatingsCount(user.userName, "3Months");
      allRatingDetails[2] = await commons.userRatingsCount(user.userName, "");
      user["date"] = moment(user["createdAt"]).format("YYYY-MM-DD HH:mm");
      res.render("user/buyer-rating", {
        user: req.user.userName,
        buyer: user,
        rating: rating,
        allRatingDetails: allRatingDetails,
      })
    }
  })
}