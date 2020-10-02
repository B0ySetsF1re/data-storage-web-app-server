const getCurrentTime = require('../lib/debuggingTools/getCurrentTime/index');

const asyncForEach = require('../lib/asyncForEach/index');

const cassandra = require('cassandra-driver');

const client = new cassandra.Client({
  contactPoints: [process.env.HOST],
  keyspace: process.env.DB_KEYSPACE,
  localDataCenter: process.env.DB_DATACENTER
});

client.connect((err, result) => {
  if(err) {
    console.log(err);
  }
  console.log(getCurrentTime() + 'API: cassandra connected');
});

const uploadFile = (req, res) => {

}

const uploadFileChunks = (req, res) => {

}

exports.uploadFile = uploadFile;
exports.uploadFileChunks = uploadFileChunks;
