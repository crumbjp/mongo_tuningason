'use strict';
var async = require('async');
var loader = require('loader');

async.forever(
  (done) => {
    loader.start((err) => {
      setTimeout(()=>{
        done(err);
      }, 1000)
    })
  },
  (err) => {
    if ( err ) {
      console.error(err)
    }
    process.exit(1)
  }
);
