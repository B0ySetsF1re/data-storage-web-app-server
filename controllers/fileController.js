const getCurrTimeConsole = require('../lib/debuggingTools/getCurrentTime/console');
const getCurrDateOrigin = require('../lib/debuggingTools/getCurrentDate/original');

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
  console.log(getCurrTimeConsole() + 'API: cassandra connected');
});

const uploadFile = (req, res) => {

}

const uploadFileChunks = (req, res) => {

}

exports.uploadFile = uploadFile;
exports.uploadFileChunks = uploadFileChunks;
