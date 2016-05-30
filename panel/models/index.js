'use strict';

var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.Types.ObjectId;

var models = {};
module.exports = models

var connection = mongoose.createConnection(
  "mongodb://localhost:27017/mongo_tuningason", {
    server: {
      auto_reconnect: true
    },
    db: {
      native_parser: true
    },
  });

var requestLog = {
  all: {type: Number, default: 0},
  success: {type: Number, default: 0},
  fail: {type: Number, default: 0},
  elapse: {type: Number, default: 0},
}
models.Score = connection.model(
  'scores',
  new mongoose.Schema({
    stage: {type: String, required: true},
    name: {type: String, required: true},
    startAt: { type: Date, required: true},
    requestIndex: requestLog,
    requestLogin: requestLog,
    requestMain: requestLog,
    requestUser: requestLog,
    requestTag: requestLog,
    requestMention: requestLog,
    requestPost: requestLog,
    requestFollowers: requestLog,
    requestFollows: requestLog,
    all: requestLog,
    result: {type: String},
    numLoaders: {type: Number},
    updatedAt: { type: Date }
  })
);

models.Challenger = connection.model(
  'challengers',
  new mongoose.Schema({
    stage: {type: String, required: true},
    name: {type: String, required: true},
    password: {type: String, required: true},
    addr: {type: String, required: true},
    status: {type: String},
    role: {type: String},
    updatedAt: { type: Date }
  })
);

models.ObjectId = mongoose.Types.ObjectId
