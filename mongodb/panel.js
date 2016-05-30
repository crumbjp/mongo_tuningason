use mongo_tuningason;

db.scores.createIndex({name: 1, stage: 1, startAt: 1});
db.scores.createIndex({name: 1, result: 1, stage: 1, 'all.success': 1, 'all.elapse': 1});
