const mongoose = require('mongoose');
const chalk = require('chalk');
const winston = require('winston');

let CommentsSchema = mongoose.Schema({
  auction: {
    type:String,
    required:true,
  },
  user: {
    type: String,
    required:true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  status: {
    type:String,
    default:1
  },
  createdAt: {
    type:Date,
    default:function() {
      return new Date();
    }
  },
  deletedAt: {
    type:Date,
    default: "",
  },
  updatedAt: {
    type:Date,
    default:function() {
      return new Date();
    },
  },
});

let Comments = module.exports = mongoose.model('comments', CommentsSchema);

// New auction comment.
module.exports.newComment = function(newComment, callback) {
  newComment.save(function(err, auction) {
    if(err) winston.error(chalk.red(err));
  });
}

// List all related comments.
module.exports.getComments = function(limit, query, callback) {
  Comments.find(query, { auction: 1, user: 1, title: 1, description: 1, createdAt: 1, _id: 0 }, callback)
                  .sort({ createdAt: -1 })
                  .limit(Number(limit))
}

