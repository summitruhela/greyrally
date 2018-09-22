const express = require('express');
const router = express.Router({
  caseSensitive: true,
  strict: true
});
const passport = require('passport');

const LocalStrategy = require('passport-local').Strategy;

// Models ...
const User = require('../../models/user');

// Controllers ...
const adminController = require('../../controllers/admin/admin.controller.js');
const auctionController = require('../../controllers/auction.controller.js')

// Signin.
router.get('/login', adminController.signinGet);
router.post('/login',
  passport.authenticate('local', {
    failureRedirect: '/admin/login',
    failureFlash: true,
  }), function(req, res) {
    if(req.user.role == 1) {
        res.redirect('/admin/' + req.user.userName);
    } else {
        req.logout();
        req.flash("error", "Unauthenticated");
        res.redirect('/login');
    }
  }
);

// Settings.
router.get('/settings',
            adminController.adminSettings);

// Change default setting.
router.post('/change-settings',
            adminController.changeSetting);

// Users.
router.get('/users',
            ensureAdminAuthenticated,
            adminController.users);
router.post('/userList',
            ensureAdminAuthenticated,
            adminController.userList);

// Auctions.
router.get('/auctions',
            ensureAdminAuthenticated,
            adminController.auctions);
router.post('/auctionList',
            ensureAdminAuthenticated,
            adminController.auctionList);

// Auction details.
router.get('/auctions/:auction/details',
            ensureAdminAuthenticated,
            adminController.auctionDetails);

// User details.
router.get('/users/:username/profile',
            ensureAdminAuthenticated,
            adminController.userDetails);

// Auction stats.
router.get('/auctions/stats',
            adminController.auctionStatsList);

// Auction stats.
router.post('/auctions/auctionStats',
              adminController.auctionStats);

// Approve/Unapprove auction.
router.post('/auctions/:auction/unapprove',
            adminController.unapproveAuction);
router.post('/auctions/:auction/approve',
            adminController.approveAuction);

// Enable/Disable auction.
router.get('/auctions/:auction/enable',
            adminController.enableAuction);
router.get('/auctions/:auction/disable',
            adminController.disableAuction);

// Enable/Disable user.
router.get('/users/:username/enable',
            adminController.enableUser);
router.get('/users/:username/disable',
            adminController.disableUser);

// Auction bids.
router.get('/auctions/bids',
            adminController.auctionBids);
router.post('/auctionBids',
            adminController.auctionBidList);

// Auction transaction approval.
router.get('/auctions/:auction/transactions/confirm',
            adminController.confirmTransaction);

// Admin change password.
router.get('/change-password',
            adminController.changePasswordGet);
router.post('/change-password',
            adminController.changePasswordPost);

// Admin logout.
router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/admin/login');
})

// List transactions.
router.get('/transactions',
            adminController.transactions);
router.post('/transactionList',
            adminController.allTransactions);

// Track transaction.
router.get('/transactions/:hash/info',
            adminController.transactionInfo);

// Dashboard.
router.get('/:username',
            ensureAdminAuthenticated,
            adminController.dashboard);

function ensureAdminAuthenticated(req, res, next) {
  if(!req.isAuthenticated()) {
    req.flash('err', "Unauthenticated.");
    res.redirect('/admin/login');
  } else {
    next();
  }
}

module.exports = router;
