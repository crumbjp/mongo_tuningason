'use strict';
var async = require('async');
var Loader = require('./loader');
var StageBase = require('./stage_base');

class Stage2 extends StageBase {
  constructor(config) {
    super(config)
    this.runTimeout = 3500
  }

  run(done) {
    var _this = this;
    this.userNames = this.allUserNames.slice(-3, -1);
    this.tags = this.allTags.slice(0, 5);
    var start = Date.now();
    async.each(this.userNames, (userName, done) => {
      var loader = new Loader(_this.config);
      async.series([
        (done) => loader.requestIndex(done),
        (done) => loader.requestLogin(userName, done),
        (done) => loader.requestMain(done),
        (done) => loader.requestUser(userName, done),
        (done) => loader.requestMain(done),
        (done) =>
          async.eachSeries(_this.tags, (tag, done) =>
            loader.requestTag(tag, done),
          done),
        (done) => loader.requestMain(done),
        (done) => loader.requestFollowers(userName, done),
        (done) =>
          async.eachSeries(loader.followers.slice(0,100), (followerName, done) => {
            loader.requestFollowers(followerName, done)
          }, done),
        (done) =>
          async.eachSeries(loader.followers.slice(0, 30), (followerName, done) => {
            loader.requestMention(followerName, done)
          }, done),
        (done) => loader.requestMain(done),
      ], done);
    }, done)
  }
}

module.exports = Stage2;
