var express = require('express');
var domain = require('express-domain-middleware');
var helpers = require('express-helpers');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');

var app = express();
app.use(domain);
helpers(app);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.disable('etag');

app.locals.toDateString = (d) =>{
  if ( d ) {
    return `${1900+d.getYear()}/${1+d.getMonth()}/${d.getDate()} ${d.getHours()}:${d.getMinutes()}`;
  }
  return '';
}
var models = require('models');
var Challenger = models.Challenger;

express.response.render_with_template = function(view, options, callback) {
  options._view = view
  options._options = options;
  options.title = options.title || '';
  options.error = this.req.query.error;
  options.challengerId = null;
  options.challengerRole = null;
  Challenger.findOne({ _id: this.req.cookies.challengerId }, (err, challenger) =>{
    if ( challenger ) {
      options.challengerId = challenger._id;
      options.challengerRole = challenger.role;
    }
    this.render('template', options, callback)
  })
}

// catch 404 and forward to error handler
app.use( (req, res, next) => {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: err
  });
});

module.exports = app;
