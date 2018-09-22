const mongoose = require('mongoose');
const chalk = require('chalk');

var auction_views = mongoose.Schema({
  user: {
    type: String,
    required: true,
  },
  auction: {
    type: String,
    required: true,
  },
  ipv4: {
    type: String,
    required: true,
  },
  createdAt: {
    type:Date,
    default:function() {
      return new Date();
    }
  },
});

var auction_views = module.exports = mongoose.model('auction_views', auction_views);

module.exports.getAuctionView = function(query, callback) {
  auction_views.findOne(query, callback);
}

// Add new auction view.
module.exports.addAuctionView = function(newView, callback) {
  newView.save(callback);
}
