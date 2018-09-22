var config = require('../config');
var mongoose = require('mongoose');

mongoose.Promise = global.Promise;

module.exports = {
  makeConnectionString: function () {
    'use strict'
    var mongoConfig = config.connections.mongoDb;
    var connectionString = 'mongodb://';
    if(mongoConfig.user && mongoConfig.password){
      connectionString +=mongoConfig.user;
      connectionString +=':';
      connectionString +=mongoConfig.password;
      connectionString +='@';
    }
    if(!mongoConfig.host){
      throw new Error('The field host is required.',mongoConfig);
    }
    connectionString +=mongoConfig.host;
    if(mongoConfig.port){
      connectionString +=':';
      connectionString +=mongoConfig.port;
    }
    connectionString +='/';
    connectionString +=mongoConfig.database;

    return connectionString;
  }
};
