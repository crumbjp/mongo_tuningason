'use strict';
var async = require('async');
var Loader = require('./loader');
var StageBase = require('./stage_base');

class Stage4 extends StageBase {
  constructor(config) {
    super(config)
    this.runTimeout = 60000
  }

  run(done) {
    var _this = this
    this.userNames = this.allUserNames.slice(1, 3);
    this.userNames = this.userNames.concat(this.allUserNames.slice( 601,  603));
    this.userNames = this.userNames.concat(this.allUserNames.slice(1201, 1203));
    this.userNames = this.userNames.concat(this.allUserNames.slice(1801, 1803));
    this.userNames = this.userNames.concat(this.allUserNames.slice(2401, 2403));
    this.userNames = this.userNames.concat(this.allUserNames.slice(3001, 3003));
    this.userNames = this.userNames.concat(this.allUserNames.slice(3601, 3603));
    this.userNames = this.userNames.concat(this.allUserNames.slice(4201, 4203));
    this.userNames = this.userNames.concat(this.allUserNames.slice(4801, 4803));
    this.userNames = this.userNames.concat(this.allUserNames.slice(5401, 5403));
    this.userNames = this.userNames.concat(this.allUserNames.slice(6001, 6003));
    this.userNames = this.userNames.concat(this.allUserNames.slice(6601, 6603));
    this.userNames = this.userNames.concat(this.allUserNames.slice(7201, 7203));
    this.userNames = this.userNames.concat(this.allUserNames.slice(7801, 7803));
    this.userNames = this.userNames.concat(this.allUserNames.slice(8401, 8403));
    this.userNames = this.userNames.concat(this.allUserNames.slice(9001, 9003));
    this.userNames = this.userNames.concat(this.allUserNames.slice(9601, 9603));
    this.tags = this.allTags;
    var start = Date.now();
    async.each(this.userNames, (userName, done) => {
      var loader = new Loader(_this.config);
      async.series([
        (done) => loader.requestIndex(done),
        (done) => loader.requestLogin(userName, done),
        (done) => loader.requestMain(done),
        (done) => loader.requestUser(userName, done),
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
        (done) =>
          async.eachSeries(_this.tags, (tag, done) =>
            loader.requestTag(tag, done),
          done),
        (done) => loader.requestMain(done),
      ], done);
    }, done)
  }
}

module.exports = Stage4;
