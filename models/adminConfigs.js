const chalk = require('chalk');
const mongoose = require('mongoose');
const winston = require('winston');

let adminConfigSchema = mongoose.Schema({
  transactionCharge: {
    type:String,
    default: 0.0001, // BTC
  },
  commission: {
    type: String,
    default: 5, // in %
  },
  createdAt: {
    type:Date,
    default:function() {
      return new Date();
    }
  },
  modifiedAt: {
    type: Date,
    default: "",
  },
});

let adminConfig = module.exports = mongoose.model('admin_configs', adminConfigSchema);

module.exports.saveConfig = function() {
  let obj = new adminConfig();
  return new Promise((resolve, reject) => {
    obj.save(function(err, data) {
      if(err) {
        winston.error(chalk.red(err));
      }
      resolve(data);
    });
  });
}

module.exports.getAdminConfig = function() {
  return new Promise((resolve, reject) => {
    adminConfig.findOne({}, function(err, data) {
      if(err) reject(err);
      resolve(data);
    });
  });
}

module.exports.updateSetting = function(obj) {
  return new Promise((resolve, reject) => {
    adminConfig.update(obj, function(err, res) {
      if(err) {
        winston.error(chalk.red(err));
      }
      resolve(res);
    });
  });
}


