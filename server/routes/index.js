var express = require('express');
var router = express.Router();
var models = require('models');
var _ = require('lodash');

var User = models.User;
var Tweet = models.Tweet;

var SUCIDE_TIMEOUT = 30000;
router.orgGet = router.get;
router.get = function (path, callback) {
  this.orgGet(path, (req, res, next) => {
    res.sucideTimeout = setTimeout(()=>{
      console.error('Maybe hung up..')
      process.exit(1)
    }, SUCIDE_TIMEOUT);
    callback(req, res, next)
  })
}

express.response.orgEnd = express.response.end;
express.response.end = function(chunk, encoding) {
  clearTimeout(this.sucideTimeout);
  this.orgEnd(chunk, encoding)
}

var TIMEOUT = 10000

router.get('/', (req, res, next) =>
  res.render('index', { title: 'Index' })
);

getFollowers = (user, done) =>
  User.find({
    followIds: user._id,
    status: 'active',
  })
  .select({ name: 1 })
  .maxTime(TIMEOUT)
  .exec((err, followers) => {
    if ( err ) {
      throw Error('getFollowers')
    }
    user.followers = followers;
    done(null, user);
  });

getUserByName = (name, done) =>
  User.findOne({
    name,
    status: 'active',
  })
  .maxTime(TIMEOUT)
  .exec((err, user) => {
    if ( err || !user ) {
      throw Error('getUserByName')
    }
    done(err, user)
  });

getUserByNameWithFollowers = (name, done) =>
  getUserByName(name,  (err, user) => getFollowers(user, done) )

getLoginUser = (req, done) =>
  User.findOne({
    _id: req.cookies.userId,
    status: 'active'
  })
  .maxTime(TIMEOUT)
  .exec((err, user) => {
    if ( err || !user ) {
      throw Error('getLoginUser')
    }
    getFollowers(user, done);
  });

getUsers = (userIds, select, done) => {
  User.find({
    _id: {$in: userIds},
    status: 'active'
  })
    .select(select)
    .maxTime(TIMEOUT)
    .exec((err, users) => {
      if (err){
        throw Error('getUsers');
      }
      done(null, users)
    })
}

appendUserName = (tweets, done) => {
  userIds = _.chain(tweets)
    .map((tweet) => tweet.userId.toString() )
    .uniq()
    .value();
  getUsers(userIds, {name: 1}, (err, users)=> {
    userById = _.keyBy(users, '_id');
    tweets = _.chain(tweets)
      .map((tweet) => {
        if ( ! userById[tweet.userId] ) {
          return null;
        }
        tweet.name = userById[tweet.userId].name;
        return tweet;
      })
      .compact()
      .value();
    done(null, tweets);
  });
}

router.post('/login', (req, res, next) => {
  getUserByName(req.body.name, (err, user) => {
    // Omit auth-process
    User.update({_id: user._id}, {
      $set: {
        lastLogin: new Date()
      },
      $inc: {
        numLogin: 1
      }
    })
    .exec((err) => {
      if (err) {
        return res.status(422).send("error");
      }
      // Omit session-cookie
      res.cookie('userId', user._id, {maxAge:3600000, httpOnly: true});
      res.render('login', { title: 'Login success' })
    });
  });
});

router.get('/main', (req, res, next) => {
  getLoginUser( req, (err, user) => {
    Tweet.find({
      userId: { $in: _.concat(user.followIds, user._id) },
      deletedAt: null
    })
      .sort({createdAt: -1})
      .limit(100)
      .maxTime(TIMEOUT)
      .exec((err, tweets) => {
        if ( err ) {
          throw Error('main tweets');
        }
        appendUserName(tweets,  (err, tweets) => res.render('main', { user, tweets }));
      });
  });
});

router.get('/api/followers/:userName', (req, res, next) => {
  getUserByNameWithFollowers( req.params.userName, (err, user) => {
    res.header('Content-Type', 'text/javascript; charset=utf-8');
    res.send(_.map(user.followers, (follower) => follower.name ));
  });
});

router.get('/api/follows/:userName', (req, res, next) => {
  getUserByNameWithFollowers( req.params.userName, (err, user) => {
    getUsers(user.followIds, {_id: 1}, (err, users)=> {
      res.header('Content-Type', 'text/javascript; charset=utf-8');
      res.send(_.map(users, (user) => user.name ));
    })
  });
});

router.get('/users/:userName', (req, res, next) => {
  getUserByNameWithFollowers(
    req.params.userName,
    (err, user) => {
      Tweet.find({
        userId: { $in: _.concat(user.followIds, user._id) },
        deletedAt: null
      })
        .sort({createdAt: -1})
        .limit(100)
        .maxTime(TIMEOUT)
        .exec((err, tweets) => {
          if ( err ) {
            throw Error('users tweets');
          }
          appendUserName(tweets, (err, tweets) =>
            res.render('user', { user, tweets })
          );
        });
    });
});

router.get('/users/:userName/mentions', (req, res, next) => {
  getUserByNameWithFollowers(
    req.params.userName,
    (err, user) => {
      Tweet.find({
        mentions: req.params.userName,
        deletedAt: null
      })
        .sort({createdAt: -1})
        .limit(100)
        .maxTime(TIMEOUT)
        .exec((err, tweets) => {
          if ( err ) {
            throw Error('users mentioned tweets');
          }
          appendUserName(tweets, (err, tweets) =>
            res.render('mention', { user, tweets })
          );
        });
    });
});

router.get('/tags/:tag', (req, res, next) => {
  Tweet.find({
    tags: req.params.tag,
    deletedAt: null
  })
    .sort({createdAt: -1})
    .limit(100)
    .maxTime(TIMEOUT)
    .exec((err, tweets) => {
      if ( err ) {
        throw Error('users tweets');
      }
      appendUserName(tweets, (err, tweets) =>
        res.render('tag', { tag: req.params.tag, tweets })
      );
    });
});

router.post('/post', (req, res, next) => {
  getLoginUser( req, (err, user) => {
    var tags = [];
    var mentions = [];
    var tokens = req.body.body.split(' ');
    for ( var i in tokens ) {
      var token = tokens[i];
      if ( token[0] == '#' ) {
        tags.push(token.slice(1));
      }
      if ( token[0] == '@' ) {
        mentions.push(token.slice(1));
      }
    }
    Tweet.create({
      userId: user._id,
      body: req.body.body,
      tags,
      mentions,
      createdAt: new Date()
    }, (err) => {
      if (err) {
        res.status(422);
        return res.render('main');
      }
      return res.redirect('/main');
    });
  });
});

module.exports = router;
