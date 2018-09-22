const mongoose = require('mongoose');

let WalletSchema = mongoose.Schema({
  user: {
    type:String,
    required:true,
  },
  email: {
    type: String,
    required:true,
  },
  guid: {
    type: String,
    required: true,
  },
  BTCadd: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: 1,
  },
  createdAt: {
    type:Date,
    default:function() {
      return new Date();
    }
  },
  deletedAt: {
    type: Date,
    default: "",
  },
});

let wallets = module.exports = mongoose.model('user_wallet', WalletSchema);

module.exports.getUserWallet = function(query) {
  return new Promise((resolve, reject) => {
    wallets.findOne(query, function(err, data) {
      if(err) reject(err);
      resolve(data);
    });
  });
}

module.exports.newWallet = function(newWalletAdd, callback) {
  newWalletAdd.save(callback);
  return new Promise((resolve, reject) => {
    newWalletAdd.save(function(err, data) {
      if(err) reject(err);
      resolve(data);
    });
  });
}

// Archive other BTC addresses.
module.exports.archiveBTC = function(guid, obj) {
  return new Promise((resolve, reject) => {
    wallets.updateMany (
      { "guid" : guid },
      { $set: obj },
      function(err, data) {
      if(err) reject(err);
      resolve(data);
    });
  });
}
