const mongoose = require('mongoose');
const chalk = require('chalk');
const winston = require('winston');

var cronPurge = mongoose.Schema({
auctionId :{
    type:Date
}
});

var cronPurge = module.exports = mongoose.model('cronPurge', cronPurge);

// Create New expired cron purge.
module.exports.createCronPurge = function(newPurge,callback) {
    cronPurge.create(newPurge,callback);
}
