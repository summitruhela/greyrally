const mongoose = require('mongoose');

let TransactionsSchema = mongoose.Schema({
  transactionInfo: {
    tx: {
      block_hash:{ type: String, trim: true },
      block_height: { type: String, trim: true},
      block_index: { type: String, trim: true },
      hash: { type: String, trim: true },
      addresses: { type: Array, trim: true },
      total: { type: String, trim: true },
      fees: { type: String, trim: true },
      size: { type: String, trim: true },
      preference: { type: String, trim: true },
      relayed_by: { type: String, trim: true },
      received:  { type: String, trim: true },
      ver: { type: String, trim: true },
      double_spend: { type: String, trim: true },
      vin_sz: { type: String, trim: true },
      vout_sz: { type: String, trim: true },
      confirmations: { type: String, trim: true },
      inputs: { type: Array, trim: true },
      outputs: { type: Array, trim: true },
    },
    tosign: { type: Array, trim: true },
  },
  auction: {
    type: String,
    required: true,
  },
  buyer: {
    type: String,
    required: true,
  },
  seller: {
    type: String,
    required: true,
  },
  fromBTC: {
    type: String,
    required: true,
  },
  toBTC: {
    type: String,
    required: true,
  },
  amount: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: "1",
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

let transactions = module.exports = mongoose.model('transactions', TransactionsSchema);

module.exports.newTransaction = function(obj) {
  return new Promise((resolve, reject) => {
    obj.save(function(err, data) {
      if(err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

module.exports.getTransactions = function(query) {
  return new Promise((resolve, reject) => {
    transactions.find(query, function(err, data) {
      if(err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

module.exports.getOneTransaction = function(query) {
  return new Promise((resolve, reject) => {
    transactions.findOne(query, function(err, data) {
     if(err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

module.exports.updateTransaction = function(where, obj) {
  return new Promise((resolve, reject) => {
    transactions.findOneAndUpdate(where, { $set: obj }, function(err, data) {
      if(err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}
