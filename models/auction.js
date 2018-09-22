const mongoose = require('mongoose');
const chalk = require('chalk');
const winston = require('winston');

let AuctionSchema = mongoose.Schema({
  user: {
    type:String,
    required:true, // admin-1,hacker-2,company-3
      // index : true
  },
  name: {
    type: String,
    required:true,
    unique: true, //race condition
//    match: /^[a-zA-Z0-9_]*$/
  },
  case: {
    type: String,
    required: true,
  },
  roughTimeAcquired: {
    type: Date,
    required: false,
  },
  os: {
    type: String,
    required: true,
  },
  type: {
    type:String,
    required:true,
  },
  subType: [ String ],
  impactedCompany: {
    type: String,
    required: false,
  },
  manufacturer: {
    type: String,
    required: false,
  },
  document: [{
    fieldname: { type: String, trim: true },
    originalname: { type: String, trim: true },
    encoding: { type: String, trim: true },
    mimetype: { type: String, trim: true },
    destination: { type: String, trim: true },
    filename: { type: String, trim: true },
    path: { type: String, trim: true },
    size: { type: String, trim: true },
  }],
  description: {
    type: String,
  },
  minimumBid: {
    type: String,
    required: true,
  },
  buyerRating: {
    type: String,
    default: 0,
  },
  currentBid: {
    type: String,
    required: false,
    default: 0,
  },
  buyoutPrice: {
    type: String,
    required: false,
  },
  listingDate: {
    type:Date,
    default:function() {
      return new Date();
    },
  },
  expirationDate: {
    type:Date,
  },
  soldOut: {
    type:String,
    default:0
  },
  status: {
    type:String,
    default:0
  },
  adminApproved: {
    type:String,
    default: 0
  },
  totalViews: {
    type:Number,
    default:0
  },
  uniqueViews: {
    type:Number,
    default:0
  },
  adminRating: {
    type: Number,
    default:0
  },
  createdAt: {
    type:Date,
    default:function() {
      return new Date();
    }
  },
  deletedAt: {
    type:Date,
    default: "",
  },
  updatedAt: {
    type:Date,
    default:function() {
      return new Date();
    },
  },
  updatedBy: {
    type:String,
    ref:'Auction'
  },
  disapprovalReason:{
    type:String
  },
  expired:{
    type:Boolean,
    default:false
  }
});

let Auction = module.exports = mongoose.model('Auction', AuctionSchema);

// Create New auction.
module.exports.createAuction = function(newAuction, callback) {
  newAuction.save(callback);
}

// Find auction by its name.
module.exports.getAuctionByname = function(auctionName) {
  let query = { "name": auctionName };
  return new Promise((resolve, reject) => {
    Auction.findOne(query, function(err, data) {
      if(err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  })
}

//Get particular auction and update view
module.exports.getAuctionBynameAndUpdateViews = (auctionName)=>{
  let query = { "name": auctionName };
  return new Promise((resolve, reject) => {
    Auction.findOneAndUpdate(query, {$inc:{uniqueViews:1}}, function(err, data) {
      if(err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  })
}


// For any updation on auction. just set fields in `obj` object.
module.exports.updateAuction = function(auction, obj, callback) {
  Auction.findOneAndUpdate(
    { "name" : auction },
    { $set: obj },
    callback
  )
}

// Delete function for AUCTION
//module.exports.deleteAuction = function (auction, obj, callback) {
//	Auction.findOneAndDelete(
//		{ "name" : auction },
//		{ $set: obj },
//		callback
//	)
//}

// All auction created by particular user.
module.exports.getUserAuctions = function(user, callback) {
  Auction.find({ $or: [ { "user": user, "deletedAt" : "", status: "0", adminApproved: "0"},
                        { "user": user, "deletedAt" : "", status: "1", adminApproved: "1"},]},
                        { _id: 0 }, callback);
}

// All auction created by particular user.
module.exports.getUserAllAuctions = function(user, callback) {
  Auction.find({ "user": user},
                        { _id: 0 }, callback);
}

// Search auction by its name.
module.exports.searchAuctions = function(data, callback) {
  Auction.find({name: {$regex: data}}, callback);
}

// Get auctions for user feed. Top 10 by unique views.
module.exports.hotAuctions = function(limit, callback) {
  Auction.find({ "status": "1", "adminApproved": "1" }, { _id:0 }, callback)
          .sort({uniqueViews:-1})
          .limit(Number(limit));
}

// Update multiple auctions.
module.exports.updateMultiple = function(user, obj, callback) {
  try {
    Auction.updateMany (
      { "user" : user },
      { $set: obj },
    callback);
  } catch (e) {
      winston.error(chalk.red(e));
  }
}

// Auction view count.
module.exports.updateAuctionView = function(auction, callback) {
  Auction.update({name: auction }, {$inc:{"uniqueViews": 1}}, callback);
}

// Count no of auction created by user.
module.exports.countActiveAuctionsUserwise = function(query) {
  return new Promise((resolve, reject) => {
    Auction.count(query, function(err, count) {
      if(err) {
        reject(err);
      }
      resolve(count);
    });
  });
}

// Auction.
module.exports.getAuctions = function(query) {
  return new Promise((resolve, reject) => {
    Auction.find(query, function(err, auctions) {
      if(err) {
        reject(err);
      } else {
        resolve(auctions);
      }
    })
  })
}

//update auctions after mail sent to users.
module.exports.updateAuctions = function(query,set,callback) {
  Auction.update(query, set,{multi:true}, callback);
}