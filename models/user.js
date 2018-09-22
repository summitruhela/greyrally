const mongoose = require('mongoose');
//const bcrypt = require('bcrypt');
const bcrypt = require('bcryptjs');
const chalk = require('chalk');

let UserSchema = mongoose.Schema({
  role: {
    type: String,
    required: true, // admin-1,hacker-2,company-3
    index: true
  },
  name: {
    type: String,
    default: "",
  },
  userName: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true,
  },
  prefrences: {
    type: String,
    required: false,
  },
  pin: {
    type: String,
    required: true,
  },
  pgp: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    default: 0,
  },
  reasonToJoin: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: function () {
      return new Date();
    }
  },
  deletedAt: {
    type: Date,
    default: "",
  },
  updatedAt: {
    type: Date,
    default: function () {
      return new Date();
    },
  },
  updatedBy: {
    type: String,
    ref: 'User'
  },
});

let User = module.exports = mongoose.model('User', UserSchema);

module.exports.createUser = function (newUser, callback) {
  bcrypt.genSalt(10, function (err, salt) {
    bcrypt.hash(newUser.password, salt, function (err, hash) {
      newUser.password = hash;
      newUser.save(callback);
    });
  });
}

module.exports.getOneUser = function (query) {
  return new Promise((resolve, reject) => {
    User.findOne(query, function (err, data) {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

module.exports.getUser = function (query, callback) {
  User.findOne(query, callback);
}

module.exports.findAndUdatePassword = function (username, newPass, callback) {
  bcrypt.genSalt(10, function (err, salt) {
    bcrypt.hash(newPass, salt, function (err, hash) {
      // Store new password as hash in DB.
      User.findOneAndUpdate({
          "userName": username
        }, {
          $set: {
            "password": hash
          }
        },
        callback
      )
    });
  });
}

module.exports.getUserById = function (id, callback) {
  User.findById(id, callback);
}

module.exports.comparePassword = function (candidatePassword, hash, callback) {
  bcrypt.compare(candidatePassword, hash, function (err, isMatch) {
    if (err) throw err;
    callback(null, isMatch);
  });
}

module.exports.getPrimeCompanies = function (callback) {
  User.find({
    $and: [{
      role: 3
    }]
  }, {
    _id: 0
  }, callback);
}

module.exports.searchCompany = function (data, callback) {
  User.find({
    "name": {
      '$regex': data,
      '$options': 'i'
    }
  }, callback);
}

// For any updation on user. just set fields in `obj` object.

module.exports.updateUser = function (user, obj, callback) {
  User.update({
      _id: user._id
    }, {
      $set: obj
    },
    callback
  )
}

module.exports.updateUserChange = function (user, obj, callback) {
  User.findOneAndUpdate({
      userName: user
    }, {
      $set: obj
    },
    callback
  )
}

module.exports.getCronUser = function (user) {
  return new Promise((resolve, reject) => {
    User.find({
      userName: {
        $in: user
      }
    }, {
      email: 1
    }, (err, res) => {
      if (err) {
        reject(err);
      } else {
        resolve(res);
      }
    })
  })
}
