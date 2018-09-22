process.env.NODE_ENV = process.env.NODE_ENV || 'development';

const bodyParser = require('body-parser');
const chalk = require('chalk');
const cron = require('node-cron');
const cookieParser = require('cookie-parser');
const express = require('express');
const basicAuth = require('basic-auth');
const http = require('http');
const favicon = require('serve-favicon');
const flash = require('connect-flash');
// const expressValidator = require('express-validator');
const helmet = require('helmet')
const logger = require('morgan');
const mongoose = require('mongoose');
const passport = require('passport');
const path = require('path');
const session = require('express-session');
const slash   = require('express-slash');
const Strategy = require('passport-local').Strategy;
const useragent = require('express-useragent');
const winston = require('winston');
//const cryptoAsync = require('crypto-async');

const cronJobs = require('./cronJobs/cronJobs');

// Load environment variable.
require('dotenv').config()

// Init App
const app = express();

// Basic bunch security attack prevention.
app.use(helmet())

app.enable('strict routing');
app.disable('x-powered-by');
//app.use(function(req, res, next) {
//  let user = basicAuth(req);
//  if (user === undefined || user['name'] !== 'grey' || user['pass'] !== 'rally') {
//    res.statusCode = 401;
//    res.setHeader('WWW-Authenticate', 'Basic realm="MyRealmName"');
//    res.end('Unauthorized');
//  } else {
//    next();
//  }
//});

/* setup socket.io */
var server = http.createServer(app);
var io = require('socket.io').listen(server);
server.listen(process.env.PORT || 3000);
winston.info(chalk.green("Server listening at port:" + process.env.PORT));
io.set("origins", "*:*");

app.use(function(req, res, next) {
  req.io = io;
  next();
});

const mongoDb = require('./helpers/mongoDb');

const userRoutes = require('./routes/users');
const adminRoutes = require('./routes/admin');

// ========================== Database Connection ==============================
const mongoURL = mongoDb.makeConnectionString();
mongoose.connect(mongoURL);
const db = mongoose.connection;

db.on('connecting', function() {
  winston.info(chalk.yellow('connecting to MongoDB...'));
});

db.on('error', function(error) {
  winston.error(chalk.red('Error in MongoDb connection: ' + error));
  mongoose.disconnect();
});

db.on('connected', function() {
  winston.info(chalk.green(mongoURL+' => connected'));
});

db.once('open', function() {
  winston.info(chalk.green('MongoDB connection opened!'));
});

db.on('reconnected', function () {
  winston.info(chalk.blue('MongoDB reconnected!'));
});

app.use(function(req, res, next) {
  req.db = db;
  next();
});

mongoose.Promise = global.Promise;
// =============================================================================

// Cron-job to check auction expiration on everyday at 13.00.
// cron.schedule('50 * * * * *', function() {
//   cronJobs.checkAuctionExpiry(db);
// });

// // Disabling this cron. Uncomment for production. Its involves real time transaction.
// // Cron-job to check transaction status.
//  cron.schedule('0 */15 * * * *', function() {
//    cronJobs.checkTransactionStatus(db);
//  });


//  //Cron job for checking the expiration of auction and sending them email
// cron.schedule('50 * * * * *', function(){
// cronJobs.checkAuctionStatus()
// })

// User agent.
app.use(useragent.express());

// BodyParser Middle-ware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser('secret'));

app.use(express.static(path.join(__dirname, 'public')));

const cookieExpirationDate = new Date();
const cookieExpirationDays = 365;
cookieExpirationDate.setDate(cookieExpirationDate.getDate() + cookieExpirationDays);

// Express Session
app.use(session({
  secret: 'secret',
  saveUninitialized: true,
  resave: true,
  cookie: {
    httpOnly: true,
    secure: false,
    expires: cookieExpirationDate,
  },
  // it will recalculate the expiry value by setting the maxAge offset, applied to the current time
  rolling: true
}));

// Passport init
app.use(passport.initialize());
app.use(passport.session());

// Connect Flash
app.use(flash());

// Handling double slash. /login///user will be redirect to /login/user.
app.use(function(req, res, next) {
  if (req.url.indexOf('//') > -1) {
    return res.redirect(req.url.replace(/\/\/+/g, '/'));
  } else {
    next();
  }
});

app.use('/admin', adminRoutes);
app.use('/', userRoutes);

app.use(slash());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  res.render('404');
});

module.exports = app;
