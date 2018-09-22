//const crypto = require('crypto');
const crypto = require('crypto');
const chalk = require('chalk');

const nodemailer = require('nodemailer');
const request = require('request');
const winston = require('winston');

//var aes256 = require('aes256');
var AES = require("crypto-js/aes");
var shajs = require('sha.js')

// Models ...
const Auction = require('../models/auction');
const Notifications = require('../models/notifications');
const SplashRecords = require('../models/splashRecords');
const User = require('../models/user');
const AuctionStats = require("../models/auctionStats");


exports.checkEmailAvailability = async function(mail) {
  let username = mail.split('@');
  let email = mail;
  // It will remove all the character after "+" from email address.
  // for example test+t1@gmail.com will consider as test@gmail.com
  if(username[0].indexOf('+') > 1) {
    username[0] = username[0].substring(0, username[0].indexOf('+'));
    email = username[0]+"@"+username[1];
  }

  // Split provider from address. ex. gmail, yahoo, etc.
  let provider = username[1].split('.')[0];

  // It will remove "." from email address.
  // for example test.t1@gmail.com will consider as testt1@gmail.com
  if(provider === "gmail" && username[0].indexOf('.') > 1) {
    if(username[0].indexOf('+') > 1) {
      username[0] = username[0].substring(0, username[0].indexOf('+'));
    }
    user = username[0].replace('.','');
    email = user+"@"+username[1];
  }
  'use strict'
  let isUser;
  try {
    isUser = await User.getOneUser({ email: email })
  } catch(err) {
    winston.error(chalk.red(err));
  }
  if (isUser) {
    return 1;
  } else {
    return 0;
  }
}

exports.checkusernameAvailability = async function(uName) {
  // Case insensitive search.
  let query = { userName: {'$regex': '^' + uName + '$', '$options': 'i'} };
  let isUser;
  try {
    isUser = await User.getOneUser(query)
  } catch(err) {
    winston.error(chalk.red(err));
  }
    if (isUser) {
    return 1;
  } else {
    return 0;
  }
}

// Search auction by name.
exports.search = function(req,res) {
  let str = req.query.query
  let trimmedStr = str.trim();

  Auction.searchAuctions(trimmedStr, function(err, auctions) {
    if(err) winston.error(chalk.red(err));
    let searchResult = {};
    let result = new Array();
    let count = auctions.length;
    for(let i=0; i<auctions.length; i++) {
      result[i] = {};
      result[i].suggestion = auctions[i].name;
      if (req.user != undefined) {
        result[i].url = "/users/"+ req.user.userName +"/auctions/"+ auctions[i].name;
      } else {
        result[i].url = "/login";
      }
    }
    searchResult.results = result;
    res.send(searchResult);
  });
}

// Current bitcoin price.
function BTC() {
  return new Promise((resolve, reject) => {
    // send a request to blockchain
    request('https://blockchain.info/de/ticker', (error, response, body) => {
      // parse the json answer and get the current bitcoin value
      if(error) {
        reject(error)
      } else {
        const data = JSON.parse(body);
        currentBTCPrice = (parseInt(data.USD.buy, 10) + parseInt(data.USD.sell, 10)) / 2;
        resolve(currentBTCPrice);
      }
    });
  });
}

exports.BTC = BTC;

// IE
exports.internetexplorer = function(req, res) {
   if (req.isAuthenticated()) {
  res.render("IE/internetexplorer", {
    user : req.user.userName,
  });
  } else {
    res.render("IE/internetexplorer", {
      user : "NotLoggedIn",
    });
  }
}



// About us.
exports.aboutUs = function(req, res) {
  if (req.isAuthenticated()) {
  res.render("about/about", {
    user : req.user.userName,
  });
  } else {
    res.render("about/about", {
      user : "NotLoggedIn",
    });
  }
}

// exports.promisePin.then(function(getPinfo) {
//	console.log(getPinfo);
//});

exports.getPin =  function(input) {
//output = shajs('sha256').update(input).digest('hex');
output = input;
}, function(error) {
	console.error('uhno',error);
return output;

};



	const key = process.env.KEY;

  exports.encrypt = function(text)
  {
     var cipher=crypto.createCipher('aes-256-ctr','DF987E89130EAD7662FD40CF61B436AF6C7BB10E1B87A6273FF6B94D5C17966C');
      var crypted=cipher.update(text.toString(),'utf8','hex');
      crypted+=cipher.final('hex');
      return crypted;
  }

exports.decrypt = function(text){
var decipher = crypto.createDecipher('aes-256-ctr','DF987E89130EAD7662FD40CF61B436AF6C7BB10E1B87A6273FF6B94D5C17966C')
var dec = decipher.update(text.toString(),'hex','utf8')
dec += decipher.final('utf8');
return dec;
}

// Simple mail function. 
exports.mail = function(toAddress, subject, content, cb) {
  // Mail credentials.

  transporter = nodemailer.createTransport({
    // host: '10.136.55.63',
    // port: 25,
    // secure: false, // use SSL
    // ignoreTLS: true,	//auth and TLS not needed, only private until signed
    // authOptional: true,
    service: process.env.MAIL_SERVICE,
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // use SSL
    auth: {
      user: process.env.EMAIL,
      pass: process.env.PASSWORD,
    }
  });

  let mailOptions = {
    from: "donotreply@greyrally.com",
    to: toAddress || process.env.EMAIL,
    replyTo: "donotreply@greyrally.com",
    subject: subject || "subject",
    html: content
  };
  transporter.sendMail(mailOptions, cb);
}

exports.help = function(req, res) {
  res.render('help/help');
}

exports.sponsors = function(req, res) {
  if (req.isAuthenticated()) {
  res.render("sponsors/sponsors", {
    user : req.user.userName,
  });
  } else {
    res.render("sponsors/sponsors", {
      user : "NotLoggedIn",
    });
  }
}

exports.setUserNotification = function(user, msg) {
  let notification = new Notifications({
    user: user,
    notification: msg
  });

  Notifications.newNotification(notification, function (err) {
    if(err) {
      winston.error(chalk.red(err));
    }
  });
}

// To register splash entries of user.
exports.splashRegistration = async function(req, res) {
  let splashRegstration = new SplashRecords({
    email: req.body.email,
    role: req.body.role,
  });

  try {
    await SplashRecords.newRecord(splashRegstration);
  } catch(err) {
    winston.error(chalk.red(err));
  }
  res.render('splash/splash-2');
}

// Count Ratting for user
// formula : (5 * (store_total_ratings_of_all_auctions) ) / (store_total_ratings_of_all_auctions)
exports.userRatings = async function(user) {
  let ratedAuctionTotal = 0; // length of total rated auction(length)
  let ratedAuction = 0; // store total ratings of all auctions
  let soldAuctionCount = 0;
  let totalAuctionRating = 0;
  let auction = await Auction.getAuctions({user:user})

  for (let i=0 ;i < auction.length ;i++) {
    if (auction[i].buyerRating != 0) {
      ratedAuctionTotal++;
      ratedAuction = ratedAuction + Number(auction[i].buyerRating);
    }

    if (auction[i].soldOut == 1) {
      soldAuctionCount++;
      totalAuctionRating += Number(auction[i].buyerRating);
    }
  }

  if (ratedAuctionTotal == 0) {
    return 0;
  }

  let totalRatings = ratedAuctionTotal * 5;
  userRating = Math.round((5*ratedAuction)/totalRatings);
  return {
    userRating : userRating,
    soldAuctionCount : soldAuctionCount,
    totalAuctionRating : totalAuctionRating,
  };
}


exports.fixedEncodeURI = function(str) {
    return encodeURI(str).replace(/%5B/g, '[').replace(/%5D/g, ']');
}


exports.userRatingsCount = async function(user, timePeriod) {
  let totalRatings = 0;
  let allDetails;
  let oneRatingCount = 0,
      twoRatingCount = 0,
      threeRatingCount = 0,
      fourRatingCount = 0,
      fiveRatingCount = 0;


  let date1 = new Date();
  let auctionStats;

  if (timePeriod == "30Days") {
    date1.setDate(date1.getDate() - 30);
    auctionStats = await AuctionStats.getAuctionStatsByUser({auctionCreatedBy:user, createdAt : { $gte : date1}})
  } else if (timePeriod == "3Months") {
    date1.setMonth(date1.getMonth() - 3);
    auctionStats = await AuctionStats.getAuctionStatsByUser({auctionCreatedBy:user, createdAt : { $gte : date1}})
  } else {
    auctionStats = await AuctionStats.getAuctionStatsByUser({auctionCreatedBy:user})
  }

  let totalCounts = auctionStats.length == 0 ? "1" : auctionStats.length;


  for (let i = 0; i<auctionStats.length; i++) {
    let auctionUser = await Auction.getAuctions({name:auctionStats[i].auction})
    totalRatings += auctionUser[0].buyerRating;
    if ( auctionUser[0].buyerRating == '1' ) {
      oneRatingCount++;
    } else if ( auctionUser[0].buyerRating == '2' ) {
      twoRatingCount++;
    } else if ( auctionUser[0].buyerRating == '3' ) {
      threeRatingCount++;
    } else if ( auctionUser[0].buyerRating == '4' ) {
      fourRatingCount++;
    } else if ( auctionUser[0].buyerRating == '5' ) {
      fiveRatingCount++;
    } else if ( auctionUser[0].buyerRating == '0' ) {
      totalCounts--;
    }
  }

  return allDetails = {
    oneRatingCount : oneRatingCount,
    twoRatingCount : twoRatingCount,
    threeRatingCount : threeRatingCount,
    fourRatingCount : fourRatingCount,
    fiveRatingCount : fiveRatingCount,
    averageRating : totalRatings / totalCounts,
  }
}

exports.generateSalt = (length)=>{
  var genRandomString = function(length){
    return crypto.randomBytes(Math.ceil(length/2))
            .toString('hex') /** convert to hexadecimal format */
            .slice(0,length);   /** return required number of characters */
};
}


exports.generateHash = (username,salt)=>{
var sha256 = function(username, salt){
  var hash = crypto.createHash('sha256', salt); /** Hashing algorithm sha256 */
  hash.update(username);
  var value = hash.digest('hex');
  return hash;
};
}