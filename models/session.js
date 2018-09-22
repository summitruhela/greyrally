const mongoose = require('mongoose');
const chalk = require('chalk');

var SessionSchema = mongoose.Schema({
  user: {
    type: String,
    required: true,
  },
  hash: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    default: 1,
  },
  createdAt: {
    type: Date,
    default:function() {
      return new Date();
    }
  },
  deletedAt: {
    type: Date,
    default: ""
  },
});

var Session = module.exports = mongoose.model('Session', SessionSchema);

module.exports.createSession = function(newSession) {
  return new Promise ((resolve, reject) => {
    newSession.save( function(err, session) {
      if(err) {
        reject(err)
      } else {
        resolve(session);
      }
    });
  })
}

// For any updation on auction. just set fields in `obj` object.
module.exports.updateSession = function(username, obj) {
  return new Promise((resolve, reject) => {
    Session.findOneAndUpdate(
      { $and : [ { "user" : username }, { "status" : "1"} ] },
      { $set: obj },
      function(err, data) {
        if(err) {
          reject(err);
        } else {
          resolve(data);
        }
      }
    )
  })
}

module.exports.getSession = function(query) {
  return new Promise ((resolve, reject) => {
    Session.findOne(query, function(err, data) {
      if(err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  })
}

