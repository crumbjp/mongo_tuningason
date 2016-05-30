'use strict';
var async = require('async');
var stages = {
  stage1: require('./stage1'),
  stage2: require('./stage2'),
  stage3: require('./stage3'),
  stage4: require('./stage4'),
  stage5: require('./stage5'),
}

var models = require('models');
var Score = models.Score;
var Challenger = models.Challenger;

var start = (done) => {
  console.log('Loader start');
  Challenger.find({
    status: 'active',
  }, (err, challengers) => {
    async.eachSeries(challengers, (challenger, done) => {
      if ( !challenger.stage ) {
        return done(null)
      }
      var Stage = stages[challenger.stage];
      if ( !Stage ) {
        return done(null)
      }
      console.error(` - run: ${challenger.name} : ${challenger.stage}`);
      var stage = new Stage({
        stage: challenger.stage,
        name: challenger.name,
        startAt: new Date(),
        baseUri: `http://${challenger.addr}`,
      });
      stage.start(done);
    }, (err) => {
      console.log('Loader finished');
      done(err)
    })
  })
}
exports.start = start
