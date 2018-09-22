const mongoose = require('mongoose');
const chalk = require('chalk');

let MessageLogSchema = mongoose.Schema({
  sender: {
    type:String,
    required:true,
  },
  receiver: {
    type: String,
    required:true,
  },
  messageId: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  createdAt: {
    type:Date,
    default:function() {
      return new Date();
    }
  },
  deletedBySender: {
    type: Date,
    default: "",
  },
  deletedByReceiver: {
    type: Date,
    default: "",
  },
});

let Messages = module.exports = mongoose.model('message_logs', MessageLogSchema);

// New message log.
module.exports.newMessage = function(newMessage, callback) {
  newMessage.save(callback);
}

// Message History.
module.exports.messageHistory = function(limit, query, callback) {
  Messages.find(query, { sender: 1, receiver: 1, status: 1, messageId: 1, createdAt: 1, _id: 0 }, callback)
                  .sort({ createdAt: -1 })
                  .limit(Number(limit))
}

// For any updation on user. just set fields in `obj` object.
module.exports.updateMessageLog = function(query, obj, callback) {
  Messages.findOneAndUpdate(
    query,
    { $set: obj },
    callback
  )
}

