const getCurrTimeConsole = require('../lib/debuggingTools/getCurrentTime/console');

const asyncForEach = require('../lib/asyncForEach/index');

const { readFileSync, writeFile, createReadStream, CreateWriteStream } = require('fs');
const { resolve } = require('path');

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

const upsertFile = 'INSERT INTO files (object_id, chunk_id, name, size, upload_date, upload_time, data) VALUES (?, ?, ?, ?, ?, ?, ?)';

const uploadFile = (req, res) => {
  const uuid = cassandra.types.uuid();
  const date = cassandra.types.LocalDate.now();
  const time = cassandra.types.LocalTime.now();

  const content = readFileSync(resolve(__dirname + '../../files/' + 'small_file.jpeg'), 'base64');
  const objBuffer = new Buffer.from(content, 'base64');
  // const objBuffer = new Buffer.alloc(Buffer.byteLength(content, 'base64'), content, 'base64');

  const params = [uuid, 1, 'small_file.jpeg', Buffer.byteLength(content, 'base64'), date, time, objBuffer];

  client.execute(upsertFile, params, { prepare: true }, (err, result) => {
    if(!err) {
      console.log(getCurrTimeConsole() + 'File has been upploaded...');
      //res.json({ 'status': 'uploaded' });
      console.log({ 'status': 'uploaded' });
    } else {
      console.log(err)
      //res.json({ 'status': 'Error uploading file!' });
      console.log({ 'status': 'Error uploading file!' });
    }
  });
}

const uploadFileChunks = (req, res) => {
  const uuid = cassandra.types.uuid();
  const date = cassandra.types.LocalDate.now();

  const stream = createReadStream(resolve(__dirname + '../../files/' + 'big_file.jpg'), {
    'encoding': 'base64',
    'highWaterMark': 128 * 1024
  });

  let counter = 0;

  stream.on('data', (data) => {
    const objBuffer = new Buffer.from(data, 'base64');
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
