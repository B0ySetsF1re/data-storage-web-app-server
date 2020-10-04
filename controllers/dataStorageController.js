const getCurrTimeConsole = require('../lib/debuggingTools/getCurrentTime/console');

const asyncForEach = require('../lib/asyncForEach/index');

const { readFileSync, writeFile, createReadStream, CreateWriteStream } = require('fs');
const { resolve } = require('path');
const multiparty = require('multiparty');

const cassandra = require('cassandra-driver');

const client = new cassandra.Client({
  contactPoints: [process.env.HOST],
  //keyspace: process.env.DB_KEYSPACE,
  localDataCenter: process.env.DB_DATACENTER
});

const createKeySpace = 'CREATE KEYSPACE IF NOT EXISTS ' + process.env.DB_KEYSPACE +
      ' WITH replication = {\'class\': \'SimpleStrategy\', \'replication_factor\': 3}';

const createFilesMetaDataTable = 'CREATE TABLE IF NOT EXISTS ' + process.env.DB_KEYSPACE +
    '.files_metadata (object_id uuid, file_name text, disposition text, type text, size double, upload_date date, upload_time time, PRIMARY KEY(object_id, file_name))';

const crateFilesDataTable = 'CREATE TABLE IF NOT EXISTS ' + process.env.DB_KEYSPACE +
    '.files_data (object_id uuid, chunk_id int, data blob, PRIMARY KEY(object_id, chunk_id))';

const upsertFileMetaData = 'INSERT INTO ' + process.env.DB_KEYSPACE +
    '.files_metadata (object_id, file_name, disposition, type, size, upload_date, upload_time) VALUES (?, ?, ?, ?, ?, ?, ?)';

const upsertFileData = 'INSERT INTO ' + process.env.DB_KEYSPACE +
    '.files_data (object_id, chunk_id, data) VALUES (?, ?, ?)';

const selectFileChunks = 'SELECT object_id, chunk_id, data FROM ' + process.env.DB_KEYSPACE + '.files_data WHERE object_id = ?';

client.connect()
  .then(() => {
    return client.execute(createKeySpace);
  })
  .then(() => {
    console.log(getCurrTimeConsole() + 'API: keyspace initialization complete');
    return client.execute(createFilesMetaDataTable);
  })
  .then(() => {
    console.log(getCurrTimeConsole() + 'API: files metadata table initialization complete');
    return client.execute(crateFilesDataTable);
  })
  .then(() => {
    console.log(getCurrTimeConsole() + 'API: files data table initialization complete');
    console.log(getCurrTimeConsole() + 'API: cassandra connected');
  })
  .catch((err) => {
    console.error('There was an error', err);
    return client.shutdown().then(() => { throw err; });
  });

const getMultiPartFrmData = async (req, res) => {
  return new Promise((resolve, reject) => {
    let fileDataObj = {};
    let chunks = [];

    let form = new multiparty.Form();

    form.on('error', err => {
      reject(err);
    });

    form.on('part', part => {
      fileDataObj.disposition = part.headers["content-disposition"];
      fileDataObj.type = part.headers["content-type"];
      fileDataObj.fieldname = part.name;
      fileDataObj.filename = part.filename;
      fileDataObj.byteCount = part.byteCount;

      part.on('data', chunk => {
        chunks.push(chunk);
      });
    });

    form.on('close', () => {
      fileDataObj.buffer = Buffer.concat(chunks);

      resolve(fileDataObj);
    });

    form.parse(req);
  });
}

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
  // const objBuffer = new Buffer.from((await fillBuffer(req, res)).toString('base64'), 'base64');
  const fileDataObj = await getMultiPartFrmData(req, res);
  const bufferObj = fileDataObj.buffer; // this var might not needed
                                        // however it is needed if we would like to specify encoding
  const params = [uuid, 1, fileDataObj.filename, bufferObj.length, date, time, bufferObj];

  client.execute(upsertFile, params, { prepare: true }, (err, result) => {
    if(!err) {
      console.log(getCurrTimeConsole() + 'API: File has been upploaded... Chunk size is: ' + bufferObj.length);
      res.json({ 'status': 'File upload finished...' });
    } else {
      console.log(err)
      res.json({ 'status': 'Error uploading file!' });
    }
  });
}

const downloadFile = async (req, res) => {
  client.execute(selectFileFromTable, [req.params.id], (err, result) => {
    //res.write(result.rows[0].data, 'binary');
    //res.end(null, 'binary');
    res.send(result.rows[0].data);
  })
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
exports.downloadFile = downloadFile;
