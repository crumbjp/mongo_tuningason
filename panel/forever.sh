#!/usr/bin/env bash
DIR=`dirname $0`
cd ${DIR}
DIR=`pwd`
export NODE_PATH=.
${DIR}/node_modules/forever/bin/forever stopall
${DIR}/node_modules/forever/bin/forever start -l ${DIR}/log/server.log --spinSleepTime 1000 -a ./bin/www
${DIR}/node_modules/forever/bin/forever start -l ${DIR}/log/loader.log --spinSleepTime 1000 -a ./bin/loader.js
