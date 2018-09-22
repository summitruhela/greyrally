const chalk = require('chalk');
const datatablesQuery = require('datatables-query');
const sb = require('satoshi-bitcoin');
const bcypher = require('blockcypher');
const bitcoin = require("bitcoinjs-lib");
const bigi    = require("bigi");
const buffer  = require('buffer');
const winston = require('winston');

// Models ...
const AdminConfig = require("../../models/adminConfigs");
const Auction = require('../../models/auction');
const AuctionBids = require('../../models/auctionBids');
const AuctionStats = require('../../models/auctionStats');
const Transactions = require('../../models/transactions');
const User = require('../../models/user');
const UserWallet = require('../../models/userWallet');

// Controllers ...
const commons = require('../common.controller.js');
const transactions = require('../transactions.controller.js');

exports.signinGet = function(req,res) {
  'use strict'
  res.render('admin/login', {
    err: req.flash('error'),
    success: req.flash('success')
  });
}

exports.dashboard = function(req, res) {
  res.render('admin/dashboard');
}

exports.users = function(req, res) {
  res.render('admin/dashboard');
}

exports.userList = function(req, res) {
  let params = req.body;
  let query = datatablesQuery(User);
  query.run(params).then( async function (data) {
    // No of active auctions by each users.
    for(let i=0; i<data.data.length; i++) {
      // If user is active then only auction will be count.
      if(data.data[i].status == '1') {
        let query = { $and : [ { user: data.data[i].userName }, { status: 1 } ] };
        let count = await Auction.countActiveAuctionsUserwise(query);
        data.data[i] = JSON.parse(JSON.stringify(data.data[i]));
        data.data[i]["activeAuctions"] = count;
      } else {
        data.data[i] = JSON.parse(JSON.stringify(data.data[i]));
        data.data[i]["activeAuctions"] = "-";
      }
    }
    //console.log(`Users for admin are ${JSON.stringify(data)}`)
    res.status(200).send(data);
  }, function (err) {
    res.status(500).json(err);
  });
}

exports.auctions = function(req, res) {
  res.render('admin/auctions');
}

exports.auctionList = function (req, res) {
  //console.log(`Request for getting auction list ${JSON.stringify(req.body)}`)
  let params = req.body;
  let query = datatablesQuery(Auction);
  query.run(params).then( function (data) {
    //console.log(`Auction list data ${JSON.stringify(data)}`)
    res.status(200).send(data);
  }, function (err) {
    res.status(500).json(err);
  });
}

exports.dashboard = function(req, res) {
  res.render('admin/dashboard');
}

exports.auctionDetails = async function(req, res) {
  
  let auctionName = req.params.auction;

  try {
    auction = await Auction.getAuctionByname(auctionName);
  } catch(err) {
    winston.error(chalk.red(err));
    res.send(JSON.stringify({ Error: err }));
  }
  let auctionDetails = JSON.parse(JSON.stringify(auction));
  
  // Removing unnecessary data from object.
  delete auctionDetails._id;
  delete auctionDetails.__v;
  auctionDetails['ownAuction'] = 1;

  // Setup date format.
  auctionDetails["listingDate"] = auction.listingDate.toISOString()
                                    .replace(/T/, ' ')
                                    .replace(/\..+/, '');
  res.render('admin/auctionDetails', {
    auction: auctionDetails,
  });

}

exports.userDetails = function(req, res) {
  User.getUser( { $and: [ { userName: req.params.username } ] },
    async function(err, user) {
      if(err) winston.error(chalk.red(err));
      if(user) {
        let allAuctionList = await Auction.getAuctions({ "status": "1", "adminApproved": "1" })
          /*
          calculate user-rating using following formula
          userRating = 1/10 (num_comments + 10 * num_auctions + 10 * sum_review_scores)
        */
        let auctionCount = await Auction.countActiveAuctionsUserwise({"user" : req.params.username, "status": "1"});
        let totalRating = ((1/10)*0 + ( 10 * allAuctionList.length) + (10 * 1));
        let userRating =  ((1/10)*0 + ( 10 * auctionCount) + (10 * 1));
        let Rating = Math.round(((userRating * 5) / totalRating));
        res.render("admin/userDetails", {
          userInfo: user,
          Rating:Rating
        });
      }
    }
  );


}

exports.approveAuction = function (req, res) {
  let expirationDate = (new Date(new Date().setDate(new Date().getDate() + 30))).toISOString();
  let obj = { "adminApproved" : 1, "adminRating": req.body.rating, "status": 1,
              "expirationDate":expirationDate, "disapprovalReason":"" };
  Auction.updateAuction(req.params.auction, obj, async function(err, auction) {
    if (err) {
      winston.error(chalk.red(err));
    } else {
      auction = await Auction.getAuctionByname(req.params.auction);
      // Set auction name for user notification.
      let auc_name = "";
      if (auction.name > 33) {
        auc_name = auction.name(0, 30) + "...";
      } else {
        auc_name = auction.name;
      }
      // Set user notification.
      let notification = `<a class="notificationLink" href="/users/`+ auction.user +`/auctions/`+ auction.name +`"> `+auction.name+` </a> has been approved by GREYRALLY and live now. `;
      commons.setUserNotification(auction.user, notification);
      res.redirect('/admin/auctions/');
    }
  })
}

exports.unapproveAuction = function (req, res) {
  let obj = { "adminApproved" : 0, "status": 0, "disapprovalReason": req.body.reason };
  Auction.updateAuction(req.params.auction, obj, async function(err, auction) {
    if (err) {
      winston.error(chalk.red(err));
    } else {
      auction = await Auction.getAuctionByname(req.params.auction);
      // Set auction name for user notification.
      let auc_name = "";
      if (auction.name > 33) {
        auc_name = auction.name(0, 30) + "...";
      } else {
        auc_name = auction.name;
      }
      // Set user notification.
      let notification = auction.name+` unapproved by GREYRALLY. contact team for more information.`;
      commons.setUserNotification(auction.user, notification);
      res.redirect('/admin/auctions/');
    }
  })
}

exports.enableAuction = function (req, res) {
  Auction.updateAuction(req.params.auction, { "status" : 1 }, function(err, auction) {
    if (err) {
      winston.error(chalk.red(err));
    } else {
      res.redirect('/admin/auctions/');
    }
  })
}

exports.disableAuction = function (req, res) {
  Auction.updateAuction(req.params.auction, { "status" : 0 }, function(err, auction) {
    if (err) {
      winston.error(chalk.red(err));
    } else {
      res.redirect('/admin/auctions/');
    }
  })
}

exports.enableUser = function (req, res) {
  //console.log(`Enable user api hit ${req.params.username}`)
  let obj = { "deletedAt" : "", "status": 1 };
  User.updateUser(req.params.username, obj, function(err) {
    if (err) {
      winston.error(chalk.red(err));
    } else {
      Auction.updateMultiple(req.params.username, { "status": 1 }, function(err) {
        if (err) {
          winston.error(chalk.red(err));
        } else {
          res.redirect('/admin/users/');
        }
      })
    }
  })
}

exports.disableUser = function(req, res) {
  //console.log(`Disable user api hit ${req.params.username}`)
  let obj = { "deletedAt" : new Date(), "status": 0 };
  User.updateUser(req.params.username, obj, function(err,succ) {
    if (err) {
      winston.error(chalk.red(err));
    } else {
      //console.log(`Success of delete is ${JSON.stringify(succ)}`)
      Auction.updateMultiple(req.params.username, { "status": 0 }, function(err) {
        if (err) {
          winston.error(chalk.red(err));
        } else {
          res.redirect('/admin/users/');
        }
      })
    }
  })
}

exports.auctionBids = function(req, res) {
  res.render('admin/auctionBids');
}

exports.auctionBidList = function(req, res) {
 let params = req.body;
  let query = datatablesQuery(AuctionBids);
  query.run(params).then(function (data) {
    res.status(200).send(data);
  }, function (err) {
    res.status(500).json(err);
  });
}

exports.auctionStatsList = function(req, res) {
  res.render('admin/auctionStats');
}

exports.auctionStats = function(req, res) {
  let params = req.body;
  let query = datatablesQuery(AuctionStats);
  query.run(params).then(function (data) {
    res.status(200).send(data);
  }, function (err) {
    res.status(500).json(err);
  });
}

// Confirm transaction by admin.
exports.confirmTransaction = async function(req, res) {
  try {
    auctionStats = await AuctionStats.getAuctionStats({"auction": req.params.auction });
  } catch(err) {
    winston.error(chalk.red(err));
  }

  // Wallet information of buyer with current BTC address.
  try {
    buyer = await UserWallet.getUserWallet({ $and: [ { user: auctionStats.awardedTo }, { status: "1" } ]});
  } catch(err) {
    winston.error(chalk.red(err));
  }

  // Wallet information of seller with current BTC address.
  try {
    seller = await UserWallet.getUserWallet({ $and: [ { user: auctionStats.auctionCreatedBy }, { status: "1" } ]});
  } catch(err) {
    winston.error(chalk.red(err));
  }

  // Getting admin commission and transaction charge.
  try {
    config = await AdminConfig.getAdminConfig();
  } catch(err) {
    winston.error(chalk.red(err));
  }

  // transfer funds from buyer to seller.
  let ammountInSatoshi = sb.toSatoshi(auctionStats.finalAmmount);
  let keys = new bitcoin.ECPair(bigi.fromHex(commons.decrypt(buyer.privateAdd)));
  let obj = {
    inputs: [{addresses: [buyer.BTCadd]}],
    outputs: [{addresses: [ process.env.GREYRALLY_BTC_PUBLIC_ADDRESS ], value: Math.round(ammountInSatoshi)}],
    fees: sb.toSatoshi(Number(config.transactionCharge)),
    preference: "low"
  }

  // Start transaction. Crucial part.
  try {
    response = await transactions.transferFund(obj, keys);
  } catch(err) {
    throw err;
  }

  let trs = new Transactions({
    amount: auctionStats.finalAmmount,
    transactionInfo: response,
    buyer: buyer.user,
    seller: seller.user,
    fromBTC: buyer.BTCadd,
    toBTC: seller.BTCadd,
    auction: auctionStats.auction,
  })

  try {
    let a = await Transactions.newTransaction(trs);
  } catch(err) {
    throw err;
  }

  try {
    let a = AuctionStats.updateAuctionStats(req.params.auction, { adminApproved: 1, status: 0 });
  } catch(err) {
    throw err;
  }
  res.redirect('/admin/auctions/stats');
}

exports.changePasswordGet = function(req, res) {
  res.render('admin/changePassword', {
    err: "",
    success: "",
  });
}

exports.changePasswordPost = function(req, res) {
  User.getUser( { role: 1 }, function(err, user) {
    if(err) throw err;
    if(!user) {
      return done(null, false, { message: 'admin not exists' });
    }
    User.comparePassword(req.body.old_pwd, user.password, function(err, isMatch) {
      if(err) winston.error(chalk.red(err));
      if(isMatch) {
        User.findAndUdatePassword(req.user.email, req.body.new_pwd, function(err, data) {
          if(err) {
            winston.error(chalk.red(err));
          } else {
            // Send email to admin about reset password.
            res.render('admin/changePassword', {
              err: "",
              success: 'Password changed succesfully.'
            });
          }
        })
      } else {
        // Send email to admin about unsuccessful reset of password.
        res.render('admin/changePassword', {
          err: 'Password can not be change. Enter correct old password.',
          success: "",
        });
      }
    });
  });
}

exports.adminSettings = async function(req, res) {
  try {
    config = await AdminConfig.getAdminConfig();
  } catch(err) {
    throw err;
  }

  if(config === null) {
    try {
      config = await AdminConfig.saveConfig();
    } catch(err) {
      throw err;
    }
  }

  res.render('admin/settings', {
    config: config,
  });
}

exports.changeSetting = async function(req, res) {
  let obj = {
    transactionCharge: req.body.transactionCharge,
    commission: req.body.commission,
  }
  try {
    config = await AdminConfig.updateSetting(obj);
  } catch(err) {
    throw err;
  }
  res.redirect('/admin/settings');
}

exports.transactions = function(req, res) {
  res.render('admin/transactions');
}

// All the transactions.
exports.allTransactions = function(req, res) {
  let params = req.body;
  let query = datatablesQuery(Transactions);
  query.run(params).then(function (data) {
    res.status(200).send(data);
  }, function (err) {
    res.status(500).json(err);
  });
}

exports.transactionInfo = async function(req, res) {
  let hash = req.params.hash;
  try {
    transactionInfo = await transactions.getTransactionInfo(hash);
  } catch(err) {
    winston.error(chalk.red(err));
  }

  let obj = {
    blockHash: transactionInfo.block_hash,
    blockHeight: transactionInfo.block_height,
    blockIndex: transactionInfo.block_index,
    hash: transactionInfo.hash,
    fromAddress: transactionInfo.addresses[0],
    toAddress: transactionInfo.addresses[1],
    amount: sb.toBitcoin(transactionInfo.total),
    fee: sb.toBitcoin(transactionInfo.fees),
    confirmations: transactionInfo.confirmations,
    receivedAt: transactionInfo.received,
  }

  res.render('admin/transactionInfo', {
    info: obj,
  });
}
