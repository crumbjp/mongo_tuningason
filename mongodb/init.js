var conf = {
  _id: 'mongo_tuningason',
  members: [
    {_id: 0, host: 'localhost:27017'},
  ]
}
rs.initiate(conf);
