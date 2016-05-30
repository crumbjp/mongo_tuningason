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
      native_parser: true,
    },
  });

models.User = connection.model(
  'users',
  new mongoose.Schema({
    name : { type: String, required: true },
    hash : { type: String, required: true },
    followIds: [ ObjectId ],
    lastLogin: { type: Date },
    numLogin: { type: Number, required: true },
    status : { type: String },
  })
);

models.Tweet = connection.model(
  'tweets',
  new mongoose.Schema({
    userId : { type: ObjectId, required: true },
    body: {type: String, required: true},
    tags: [String],
    mentions: [String],
    createdAt: { type: Date, required: true },
    deletedAt: { type: Date }
  })
);
