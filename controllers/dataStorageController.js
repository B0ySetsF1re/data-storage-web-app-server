const getCurrTimeConsole = require('../lib/debuggingTools/getCurrentTime/console');

const asyncForEach = require('../lib/asyncForEach/index');

const { readFileSync, writeFile, createReadStream, CreateWriteStream } = require('fs');
const { resolve } = require('path');

const cassandra = require('cassandra-driver');

const client = new cassandra.Client({
  contactPoints: [process.env.HOST],
  //keyspace: process.env.DB_KEYSPACE,
  localDataCenter: process.env.DB_DATACENTER
});

const createKeySpaceIfNotExists = 'CREATE KEYSPACE IF NOT EXISTS ' + process.env.DB_KEYSPACE +
      ' WITH replication = {\'class\': \'SimpleStrategy\', \'replication_factor\': 3}';
const createTableIfNotExists = 'CREATE TABLE IF NOT EXISTS ' + process.env.DB_KEYSPACE +
    '.files (object_id uuid, chunk_id int, name text, size float, upload_date date, upload_time time, data blob, PRIMARY KEY(object_id, name, chunk_id))';
const upsertFile = 'INSERT INTO ' + process.env.DB_KEYSPACE +
    '.files (object_id, chunk_id, name, size, upload_date, upload_time, data) VALUES (?, ?, ?, ?, ?, ?, ?)';

client.connect()
  .then(() => {
    return client.execute(createKeySpaceIfNotExists);
  })
  .then(() => {
    console.log(getCurrTimeConsole() + 'API: keyspace initiation performed');
    return client.execute(createTableIfNotExists);
  })
  .then(() => {
    console.log(getCurrTimeConsole() + 'API: table initiation performed');
    console.log(getCurrTimeConsole() + 'API: cassandra connected');
  })
  .catch((err) => {
    console.error('There was an error', err);
    return client.shutdown().then(() => { throw err; });
  });

const fillBuffer = async (req, res) => {
  return new Promise((resolve) => {
    let chunks = [];

    req.on('data', chunk => {
      chunks.push(chunk);
    });

    req.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });
}

const uploadFile = async (req, res) => {
  const uuid = cassandra.types.uuid();
  const date = cassandra.types.LocalDate.now();
  const time = cassandra.types.LocalTime.now();

  // const objBuffer = new Buffer.from(await fillBuffer(req, res));
  const objBuffer = new Buffer.from(await fillBuffer(req, res), 'base64');

  const params = [uuid, 1, 'small_file.jpeg', objBuffer.length, date, time, objBuffer];

  client.execute(upsertFile, params, { prepare: true }, (err, result) => {
    if(!err) {
      console.log(getCurrTimeConsole() + 'API: File has been upploaded... Chunk size is: ' + objBuffer.length);
      res.json({ 'status': 'File upload finished...' });
    } else {
      console.log(err)
      res.json({ 'status': 'Error uploading file!' });
    }
  });
}

const uploadFileChunks = async (req, res) => {
  const uuid = cassandra.types.uuid();
  const date = cassandra.types.LocalDate.now();

  const stream = createReadStream(resolve(__dirname + '../../files/' + 'big_file.jpg'), {
    'encoding': 'base64',
    'highWaterMark': 128 * 1024
  });

  let counter = 0;

  stream.on('data', (data) => {
    const objBuffer = new Buffer.from(data, 'base64');
    // const objBuffer = new Buffer.alloc(Buffer.byteLength(content, 'base64'), content, 'base64');
    const params = [uuid, counter++, 'big_file.jpg', Buffer.byteLength(content, 'base64'), date, time, objBuffer];

    client.execute(upsertFile, params, { prepare: true }, (err, result) => {
      if(!err) {
        console.log(getCurrTimeConsole() + 'Chunk has been upploaded...');
        //res.json({ 'status': 'uploaded' });
        console.log({ 'status': 'uploaded' });
      } else {
        console.log(err)
        //res.json({ 'status': 'Error uploading file!' });
        console.log({ 'status': 'Error uploading file!' });
      }
    });
  });

  stream.on('end', () => {
    console.log(getCurrTimeConsole() + 'Stream ended...');
    //res.json({ 'status': 'uploaded' });
    console.log({ 'status': 'chunk uploaded' });
  });
}

exports.uploadFile = uploadFile;
exports.uploadFileChunks = uploadFileChunks;
