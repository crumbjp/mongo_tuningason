'use strict';
var model = require('models');
var Score = model.Score;
var NUM_USERS = 10000;
var TAGS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

var userNames = []

for ( var i = 0 ; i < NUM_USERS; i++ ) {
  userNames.push(`mongo_tuningason_user_name${i*300}`);
}

class StageBase {
  constructor(config) {
    this.config = config;
    this.config.timeout = 10000;
    this.runTimeout = 5000;
    this.timeOver = null;
    this.allUserNames = userNames;
    this.allTags = TAGS.split('');
  }

  resultScore(err, done) {
    this.end = Date.now();
    console.log(`done: ${this.end-this.start}`, err);

    Score.update({
      stage: this.config.stage,
      name: this.config.name,
      startAt: this.config.startAt,
    }, {
      result: (err?'failed':'clear')
    }, {}, done);
  }

  start(done) {
    var _this = this;
    this.start = Date.now();
    this.timeout = setTimeout( () => {
      _this.timeOver = 'Time over';
      _this.resultScore(_this.timeOver, done)
    }, this.runTimeout);
    this.run((err) => {
      if ( !this.timeOver ) {
        clearTimeout(_this.timeout)
        _this.resultScore(err, done)
      }
    })
  }
}

module.exports = StageBase;
