const mongoose = require('mongoose');

let AuctionStatsSchema = mongoose.Schema({
  auction: {
    type:String,
    required:true,
  },
  auctionCreatedBy: {
    type: String,
    required:true,
  },
  awardedTo: {
    type: String,
    required: true,
  },
  adminApproved: {
    type: Number,
    default: 0,
  },
  finalAmmount: {
    type: String,
    required: true,
  },
  status: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default:function() {
      return new Date();
    }
  },
  deletedAt: {
    type: Date,
    default: "",
  },
});

let auctionStats = module.exports = mongoose.model('auction_stats', AuctionStatsSchema);

module.exports.newEntry = function(row) {
  return new Promise((resolve, reject) => {
    row.save(function(err, data) {
      if(err) reject(err);
      resolve(data);
    });
  });
}

module.exports.updateAuctionStats = function(auction, obj) {
  return new Promise((resolve, reject) => {
    auctionStats.findOneAndUpdate(
      { "auction" : auction },
      { $set: obj },
      function(err) {
        if(err) {
          reject(err);
        }
      }
    )
  });
}

module.exports.getAuctionStats = function(query) {
  return new Promise((resolve, reject) => {
    auctionStats.findOne(query, function(err, data) {
      if(err) reject(err);
      resolve(data);
    });
  });
}

// Get All Auction stats
module.exports.getAuctionStatsByUser = function(query) {
  return new Promise((resolve, reject) => {
    auctionStats.find(query, function(err, data) {
      if(err) reject(err);
      resolve(data);
    });
  });
}

// Count no of auction bought/sold by user.
module.exports.countActiveAuctionsUserwise = function(query) {
  return new Promise((resolve, reject) => {
    auctionStats.count(query, function(err, count) {
      if(err) {
        reject(err);
      }
      resolve(count);
    });
  });
}
