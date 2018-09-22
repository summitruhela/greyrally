const mongoose = require('mongoose');
const chalk = require('chalk');
const winston = require('winston');

const notificationsSchema = mongoose.Schema({
	user: {
		type: String,
		require: true
	},
	notification: {
		type: String,
		require: true
	},
	// TODO - 'status' should be renamed to 'isUnread'. While you're in there add a 'readAt' Date too.
	status: {
		type: Boolean,
		default: 1
	},
	createdAt: {
		type: Date,
    default:function() {
    	return new Date();
    }
	},
	modifiedAt: {
		type: Date,
	},
	deletedAt: {
		type: Date,
	}
});

const notifications = module.exports = mongoose.model('notifications', notificationsSchema);

module.exports.newNotification = function (schema, callback) {
	schema.save(function(err, response) {
		if(err) {
			winston.error(chalk.red(err));
		}
	});
}


// Returns all the non-deleted notifications for a given user.
// Notifications are returned in reverse chronological order.
module.exports.getAllNonDeletedNotificationsForUser = function(user) {
	return new Promise((resolve, reject) => {
		const nonDeletedQuery = {
			$and: [{
					user
				},
				{
					deletedAt: null
				}
			]
		};
		const selectFields = { notification: 1, createdAt: 1, _id: 1, status: 1 };
		notifications
			.find(nonDeletedQuery)
			.select(selectFields)
			.sort({ createdAt: - 1 })
			.exec((err, res) => {
				if (err) {
					reject(err);
				} else {
					resolve(res);
				}
			});
	});
}

// Returns all the non-deleted notifications for a given user and the unread count of notifications.
// Returned format is: 
// {
//   notifications: [<notification 1>, ...],
//   count: <number of unread>
// }
//
module.exports.getNonDeletedNotificationsAndUnreadCountForUser = function(user) {
	return notifications.getAllNonDeletedNotificationsForUser(user)
		.then(notifications => {
			return {
				notifications: notifications,
				count: notifications.filter(n => n.status).length
			};
		});
}

// Marks all of a users notifications as 'read'.
// Returns the number of unread notifications that were
// marked as read.
module.exports.markNotificationsReadForUser = function(user) {
	return new Promise((resolve, reject) => {
		const unreadQuery = {
			$and: [{
					user
				},
				{
					status: 1
				}
			]
		};
		notifications.update(unreadQuery, { status: 0 }, { multi: true }, (err, res) => {
			if (err) {
				reject(err);
			} else {
				resolve(res.nModified);
			}
		});
	});
}

// Marks a notification to be deleted.
module.exports.markNotificationToBeDeletedForUser = function(notificationId, user) {

	const query = {
    $and: [{
				user,
				notificationId
      },
      {
        deletedAt: null
      }
    ]
  };

	return new Promise((resolve, reject) => {
    notifications.update(query, { $set: { deletedAt: new Date() }}, function(err, response) {
      if(err) {
        reject(err);
      } else {
	      resolve(response);
	    }
    });
  });
}
