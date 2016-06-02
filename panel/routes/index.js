var express = require('express');
var router = express.Router();
var async = require('async');
var _ = require('lodash');

var models = require('models');
var Score = models.Score;
var Challenger = models.Challenger;

logout = (req, res) => {
  res.cookie('challengerId', '', {maxAge:0, httpOnly: true});
  res.redirect('/');
}

getChallenger = (_id, done) => Challenger.findOne({ _id }, done)

requireLogin = (req, res, done) => {
  getChallenger(req.cookies.challengerId, (err, challenger) => {
    if ( !challenger || challenger.role != 'admin' && challenger._id != req.params.challengerId) {
      return res.redirect('/?error=Not authorized');
    }
    done(null, challenger);
  });
}

requireAdmin = (req, res, done) => {
  getChallenger(req.cookies.challengerId, (err, challenger) => {
    if ( !challenger || challenger.role != 'admin' ) {
      return res.redirect('/');
    }
    done(null, challenger);
  });
}

router.get('/', (req, res, next) => {
  Score.aggregate([{
    $match: {
      result: 'clear'
    },
  },{
    $sort: {
      name: 1,
      stage: -1,
      'all.success': -1,
      'all.elapse': 1
    },
  },{
    $project: {
      name: 1,
      best: {
        stage: '$stage',
        num: '$all.success',
        score: {
          $multiply: [
            {
              $divide: ['$all.success', '$all.elapse']
            },
            '$numLoaders'
          ]
        },
        startAt: '$startAt'
      }
    },
  },{
    $group: {
      _id: '$name',
      bests: {
        $push: '$best'
      }
    }
  },{
    $project: {
      _id: 1,
      bests: {
        $slice: ['$bests', 5, 5]
      }
    }
  },{
    $unwind: '$bests'
  },{
    $group: {
      _id: 1,
      'stage': { $first: '$bests.stage' },
      'num': { $sum: '$bests.num' },
      'score': { $avg: '$bests.score' },
      'startAt': { $max: '$bests.startAt' },
    }
  },{
    $sort: {
      'stage': -1,
      'num': -1,
      'score': -1,
      'startAt': 1
    }
  }], (err, results) => {
    if ( err || !results ) {
      results = {}
    }
    console.log(results)
    res.render_with_template('index', {rankings: results})
  })
});

router.post('/login', (req, res, next) => {
  Challenger.findOne({ name: req.body.name }, (err, challenger) => {
    if ( !challenger || challenger.password != req.body.password ) {
      return res.redirect('/?error=Login failed');
    }
    res.cookie('challengerId', challenger._id, {maxAge:3600000, httpOnly: true});
    return res.redirect('/');
  });
});

router.get('/logout', (req, res, next) => logout(req, res) )

router.get('/challengers/:challengerId', (req, res, next) => {
  getChallenger(req.params.challengerId, (err, challenger) => {
    var STAGES = [
      { name: 'stage1', mandatory: 'How to get profile? How to narrow down bottle neck queries?'},
      { name: 'stage2', mandatory: 'Basic index knowledge.'},
      { name: 'stage3', mandatory: 'Delicate index tuning.'},
      { name: 'stage4', mandatory: 'How to save index space?'},
      { name: 'stage5', mandatory: 'Not implemented...'},
    ];
    async.mapSeries(STAGES, (stage, done) => {
      Score.findOne({
        name: challenger.name,
        stage: stage.name,
        result: {
          $in: ['clear', 'failed']
        }
      })
        .sort({startAt: -1})
        .exec(done)
    }, (err, results) => {
      var active = true;
      var stages = [];
      for ( var i in STAGES ) {
        var STAGE = STAGES[i];
        var result = results[i];
        if ( STAGES.name == 'stage5' ) {
          active = false;
        }
        stages.push({
          name: STAGE.name,
          status: (result?result.result:null),
          current: (challenger.stage == STAGE.name),
          mandatory: STAGE.mandatory,
          score: 0,
          active
        });
        if ( !result || result.result != 'clear') {
          active = false;
        }
      }
      res.render_with_template('challenger', {
        title: `Change ${challenger.name}'s stage`,
        challenger: challenger,
        stages
      });
    });
  });
});


var CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
genStr = (n) => {
  var ret = ''
  for ( var i = 0 ; i < n ; i++ ){
    ret += CHARS[Math.floor(Math.random()*CHARS.length)];
  }
  return ret;
}

router.post('/challengers/:challengerId', (req, res, next) => {
  requireLogin(req, res, (err, challenger) => {
    var update = {
      $set: {
        updatedAt: new Date(),
      }
    }
    if ( req.body.stage ) {
      update.$set.stage = req.body.stage;
    }
    Challenger.update({
      _id: req.params.challengerId
    }, update, {}, (err) => {
      res.redirect(req.headers.referer);
    });
  });
});

router.get('/challengers', (req, res, next) => {
  requireAdmin(req, res, (err) =>{
    Challenger.find({}, (err, challengers) => {
      if (err) {
        throw Error('challengers')
      }
      res.render_with_template('challengers', {
        title: `Challenger list`,
        challengers: challengers
      })
    })
  });
});

router.post('/challengers', (req, res, next) => {
  requireAdmin(req, res, (err) =>{
    var update = {
      $setOnInsert: {
        stage: 'stage1',
        name: req.body.name,
        password: genStr(6),
      },
      $set: {
        updatedAt: new Date(),
      }
    }
    if ( req.body.status ) {
      update.$set.status = req.body.status;
    }
    if ( req.body.addr ) {
      update.$set.addr = req.body.addr;
    }
    if ( !req.body._id ) {
      req.body._id = new models.ObjectId()
    }
    if ( !req.body.name ) {
      return res.redirect("/challengers?error=Name is required");
    }
    if ( req.body.status == 'active' && !req.body.addr ) {
      return res.redirect("/challengers?error=Address is required when active");
    }
    Challenger.update({
      _id: req.body._id
    }, update, {
      upsert: true
    }, (err) => {
      return res.redirect("/challengers");
    })
  });
});

module.exports = router;
