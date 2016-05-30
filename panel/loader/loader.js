"use strict";
var request = require('request');
var model = require('models');
var Score = model.Score;

class Loader {
  constructor(config) {
    this.config = config;
    this.firstRequest = true;
  }

  updateScore(field, err, elapse) {
    var update = {$inc: {}};
    update.$inc[`${field}.elapse`] = elapse;
    update.$inc[`${field}.all`] = 1;
    update.$inc[`${field}.success`] = (err?0:1);
    update.$inc[`${field}.fail`] = (err?1:0);
    update.$inc[`all.elapse`] = elapse;
    update.$inc[`all.all`] = 1;
    update.$inc[`all.success`] = (err?0:1);
    update.$inc[`all.fail`] = (err?1:0);
    if ( this.firstRequest )  {
      update.$inc[`numLoaders`] = 1;
      this.firstRequest = false;
    }

    Score.update({
      stage: this.config.stage,
      name: this.config.name,
      startAt: this.config.startAt,
    }, update, { upsert: true }, function(){});
  }

  request(options, name, done) {
    options.jar = this.jar;
    options.timeout = this.config.timeout;
    var start = Date.now();
    var _this = this;
    request(
      options,
      function(err, response, body){
        var end = Date.now()
        if ( !err && [200, 302].indexOf(response.statusCode) < 0 ) {
          err = `${name} ${response.statusCode}`
        }
        _this.updateScore(name, err, (end - start));
        done(err, response, body);
      }
    );
  }

  requestIndex(done) {
    this.request ({
      method: 'GET',
      uri: `${this.config.baseUri}/`
    }, 'requestIndex', done);
  }

  requestTag(tag, done) {
    this.request({
      method: 'GET',
      uri: `${this.config.baseUri}/tags/${tag}`,
    }, 'requestTag', done);
  }

  requestMention(name, done) {
    this.request({
      method: 'GET',
      uri: `${this.config.baseUri}/users/${name}/mentions`,
    }, 'requestMention', done);
  }

  requestUser(name, done) {
    this.request({
      method: 'GET',
      uri: `${this.config.baseUri}/users/${name}`,
    }, 'requestUser', done);
  }

  requestLogin(name, done) {
    this.jar = request.jar();
    this.request({
      method: 'POST',
      uri: `${this.config.baseUri}/login`,
      jar: this.jar,
      form: {name}
    }, 'requestLogin', done);
  }

  requestMain(done) {
    this.request({
      method: 'GET',
      uri: `${this.config.baseUri}/main`,
    }, 'requestMain', done);
  }

  requestPost(body, done) {
    this.request({
      method: 'POST',
      uri: `${this.config.baseUri}/post`,
      jar: this.jar,
      form: {body}
    }, 'requestPost', done);
  }

  requestFollowers(userName, done) {
    var _this = this;
    this.request({
      method: 'GET',
      uri: `${this.config.baseUri}/api/followers/${userName}`,
    }, 'requestFollowers', (err, response, body) => {
      if ( err ) {
        return done(err);
      }
      _this.followers = JSON.parse(body);
      done(err)
    });
  }

  requestFollows(userName, done) {
    var _this = this;
    this.request({
      method: 'GET',
      uri: `${this.config.baseUri}/api/follows/${userName}`,
    }, 'requestFollows', (err, response, body) => {
      if ( err ) {
        return done(err);
      }
      _this.follows = JSON.parse(body);
      console.log(_this.follows)
      done(err)
    });
  }
}

module.exports = Loader;
