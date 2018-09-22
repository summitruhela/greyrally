const mongoose = require('mongoose');
const chalk = require('chalk');

var cashoutSchema = mongoose.Schema({
  user: {
    type: String,
    required: true,
  },
  transactionInfo: {
    tx: {
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

let cashouts = module.exports = mongoose.model('cashouts', cashoutSchema);

// Add entry.
module.exports.addCashout = function(newEntry) {
  return new Promise((resolve, reject) => {
    newEntry.save(function(err, data) {
      if(err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

// Get transaction info.
module.exports.getTransactionInfo = function(query) {
  return new Promise((resolve, reject) => {
    cashouts.find(query, function(err, data) {
      if(err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

// Get transactions.
module.exports.listCashouts = function(query) {
  return new Promise((resolve, reject) => {
    cashouts.find(query, function(err, data) {
      if(err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

// Update.
module.exports.updateCashoutInfo = function(query, obj) {
  return new Promise((resolve, reject) => {
    cashouts.update(
      query,
      { $set:  obj },
      function(err, data) {
        if(err) reject(err);
        resolve(data)
      }
    )
  });
}
