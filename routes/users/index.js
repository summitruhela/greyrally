const express = require('express');
const moment = require('moment');
const multer = require('multer');
const passport = require('passport');
const parser = require('body-parser');
const requestIp = require('request-ip');
const router = express.Router({
  caseSensitive: true,
  strict: true
});
const urlencodedParser = parser.urlencoded({
  extended: false
});

const LocalStrategy = require('passport-local').Strategy;

// Models ...
const User = require('../../models/user');

// Controllers ...
const homeController = require('../../controllers/home.controller');
const userController = require('../../controllers/user.controller');
const commonController = require('../../controllers/common.controller');
const auctionController = require('../../controllers/auction.controller');
const transactionController = require('../../controllers/transactions.controller');
const authHandler = require('../../controllers/middleware');

// Document uploading ==========================================================
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    'use strict'
    cb(null, 'public/uploads');
  },
  filename: function (req, file, cb) {
    var filename = file.originalname;
    var fileExtension = filename.split(".")[1];
    var filename2 = filename.split(".")[0];
    var dateTimeString = moment(Date.now()).format("DD-MM-YYYY-HH:mm:ss");
    if (fileExtension == undefined) {
      fileExtension = "txt";
    }
    cb(null, dateTimeString + '(' + req.user.userName + ')-' + filename);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 25000000
  }
});


//==============================================================================


//========================= Routes =============================================
router.get('/policy',
  userController.policyGet);
router.get('/login',
  userController.loginGet);
router.post('/login',
  passport.authenticate('local', {
    failureRedirect: '/login',
    failureFlash: true,
  }),
  function (req, res) {
    if (req.user.role == 1) {
      req.logout();
      req.flash("error", "Unauthenticated");
      res.redirect("/login");
    } else {
      res.redirect('/users/' + req.user.userName + '/feed');
    }
  });

router.post('/signup', userController.signupPost);

// TOS.
router.get('/terms-conditions', function (req, res) {
  if (req.isAuthenticated()) {
    res.render('tos/tos', {
      user: req.user.userName,
    });
  } else {
    res.render('tos/tos', {
      user: 'NotLoggedIn',
    });
  }
});

// Team.
router.get('/team', function (req, res) {
  res.redirect(302, 'https://greyrally.com/blog/meet-the-team/');
});

// Create Auction.
router.get('/users/:username/create-auction',
authHandler.verify,
  ensureAuthenticated,
  auctionController.createAuctionGet);
router.post('/create-auction',
  upload.array('doc', 10),
  auctionController.createAuctionPost);

// List all active auction.
router.get('/users/:username/auctions',
authHandler.verify,
  ensureAuthenticated,
  auctionController.listUserAuctions);

// Disabled. Out of scope.
// // Edit Auction
// router.get('/users/:username/auctions/:auction/edit',
//            ensureAuthenticated,
//            auctionController.editAuctionGet);
// router.post('/users/:username/auctions/:auction/edit',
//              upload.array('doc', 10),
//              auctionController.editAuctionPost);

// RATE AUCTION
router.post('/users/:username/auctions/:auction/rating',
authHandler.verify,
  ensureAuthenticated,
  auctionController.auctionRating);

// Forgot-password.
router.get('/reset-password', userController.resetPasswordGet);
router.post('/reset-password', userController.resetPasswordPost);

// Reset-password.
router.get('/users/reset-password',
  userController.userResetPasswordGet);
router.post('/users/reset-password',
  userController.userResetPasswordPost);

// Followed auction.
router.get('/users/:username/auctions/followed',
authHandler.verify,
  ensureAuthenticated,
  userController.userFollowedAuctions)

// User's feed.
router.get('/users/:username/feed',
  authHandler.verify,
  ensureAuthenticated,
  userController.userFeed);

// View Auction
router.get('/users/:username/auctions/:auction',
  authHandler.verify,
  ensureAuthenticated,
  requestIp.mw(), // Middleware gor get ip address for count views.
  auctionController.viewAuctionDetailsGet);

// Show user Profile.
router.get("/users/:username/profile",
  authHandler.verify,
  ensureAuthenticated,
  userController.showUserProfile);

// Home page.
router.get('/', function (req, res) {
  if (req.user) {
    res.redirect('/users/' + req.user.userName + '/feed');
  } else {
    res.redirect('/welcome');
  }
});

router.get('/welcome', userController.landingPage)

router.post('/welcome', function (req, res) {
  res.redirect("/login");
})

// Pre follow auction.
router.get('/auction/:auction/preFollow',
  userController.preFollowAuction);

// Follow-unfollow auction.
router.get('/users/:username/auctions/:auction/follow',
  authHandler.verify,
  ensureAuthenticated,
  userController.followAuction);
router.get('/users/:username/auctions/:auction/unfollow',
  authHandler.verify,
  ensureAuthenticated,
  userController.unfollowAuction);

// Bid on auction.
router.post('/users/:username/auctions/:auction/bid',
authHandler.verify,
  ensureAuthenticated,
  userController.bidAuction);

// Change user password.
router.post('/users/:username/change-password',
authHandler.verify,
  ensureAuthenticated,
  userController.changePass);

// Change user email.
router.post('/users/:username/change-email',
authHandler.verify,
  ensureAuthenticated,
  userController.changeEmail);

// Change user PIN.
router.post('/users/:username/change-PIN',
authHandler.verify,
  ensureAuthenticated,
  userController.changePIN);

// Change user's PGP public key.
router.post('/users/:username/change-PGP',
authHandler.verify,
  ensureAuthenticated,
  userController.changePGP);

// User's transaction history.
router.get('/users/:username/transactions/history/:tab*?',
authHandler.verify,
  ensureAuthenticated,
  transactionController.transactions);

// Track transaction.
router.get('/users/:username/transactions/:hash/info',
authHandler.verify,
  ensureAuthenticated,
  transactionController.transactionInfo);

// Track transaction.
router.post('/users/:username/updateConfirmations',
authHandler.verify,
  ensureAuthenticated,
  transactionController.getConfirmations);

// Check user-login status.
router.get('/users/:auction/login-status',
  userController.checkLoginStatus);

// Track unconfirmed transactions.
router.get('/users/:username/transactions/:address/unconfirmed',
  transactionController.listUnconfirmedTrx);

// User's wallet info.
router.get('/users/:username/wallet',
authHandler.verify,
  ensureAuthenticated,
  transactionController.userWallet);
// IE
router.get('/internetexplorer',
  commonController.internetexplorer);

// About.
router.get('/about-us',
  commonController.aboutUs);

// Splash page.
router.get('/splash', function (req, res) {
  res.render('splash/splash');
});

//FAQ page
router.get('/FAQ',
  commonController.help);

// Splash page.
router.post('/thanks', commonController.splashRegistration);

// Splash TEST
router.get('/tsplash', function (req, res) {
  res.render('splash/tsplash');
});


// Sponsors and recommended companies.
router.get('/sponsors',
  commonController.sponsors);

router.get('/users/active',
  userController.activeAccount);

// User overview.
router.get('/users/:username/overview',
authHandler.verify,
  ensureAuthenticated,
  userController.userReview);

// Cashout.
router.post('/users/:username/transactions/cashout',
authHandler.verify,
  ensureAuthenticated,
  transactionController.cashout);

// Seller page
router.get('/users/:username/seller/:sellername',
  authHandler.verify,
  ensureAuthenticated,
  userController.seller)

// Buyer page
router.get('/users/:username/buyer/:buyername',
authHandler.verify,
  ensureAuthenticated,
  userController.buyer)

// PGP Public key page
router.get('/PGP/public', function (req, res) {
  res.render("PGP/public", {
    user: req.user.userName,
    publickey: process.env.PGP_PUBLIC_KEY
  })
})
// =============================================================================

//========================= AJAX Calls =========================================
router.post('/checkEmailAvailability',
  commonController.checkEmailAvailability);
router.post('/checkusernameAvailability',
  commonController.checkusernameAvailability);
router.post('/checkAuctionAvailability',
  auctionController.checkAuctionAvailability);
router.get('/search',
  commonController.search);
router.post("/users/:username/enable",
  userController.enableUser);
router.post("/users/:username/auctions/:auction/buy",
  transactionController.buyAuction);
router.post("/validatePIN",
  userController.validatePIN);
router.post("/countNotifications",
  userController.countNotifications);
router.delete("/removeCurrentUserNotification",
  userController.removeCurrentUserNotification);
router.post("/markCurrentUserNotificationsRead",
  userController.markCurrentUserNotificationsRead);
router.post("/users/transactions/:id/unconfirmed",
  transactionController.trackUnconfirmedTrx);

router.post('/signout', function (req, res) {
  req.logout();
  res.sendStatus(200);
});

passport.use(new LocalStrategy({
    passReqToCallback: true
  },
  function (req, username, password, done) {
    //console.log(`passport local called`)
    // Login via username or email.
    let criteria = (username.indexOf('@') === -1) ? {
      $and: [{
        userName: username
      }, {
        status: 1
      }]
    } : {
      $and: [{
        email: username
      }, {
        status: 1
      }]
    };
    User.getUser(criteria, function (err, user) {
      if (err) throw err;
      if (!user) {
        return done(null, false, {
          message: 'Provided credentials are invalid.'
        });
      }

      User.comparePassword(password, user.password, function (err, isMatch) {
        if (err) throw err;
        if (isMatch) {
          return done(null, user);
        } else {
          return done(null, false, {
            message: 'Provided credentials are invalid.'
          });
        }
      });
    });
  }));

passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.getUserById(id, function (err, user) {
    if (user.role != 1) {
      user.pin = user.pin; //commonController.decrypt(user.pin);
    }
    done(err, user);
  });
});

function ensureAuthenticated(req, res, next) {
  if (!req.isAuthenticated()) {
    req.flash('error', "Unauthenticated.");
    res.redirect('/login');
  } else {
    // If someone try to modify url parameters.
    if (req.params.username != req.user.userName) {
      req.logout();
      req.flash('error', "Session expired. Login again to continue.");
      res.redirect('/login');
    } else {
      next();
    }
  }
}
// =============================================================================

module.exports = router;