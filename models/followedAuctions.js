const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const chalk = require('chalk');
const winston = require('winston');

var followed_auctions = mongoose.Schema({
  user: {
    type: String,
    required: true,
  },
  auction: {
    type: String,
    required: true,
  },
  createdBy: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    status: 1,
  },
  rating: {
    type: String,
  },
  createdAt: {
    type:Date,
    default:function() {
      return new Date();
    }
  },
});

var followed_auctions = module.exports = mongoose.model('followed_auctions', followed_auctions);

// Get one auction details.
module.exports.getOneAuction= function(query) {
  return new Promise ((resolve, reject) => {
    followed_auctions.findOne(query, function(err, data) {
      if(err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  })
}

module.exports.followAuction = function(newUser, callback) {
  newUser.save(callback);
}

module.exports.unfollowAuction = function(user, auction, callback) {
  followed_auctions.findOneAndUpdate(
    { $and : [ { user: user }, { auction: auction }, { status: 1 } ] },
    { $set: { status : 0 } },
    callback
  )
}

module.exports.getFollowedAuctions = function(user, callback) {
  followed_auctions.find({ $and : [ { user: user }, { status: "1" } ] }, { _id: 0 },  callback);
}

module.exports.getFollAuction = function(auc_names, callback) {
  followed_auctions.find({$and:[  { status: "1" }, {auction:{$in:auc_names}}]}, { _id: 0 }, (err,res)=>{
     var folluser = res.filter(x => x.user!=x.createdBy);
     var userArr = folluser.map(x => x.user);
    return  userArr;
  })
}

// Update multiple auctions.
module.exports.updateMultiple = function(user, obj, callback) {
  try {
    followed_auctions.updateMany (
      { "user" : user },
      { $set: obj },
    callback);
  } catch (e) {
    winston.error(chalk.red(e));
  }
}

//unfollow auction when it expires
module.exports.unfollowAuctions= function(query) {
  return new Promise ((resolve, reject) => {
    followed_auctions.update(query,{$set :{"status":"0"}} ,{ multi: true }, function(err, data) {
      if(err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  })
}

module.exports.getFollAuction = function(auc_names) {
  return new Promise ((resolve, reject) => {
  followed_auctions.find({$and:[ { status: "1" }, {auction:{$nin:auc_names}}]}, { _id: 0 }, (err,res)=>{
  var folluser = res.filter(x => x.user!=x.createdBy);
  var userArr = folluser.map(x =>{ var obj = {'user':x.user,'auctionName':x.auction}});
 if(err){
   reject(err)
 }
 else{
   resolve(userArr);
 }
  })
})
  }


  module.exports.removeFollUsers = function(auc_names,callback) {
    followed_auctions.remove({auction:auc_names},callback)
    }