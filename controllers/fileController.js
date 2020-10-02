const getCurrTimeConsole = require('../lib/debuggingTools/getCurrentTime/console');

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
  const uuid = cassandra.types.uuid();
  const date = cassandra.types.LocalDate.now()

}

const uploadFileChunks = (req, res) => {
  const uuid = cassandra.types.uuid();
  const date = cassandra.types.LocalDate.now()

}

exports.uploadFile = uploadFile;
exports.uploadFileChunks = uploadFileChunks;
