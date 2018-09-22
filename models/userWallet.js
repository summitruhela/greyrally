const mongoose = require('mongoose');

let WalletSchema = mongoose.Schema({
  user: {
    type:String,
    required:true
  },
  email: {
    type: String,
    required:true
  },
  privateAdd: {
    type: String,
    required: true
  },
  BTCadd: {
    type: String,
    required: false
  },
  status: {
    type: String,
    default: 1
  },
  createdAt: {
    type:Date,
    default:function() {
      return new Date();
    }
  },
  deletedAt: {
    type: Date,
    default: ""
  }
});

let userWallet = module.exports = mongoose.model('user_wallet', WalletSchema);

module.exports.getUserWallet = function(query) {
  return new Promise((resolve, reject) => {
    userWallet.findOne(query, function(err, data) {
      if(err) reject(err);
      resolve(data);
    });
  });
}

module.exports.newWalletForUser = function(newWalletAdd, callback) {
  return new Promise((resolve, reject) => {
    newWalletAdd.save(function(err, data) {
      if(err) reject(err);
      resolve(data);
    });
  });
}

