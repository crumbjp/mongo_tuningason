'use strict';
var async = require('async');
var Loader = require('./loader');
var StageBase = require('./stage_base');

class Stage1 extends StageBase {
  run(done) {
    var _this = this;
    this.userNames = this.allUserNames.slice(-3, -1);
    this.tags = this.allTags.slice(0, 2);
    var start = Date.now();
    async.each(this.userNames, (userName, done) => {
      var loader = new Loader(_this.config);
      async.series([
        (done) => loader.requestIndex(done),
        (done) => loader.requestLogin(userName, done),
        (done) => loader.requestMain(done),
        (done) => loader.requestUser(userName, done),
        (done) => loader.requestMain(done),
        (done) => loader.requestUser(userName, done),
        (done) => loader.requestMain(done),
        (done) => loader.requestUser(userName, done),
        (done) => loader.requestMain(done),
      ], done);
    }, done)
  }
}

module.exports = Stage1;
