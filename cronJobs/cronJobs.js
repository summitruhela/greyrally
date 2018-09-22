const bigi = require("bigi");
const bitcoin = require("bitcoinjs-lib");
const chalk = require('chalk');
const ejs = require('ejs');
const fs = require('fs');
const nodemailer = require('nodemailer');
const sb = require('satoshi-bitcoin');
const winston = require('winston');
const async = require('async');

// Models ...
const Auction = require('../models/auction');
const AuctionStats = require("../models/auctionStats");
const AuctionBids = require("../models/auctionBids");
const AdminConfig = require("../models/adminConfigs");
const Cashouts = require("../models/cashouts");
const Transactions = require("../models/transactions");
const User = require("../models/user");
const FollowedAuction = require('../models/followedAuctions');
const cronPurge = require('../models/cronPurge');

// Controllers ...
const commons = require("../controllers/common.controller");
const trxController = require("../controllers/transactions.controller");

// Check if auction expired. If expired and bid is there then auction will be
//  sold out to that bidder.
exports.checkAuctionExpiry = async function(db) {
  try {
    auctions = await Auction.getAuctions({ status : 1 });
  } catch(err) {
    winston.error(err);
  }

  for(let i=0; i<auctions.length; i++) {
    let q = new Date();
    let m = q.getMonth();
    let d = q.getDate();
    let y = q.getFullYear();
    let date = new Date(y,m,d);
    if(new Date().getTime() > auctions[i].expirationDate.getTime()) {
      if(auctions[i].currentBid > 0) {
        obj = { "status": 0, "soldOut": 1,  };
      } else {
        obj = { "status": 0 };
      }
      Auction.updateAuction(auctions[i].name, obj, async function(err,result) {
        if (err) {
          winston.error(chalk.red(err));
        } else {
          // FollowedAuction.unfollowAuctions({"auction":auctions[i].name});
          if(Number(auctions[i].currentBid) > 0) {
            // Get information of last bid on expired auction.
            try {
              let query = { $and: [ { auction: auctions[i].name }, { status: 1}]};
              lastBid = await AuctionBids.getAuctionBid(query);
            } catch (err) {
              winston.error(err);
            }


            //Remove all people following the auction
           FollowedAuction.removeFollUsers(auctions[i].name,(err,result)=>{
             console.log("USERS FOLLOWING AUCTION "+auctions[i].name+" ARE REMOVED.");
           })


            // Getting admin commission and transaction charge.
            try {
              config = await AdminConfig.getAdminConfig();
            } catch(err) {
              winston.error(err);
            }

            //====== Final amount calculation ==================================

              // finalAmount = (% commission on bid price) + transaction charge. + bid

            //==================================================================

            let adminCommission = (Number(config.commission) * (Number(auctions[i].currentBid)))/100;
            let finalAmount = adminCommission + Number(config.transactionCharge) + (Number(auctions[i].currentBid));

            // Entry will be inserted into db as sold out.
            let auctionStats = new AuctionStats ({
              auction : auctions[i].name,
              auctionCreatedBy : auctions[i].user,
              awardedTo : lastBid.bided_by,
              finalAmmount : finalAmount,
            });

            try {
              AuctionStats.newEntry(auctionStats);
            } catch(err) {
              throw err;
            }

            // Seller information.
            try {
              seller = await User.getOneUser({ userName: auctions[i].user });
            } catch(err) {
              winston.error(err);
            }

             // An email will be send to seller.
            let compiled = ejs.compile(fs.readFileSync('views/email-templates/auctionWonImmediate.ejs', 'utf8'));
            let html = compiled({
              "auction_name" : auctions[i].name,
              "final_bid_amount" : auctions[i].currentBid,
              "crypto_type" : "USD"
            });
            let TO_ADDRESS = seller.email;
            let subject = "GREYRALLY - Auction sold out";
            commons.mail(TO_ADDRESS, subject, html, async function(err, response) {
              if(err) {
                winston.error(chalk.red('ERROR!', err));
              } else {
                // An email will be send to buyer.
                let compiled2 = ejs.compile(fs.readFileSync('views/email-templates/auctionWon.ejs', 'utf8'));
                let html2 = compiled2({
                  "auction_name" : auctionDetails.name,
                  "final_bid_amount" : ((Number(auctionDetails.buyoutPrice)) + otherCost),
                  "crypto_type" : "USD"
                });

                // Buyer information.
                try {
                  buyer = await User.getOneUser({ userName: lastBid.bided_by });
                } catch(err) {
                  winston.error(err);
                }

                let BUYER_ADDRESS = buyer.email;
                let subject2 = "GREYRALLY - Auction won";
                commons.mail(BUYER_ADDRESS, subject2, html2, function(err, response) {
                  if(err) {
                    winston.error(chalk.red('ERROR!', err));
                  }
                });
              }
            });
          }
          else{
            //if it did not sell then insert expiration date into new collection cron purge.
              cronPurge.createCronPurge({auctionId:auctions[i].expirationDate},(err,result)=>{
                if(err)
                winston.error(chalk.red('ERROR!', err));
              })
            //if it did not sell then an email is sent asking if they would like to relist
            try {
              seller = await User.getOneUser({ userName: auctions[i].user });
            } catch(err) {
              winston.error(err);
            }
             // An email will be send to seller.
            let compiled = ejs.compile(fs.readFileSync('views/email-templates/auctionWonImmediate.ejs', 'utf8'));
            let html = compiled({
              "auction_name" : auctions[i].name,
              "final_bid_amount" : auctions[i].currentBid,
              "crypto_type" : "USD"
            });
            let TO_ADDRESS = seller.email;
            let subject = "GREYRALLY - Auction not sold";
            commons.mail(TO_ADDRESS, subject, html, async function(err, response) {
              if(err) {
                winston.error(chalk.red('ERROR!', err));
              } else {
                console.log("EMAIL IS SENT TO SELLER FOR RELIST.");
              }
            })
          }
        }
      })
    }
  }
}

exports.checkTransactionStatus = async function(db) {
  // Get all the unconfirmed transactions.
  try {
    txs = await Transactions.getTransactions({ status : 1 });
  } catch(err) {
    winston.error(err);
  }

  for(let i=0; i<txs.length; i++) {
    // Get latest confirmations of a transactions.
    try {
      txInfo = await trxController.getTransactionInfo(txs[i].transactionInfo.tx.hash);
    } catch(err) {
      winston.error(chalk.red(err));
    }
    /* If transaction has more then 6 confirmation it will changed as confirmed
        transaction. otherwise it's remains unconfirmed.*/
    if(txInfo.confirmations > 6) {
      // ============================ Mail buyer and seller accordingly ========
      let compiled = ejs.compile(fs.readFileSync('views/email-templates/auctionWon.ejs', 'utf8'));
      let html = compiled({
        "auction_name" : txs[i].auction,
        "final_bid_amount" : txs[i].amount,
        "crypto_type" : "BTC",
        "date" : new Date(),
        "host" : process.env.APP_HOST,
        "port" : process.env.PORT,
      });

      // Seller information.
      try {
        seller = await User.getOneUser({ userName: txs[i].seller });
      } catch(err) {
        winston.error(err);
      }

      // Buyer information.
      try {
        buyer = await User.getOneUser({ userName: txs[i].buyer });
      } catch(err) {
        winston.error(err);
      }

      // Mail credentials.
      transporter = nodemailer.createTransport({
        service: process.env.MAIL_SERVICE,
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // use SSL
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD,
        }
      });

      // Email-template.
      let attechment = [{
        filename : 'logo.png',
        path: './public/img/alertbell_icon.png',
        cid : 'bell'
      }]

      // Auction details.
      try {
        auc = await Auction.getAuctionByname(txs[i].auction);
      } catch(err) {
        winston.error(chalk.red(err));
      }

      for(let i=0; i<auc.document.length; i++) {
        let obj = {
          filename: auc.document[i].originalname,
          path: './' + auc.document[i].path,
        }
        attechment.push(obj);
      }

      let mailOptions = {
        from: process.env.EMAIL,
        to: buyer.email,
        replyTo: process.env.EMAIL,
        subject: "subject",
        attachments: attechment,
        html: html
      };

      // An email sent to buyer about auction winning.
      transporter.sendMail(mailOptions, async function(err) {
        if(err) {
          winston.error(chalk.red(err));
        // After send the documents successfully.
        } else {
          // Update transaction status to confirmed(0) transaction.
          try {
            let query = { $and:[
                { "auction": txs[i].auction },
                { "fromBTC": txs[i].fromBTC },
                { "toBTC": txs[i].toBTC }
              ]
            }

            try {
              Transactions.updateTransaction(query, { status: 0 });
            } catch(err) {
              winston.error(chalk.red(err));
            }

          } catch(err) {
            winston.error(chalk.red(err));
          }

          // Getting admin commission and transaction charge.
          try {
            config = await AdminConfig.getAdminConfig();
          } catch(err) {
            winston.error(err);
          }

          // Basic Auction amount will be transferred to seller.
          let keys = new bitcoin.ECPair(bigi.fromHex(process.env.GREYRALLY_BTC_PRIVATE_ADDRESS));
          let obj = {
            inputs: [{addresses: [ process.env.GREYRALLY_BTC_PUBLIC_ADDRESS ]}],
            outputs: [{addresses: [ txs[i].toBTC ], value: sb.toSatoshi(auc.currentBid)}],
            fees: sb.toSatoshi(Number(config.transactionCharge)),
            preference: "low"
          }

          // Start transaction. Crucial part.
          try {
            response = await transactions.transferFund(obj, keys);
          } catch(err) {
            throw err;
          }

          // An email will be sent to seller about fund added.
          if(response) {
            // Email-template.
            let attechment2 = [{
              filename : 'btc.png',
              path: './public/img/bitcoin_email.png',
              cid : 'btc'
            }]

            let compiled2 = ejs.compile(fs.readFileSync('views/email-templates/fundsAdded.ejs', 'utf8'));
            let html2 = compiled2({
              "amount" : auc.currentBid,
              "crypto_type" : "BTC",
              "date" : new Date(),
              "host" : process.env.APP_HOST,
              "port" : process.env.PORT,
            });

            let mailOptions = {
              from: process.env.EMAIL,
              to: seller.email,
              replyTo: process.env.EMAIL,
              subject: "subject",
              attachments: attechment2,
              html: html2
            };

            transporter.sendMail(mailOptions, async function(err2) {
              if(err2) {
                winston.error(chalk.red(err2));
              }
            });
          }
        }
      });
      //========================================================================
    }
  }

  // Check the status of cashouts.
  try {
    cashouts = await Cashouts.getTransactionInfo({ status : 1 });
  } catch(err) {
    winston.error(err);
  }

  for(let i=0; i<cashouts.length; i++) {
    try {
      cashoutInfo = await trxController.getTransactionInfo(cashouts[i].transactionInfo.tx.hash);
    } catch(err) {
      winston.error(chalk.red(err));
    }

    let query = {
      _id: cashouts[i]._id,
    }

    try {
      a = await Cashouts.updateCashoutInfo(query, { "transactionInfo.tx": cashoutInfo } );
    } catch(err) {
      winston.error(err);
    }

    if(cashoutInfo.confirmations >= 6) {
      // Set user notification.

      commons.setUserNotification(cashouts[i].user,
        cashouts[i].amount + " withdraw successfully to " + cashouts[i].toBTC + "address.");

      try {
        a = await Cashouts.updateCashoutInfo(query, { "status": 0 } );
      } catch(err) {
        winston.error(err);
      }
      try {
        user = await User.getOneUser({userName:cashouts[i].user})
      } catch(err) {
        winston.error(err);
      }

      let attechment = [{
        filename : 'btc.png',
        path: './public/img/bitcoin_email.png',
        cid : 'btc'
      }]


      let compiled = ejs.compile(fs.readFileSync('views/email-templates/cashout.ejs', 'utf8'));
      let html = compiled({
        "amount" : cashouts[i].amount,
        "crypto_type" : "BTC",
        "host" : process.env.APP_HOST,
        "port" : process.env.PORT,
      });

      let mailOptions = {
       from: "CashBot <donotreply@greyrally.com>",
       replyTo: "donotreply@greyrally.com",
       // from: process.env.EMAIL,
        to: user.email,
        replyTo: process.env.EMAIL,
        subject: "subject",
        attachments: attechment,
        html: html
      };

       // Mail credentials.
          transporter = nodemailer.createTransport({
      host: '10.136.55.63',
      port: 25,
      secure: false, // use SSL (upgrade)
      ignoreTLS: true,  //auth and TLS not needed, only private until signed (jk lol)
      //  service: process.env.MAIL_SERVICE,
      //  host: 'smtp.gmail.com',
      //  port: 465,
      //  secure: true, // use SSL
      //  auth: {
      //    user: process.env.EMAIL,
      //    pass: process.env.PASSWORD,
        });
      transporter.sendMail(mailOptions, async function(err2) {
        if(err2) {
          winston.error(chalk.red(err2));
        }
      });
    }
  }
}


 exports.checkAuctionStatus = async function() {
try{
var auctionUsers = await Auction.getAuctions({expirationDate:{$gte:new Date(new Date().getTime()),$lte:new Date(new Date().getTime()+ 3600000)},expired:{$ne:true}});
}
catch(err){
winston.error(err);
}
Auction.updateAuctions({expirationDate:{$gte:new Date(new Date().getTime()),$lte:new Date(new Date().getTime()+ 3600000)}},{$set:{expired:true}},(err,result)=>{
    console.log("Update auction");
  });

  if(auctionUsers.length > 0){
    var arr = [],auctionCreatedUser = [];
    auctionUsers.map(x =>{ arr.push(x.name);
    var obj = {};
    obj.user = x.user;
    obj.auctionName = x.name; 
    auctionCreatedUser.push(obj); 
    }); 
    
    try{
    var followeduser = await FollowedAuction.getFollAuction(arr);
    } catch(err){
    winston.error(err);
    }
    var emailUsers = [];
    if(auctionCreatedUser.length > 0 || auctionCreatedUser.length > 0 ){
      emailUsers = auctionCreatedUser.concat(followeduser);
    }
    
      async.forEachSeries(emailUsers,(obj,callback)=>{
      User.getUser({userName:obj.user},(err,user)=>{
      if(err)
      winston.error(chalk.red(err));
      else
      var message = obj.auctionName+ " auction is ending soon.";
      let compiled = ejs.compile(fs.readFileSync('views/email-templates/endAuctionMail.ejs', 'utf8'));
      let html = compiled({
        "message":message,
        "crypto_type" : "BLAH BLAH BLAH..",
        "host" : process.env.APP_HOST,
        "port" : process.env.PORT,
      });
    
      let mailOptions = {
        from: "AuctionBot <donotreply@greyrally.com>",
        replyTo: "donotreply@greyrally.com",
         to: user.email,
         replyTo: process.env.EMAIL,
         subject: "GREYRALLY AUCTION END.",
         html: html
       };
    
           // Mail credentials.
           transporter = nodemailer.createTransport({
            // host: '10.136.55.63',
            // port: 25,
            // secure: false, // use SSL (upgrade)
            // ignoreTLS: true,  //auth and TLS not needed, only private until signed (jk lol)
             service: process.env.MAIL_SERVICE,
             host: 'smtp.gmail.com',
             port: 465,
             secure: true, // use SSL
             auth: {
               user: process.env.EMAIL,
               pass: process.env.PASSWORD,
           }
              });
      transporter.sendMail(mailOptions, async function(err2) {
        if(err2) {
          winston.error(chalk.red(err2));
        }
        else{
          User.updateUser(user,{emailSent:true},(err,res)=>{
            if(err)
            winston.error(chalk.red(err));
          })
        }
      });
      })
      return callback();
      })
  }
  else{
    console.log("NO AUCTIONS AVAILABLE");
    }
 }
