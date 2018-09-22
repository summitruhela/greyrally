const bcypher = require('blockcypher');
const bitcoin = require("bitcoinjs-lib");
const bigi    = require("bigi");
const buffer  = require('buffer');
const chalk = require('chalk');
const ejs = require('ejs');
const fs = require('fs');
const generator = require('generate-password');
const sb = require('satoshi-bitcoin');
const nodemailer = require('nodemailer');
const WAValidator = require('wallet-address-validator');
const winston = require('winston');
const moment = require('moment');
const xssFilters = require('xss-filters');

// Models ...
const AdminConfig = require("../models/adminConfigs");
const Auction = require("../models/auction");
const AuctionStats = require("../models/auctionStats");
const Cashouts = require("../models/cashouts");
const Transactions = require("../models/transactions");
const UserWallet = require("../models/userWallet");
const User = require('../models/user');

// Controllers ...
const commons = require("./common.controller");
const trxController = require("../controllers/transactions.controller");

exports.transactions = async function(req, res) {
  try {
    sold = await Transactions.getTransactions({ seller: req.user.userName });
  } catch(err) {
    winston.error(chalk.red(err));
  }
  // SET DATE FORMAT
  for(let i=0; i<sold.length; i++) {
    let b = JSON.parse(JSON.stringify(sold[i]));
    let dateTime = new Date(b.createdAt);
    b.createdAt = moment(dateTime).format("YYYY-MM-DD");
    sold[i] = b;
  }

  try {
    bought = await Transactions.getTransactions({ buyer: req.user.userName });
  } catch(err) {
    winston.error(chalk.red(err));
  }
  // SET DATE FORMAT
  for(let i=0; i<bought.length; i++) {
    let b = JSON.parse(JSON.stringify(bought[i]));
    let dateTime = new Date(b.createdAt);
    b.createdAt = moment(dateTime).format("YYYY-MM-DD");
    try {
      auction = await Auction.getAuctionByname(b.auction);
    } catch(err) {
      winston.error(chalk.red(err));
    }
    b.soldOut = auction.soldOut;
    b.buyerRating = auction.buyerRating;
    bought[i] = b;
  }

  try {
    a = await Cashouts.listCashouts({ user: req.user.userName });
  } catch(err) {
    winston.error(chalk.red(err));
  }

  // SET DATE FORMAT
  for(let i=0; i<a.length; i++) {
    let b = JSON.parse(JSON.stringify(a[i]));
    let dateTime = new Date(b.createdAt);
    b.createdAt = moment(dateTime).format("YYYY-MM-DD");
    a[i] = b;
  }

  let tabIndex;
  if (req.params.tab != undefined) {
    tabIndex = req.params.tab;
  }
  else {
    if ( req.user.role == "2" ) {
      tabIndex = "sold";
    } else if ( req.user.role == "3" ) {
      tabIndex = "bought";
    }
  }
  res.render('user/transaction-history', {
    user: req.user.userName,
    role: req.user.role,
    soldAucions: sold,
    boughtAuctions: bought,
    cashouts: a,
    tabIndex: tabIndex,
  });
}

// Track transaction.
exports.transactionInfo = async function(req, res) {
  let hash = req.params.hash;
  let transactionInfo;

  try {
    cashoutInfo = await trxController.getTransactionInfo(hash);
  } catch(err) {
    winston.error(chalk.red(err));
  }

  let query = {
    "transactionInfo.tx.hash": hash,
  }

  try {
    await Cashouts.updateCashoutInfo(query, { "transactionInfo.tx": cashoutInfo } );
  } catch(err) {
    winston.error(err);
  }

  if(cashoutInfo.confirmations >= 6) {
    // Set user notification.
    commons.setUserNotification(cashoutInfo.user,
      cashoutInfo.amount + " withdraw successfully to " + cashoutInfo.toBTC + "address.");

    try {
     await Cashouts.updateCashoutInfo(query, { "status": 0 } );
    } catch(err) {
      winston.error(err);
    }
  }

  try {
    transactionInfo = await Transactions.getTransactions({"transactionInfo.tx.hash": req.params.hash});
  } catch(err) {
    winston.error(chalk.red(err));
  }

  if(transactionInfo.length == 0) {
    try {
      transactionInfo = await Cashouts.getTransactionInfo({"transactionInfo.tx.hash": req.params.hash});
    } catch(err) {
      winston.error(chalk.red(err));
    }
  }

  let obj = {
    blockHash: transactionInfo[0].transactionInfo.tx.block_hash,
    blockHeight: transactionInfo[0].transactionInfo.tx.block_height,
    blockIndex: transactionInfo[0].transactionInfo.tx.block_index,
    hash: transactionInfo[0].transactionInfo.tx.hash,
    amount: sb.toBitcoin(transactionInfo[0].transactionInfo.tx.total),
    fee: sb.toBitcoin(transactionInfo[0].transactionInfo.tx.fees),
    confirmations: transactionInfo[0].transactionInfo.tx.confirmations,
    receivedAt: transactionInfo[0].transactionInfo.tx.received,
  }
  res.render('user/transactionInfo', {
    user : req.params.username,
    info: obj,
  });
}

// Buy auction.
exports.buyAuction = async function(req, res) {
  if(req.user && req.user.pin == req.body.pin) {
    let auction = await Auction.getAuctionByname(req.params.auction)
    let auctionDetails = JSON.parse(JSON.stringify(auction));
    let buyer = await User.getOneUser({ userName : req.params.username});
    // Wallet information with current BTC address.
    try {
      a = await UserWallet.getUserWallet({ $and: [ { user: req.user.userName }, { status: "1" } ]});
    } catch(err) {
      winston.error(chalk.red(err));
    }
    if(a == null) {
      // Generating new BTC address.
      try {
        response = await createBitcoinAdd(process.env.WALLET_NAME);
      } catch(err) {
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
      } catch(err) {
        throw err;
      }
    }

    // Get wallet Balance (in satoshi).
    try {
      balance = await getAddrbalance(a.BTCadd);
    } catch(err) {
      throw err;
    }

    // Get admin commission and transaction charge.
    try {
      config = await AdminConfig.getAdminConfig();
    } catch(err) {
      winston.error(err);
    }

    /* =========================================================================
      Other coast will be apply to buyer. It will be two fees of mining
      (0.0001 + 0.0001 BTC) which will be (1.64 USD + 1.64 USD = 3.28 USD)
      and admin commission will be % of auction price.
      ==========================================================================
    */

    // For 100 rs of auction and 10% admin commission will bw 10. So, commission = 10*100/100 =10.
    let adminCommission = (Number(config.commission) * (Number(auctionDetails.currentBid)))/100;
    // Transaction charge.
    let otherCost = adminCommission + Number(config.transactionCharge) + (Number(auctionDetails.currentBid));
    // If Wallet have sufficient balance, Auction will move to admin confirmation.
    if(sb.toBitcoin(balance.balance + balance.unconfirmed_balance) > (((Number(auctionDetails.buyoutPrice)) + otherCost))) {
      // Auction will be closed for buy/bid.
      let obj = { "status": 0, "soldOut":1, "currentBid": auctionDetails.buyoutPrice };
      Auction.updateAuction(auctionDetails.name, obj, function(err, auction) {
        if (err) {
          winston.error(chalk.red(err));
        } else {
          // Entry will be inserted into db as sold out.
          let auctionStats = new AuctionStats ({
            auction : auctionDetails.name,
            auctionCreatedBy : auctionDetails.user,
            awardedTo : req.user.userName,
            finalAmmount : ((Number(auctionDetails.buyoutPrice)) + otherCost),
          });
          try {
            ab = AuctionStats.newEntry(auctionStats);
          } catch(err) {
            throw err;
          }

          // An email will be send to seller.
          let compiled = ejs.compile(fs.readFileSync('views/email-templates/auctionWonImmediate.ejs', 'utf8'));
          let html = compiled({
            "auction_name" : auctionDetails.name,
            "final_bid_amount" : auctionDetails.buyoutPrice,
            "crypto_type" : "USD"
          });

          let TO_ADDRESS = req.user.email;
          let subject = "GREYRALLY - Auction sold out";
          commons.mail(TO_ADDRESS, subject, html, function(err, response) {
            if(err) {
              winston.error(chalk.red('ERROR!', err));
              return res.send('ERROR');
            } else {
              // Set user notification.
              commons.setUserNotification(req.user.userName,
              auctionDetails.name + " has been edited sold out successfully at price "
              + auctionDetails.buyoutPrice + " and sent for admin confirmation.");

              // An email will be send to buyer.
              let compiled2 = ejs.compile(fs.readFileSync('views/email-templates/auctionWonImmediate.ejs', 'utf8'));
              let html2 = compiled2({
                "auction_name" : auctionDetails.name,
                "final_bid_amount" : ((Number(auctionDetails.buyoutPrice)) + otherCost),
                "crypto_type" : "USD"
              });

              let BUYER_ADDRESS = buyer.email;
              let subject2 = "GREYRALLY - Auction won";
              commons.mail(BUYER_ADDRESS, subject2, html2, function(err, response) {
                if(err) {
                  winston.error(chalk.red('ERROR!', err));
                  return res.send('ERROR');
                } else {
                  // Set user notification.
                  commons.setUserNotification(auctionDetails.user,
                  auctionDetails.name + " has been bought successfully at price "
                  + auctionDetails.buyoutPrice + " and sent for admin confirmation.");
                  // Response...
                  res.status(200).send("1");
                }
              });
            }
          });
        }
      })
    } else {
      res.status(200).send("0");
    }
  } else {
    res.status(200).send("2");
  }
}

// Wallet information for user.
exports.userWallet = async function(req, res) {
  // Check if wallet is already available or not.
  try {
    a = await UserWallet.getUserWallet({ $and: [ { user: req.params.username }, { status: "1" } ]});
  } catch(err) {
    winston.error(chalk.red(err));
  }

  if(a == null) {
    // Generating new BTC address.
    try {
      response = await createBitcoinAdd(process.env.WALLET_NAME);
    } catch(err) {
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
    } catch(err) {
      throw err;
    }
  }

  // BTC balance.
  if(a != null){
    try {
      balance = await getAddrbalance(a.BTCadd);
    } catch(err) {
      throw err;
    }
  }

  res.render('user/wallet', {
    walletInfo: a,
    user: req.user.userName,
    balance: sb.toBitcoin(balance.balance),
    unconfirmedBal: sb.toBitcoin(balance.unconfirmed_balance),
    err: req.flash('error')
  });
}

// Cashout funds from wallet to other btc address.
exports.cashout = async function(req, res) {
  // Wallet information of user with current BTC address.
  if(req.user.pin != req.body.PIN) {
    req.flash('error', 'Incorrect PIN');
    res.redirect('/users/' + req.user.userName + '/wallet')
  } else {
    let valid = WAValidator.validate(req.body.btc_add, 'BTC');
    if(!valid) {
      req.flash('error', 'Incorrect BTC address');
      res.redirect('/users/' + req.user.userName + '/wallet')
    }

    try {
      a = await UserWallet.getUserWallet({ $and: [ { user: req.user.userName }, { status: 1 } ]});
    } catch(err) {
      winston.error(chalk.red(err));
    }

    // Get address Balance (in satoshi).
    try {
      balance = await getAddrbalance(a.BTCadd);
    } catch(err) {
      throw err;
    }

    // Get admin commission and transaction charge.
    try {
      config = await AdminConfig.getAdminConfig();
    } catch(err) {
      winston.error(err);
    }

    let keys = new bitcoin.ECPair(bigi.fromHex(commons.decrypt(a.privateAdd)));
    let obj = {
      inputs: [{addresses: [ a.BTCadd ]}],
      outputs: [
        {
          addresses: [ req.body.btc_add ],
          value: (sb.toSatoshi(sb.toBitcoin(balance.balance)) - sb.toSatoshi((Number(config.transactionCharge))))
        }
      ],
      fees: sb.toSatoshi((Number(config.transactionCharge))),
      preference: "low"
    }

    // Start transaction. Crucial part.
    try {
      response = await transferFund(obj, keys);
    } catch(err) {
      winston.error(chalk.red(err));
    }

    let c;

    // After response of transaction sent mail to user about cashout.
    if(response && !response.Error) {
      c = response;
      let attechment = [{
        filename : 'btc.png',
        path: './public/img/bitcoin_email.png',
        cid : 'btc'
      }]

      let compiled = ejs.compile(fs.readFileSync('views/email-templates/cashout.ejs', 'utf8'));
      let html = compiled({
        "amount" : sb.toBitcoin(balance.balance),
        "crypto_type" : "BTC",
        "host" : process.env.APP_HOST,
        "port" : process.env.PORT,
      });

      let mailOptions = {
	     from: "CashBot <donotreply@greyrally.com>",
	     replyTo: "donotreply@greyrally.com",
       // from: process.env.EMAIL,
        to: req.user.email,
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
    	ignoreTLS: true,	//auth and TLS not needed, only private until signed (jk lol)
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

      let trs = new Cashouts({
        user: req.user.userName,
        transactionInfo: c,
        fromBTC: a.BTCadd,
        toBTC: xssFilters.inHTMLData(req.body.btc_add),
        amount: sb.toBitcoin(balance.balance),
      })

      try {
        let a = await Cashouts.addCashout(trs);
      } catch(err) {
        throw err;
      }

      // Set user notification.
      commons.setUserNotification(req.user.userName,
        "Transaction has been initiated successfully. You will be notify when its completes the 6+ confirmation.");
    } else {
      return res.redirect('/users/' + req.user.userName + '/transactions');
    }
    // res.redirect('/users/' + req.user.userName + '/transactions');
  }
}

// Track unconfirmed transaction at userside.
exports.listUnconfirmedTrx = async function(req, res) {
  try {
    let query = { $and : [ { toBTC: req.params.address }, { status: 0 } ] };
    a = await Transactions.getTransactions();
  } catch (err) {
    winston.error(chalk.red(err));
  }

  res.render('user/transaction-status', {
    user: req.user.userName,
    trxInfo: a,
  })
}

// Track transaction confirmations.
exports.trackUnconfirmedTrx = async function(req, res) {
  try {
    a = await Transactions.getOneTransaction({ _id: req.params.id });
  } catch (err) {
    winston.error(chalk.red(err));
  }

  try {
    a = await getTransactionInfo(a.transactionInfo.tx.hash);
    res.status(200).send((a.confirmations).toString());
  } catch(err) {
    winston.error(chalk.red(err));
    res.status(500).send(err);
  }
}

// Get transaction information(6+ confirmation).
exports.getConfirmations = async function(req, res) {
  let hash = req.body.hash;
  let transactionInfo;
  // try {
  //   transactionInfo = await Transactions.getTransactions({"transactionInfo.tx.hash": hash});
  // } catch(err) {
  //   winston.error(chalk.red(err));
  // }
  // res.send(transactionInfo[0].transactionInfo.tx.confirmations);
  try {
    transactionInfo = await getTransactionInfo( hash );
  } catch(err) {
    winston.error(chalk.red(err));
  }
  res.send({ "Confirmations" : transactionInfo.confirmations });
}

// ================== BEGIN: Blockcypher =======================================

// Create new bitcoin address for admin wallet.
function createBitcoinAdd(walletName) {
  bcapi = new bcypher('btc','main', process.env.API_CODE);
  return new Promise ((resolve, reject) => {
    bcapi.genAddrWallet(walletName, function(err, res) {
      if(err) {
        reject(err);
      } else {
        resolve(res);
      }
    });
  })
}

// Get wallet Balance.
function getAddrbalance (addr) {
  bcapi = new bcypher('btc','main', process.env.API_CODE);
  return new Promise ((resolve) => {
    bcapi.getAddrBal(addr, {}, function (err, response) {
      if(err) {
        reject(err);
      } else {
        try {
          resolve(response);
        } catch (err) {
          winston.error(err);
        }
      }
    })
  })
}

function transferFund(obj, keys) {
  bcapi = new bcypher('btc','main', process.env.API_CODE);
  return new Promise ((resolve, reject) => {
    bcapi.newTX(obj, function(err, skeleton) {
      if (err !== null) {
        winston.error(err);
      } else if(skeleton.errors) {
        resolve({"Error": 1});
      } else {
        skeleton.pubkeys = [];
        skeleton.signatures = skeleton.tosign.map(function(tosign, n) {
        skeleton.pubkeys.push(keys.getPublicKeyBuffer().toString("hex"));
          return keys.sign(new buffer.Buffer(tosign, "hex")).toDER().toString("hex");
        });
        bcapi.sendTX(skeleton, function(err2, response) {
          if (err2 !== null) {
            resolve({"Error": 1});
          } else {
            resolve(response);
          }
        })
      }
    });
  })
}

// Get transaction information(6+ confirmation).
function getTransactionInfo(hash) {
  bcapi = new bcypher('btc','main', process.env.API_CODE);
  return new Promise((resolve, reject) => {
    bcapi.getTX(hash, {}, function(err, response) {
      if(err) {
        reject(err);
      } else {
        resolve(response);
      }
    })
  });
}

// ================== OVER: Blockcypher =======================================

exports.getTransactionInfo = getTransactionInfo;
exports.getAddrbalance = getAddrbalance;
exports.transferFund = transferFund;
exports.createBitcoinAdd = createBitcoinAdd;

