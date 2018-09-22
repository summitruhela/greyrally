const mongoose = require('mongoose');

let AuctionBidsSchema = mongoose.Schema({
  auction: {
    type:String,
    required:true,
  },
  auction_created_by: {
    type: String,
    required:true,
  },
  bided_by: {
    type: String,
    required: true,
  },
  last_bid: {
    type: Number,
    default: 0,
  },
  current_bid: {
    type: String,
    required: true,
  },
  status: {
    type: Number,
    default: 1,
  },
  createdAt: {
    type: Date,
    default:function() {
      return new Date();
    }
  },
});

let auctionBids = module.exports = mongoose.model('auction_bids', AuctionBidsSchema);

module.exports.newEntry = function(row) {
  return new Promise((resolve, reject) => {
    row.save(function(err, data) {
      if(err) reject(err);
      resolve(data);
    });
  });
}

module.exports.updateAuctionBid = function(auction, obj) {
  return new Promise((resolve, reject) => {
    auctionBids.findOneAndUpdate(
      { "auction" : auction },
      { $set: obj },
      function(err, data) {
        if(err) reject(err);
        resolve(data)
      }
    )
  });
}

module.exports.getAuctionBid = function(query) {
  return new Promise((resolve, reject) => {
    auctionBids.findOne(query, function(err, data) {
        if(err) reject(err);
        resolve(data)
      }
    )
  });
}
