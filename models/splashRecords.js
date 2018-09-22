const chalk = require('chalk');
const mongoose = require('mongoose');
const winston = require('winston');

let schema = mongoose.Schema({
	email: {
		type: String,
		require: true,
	},
	role: {
		type: String,
		require: true
	},
	createdAt: {
		type: Date,
		default: function() {
			return new Date();
		}
	}
});

var spalshRecords = module.exports = mongoose.model('splash_records', schema);

module.exports.newRecord = function(obj) {
  return new Promise((resolve, reject) => {
    obj.save(function(err, data) {
      if(err) {
        winston.error(chalk.red(err));
      } else {
      	resolve(data);
    	}
    });
  });
}
