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
    '.files_metadata (object_id uuid, file_name text, disposition text, type text, length double, upload_date date, upload_time time, PRIMARY KEY(object_id, file_name))';

const crateFilesDataTable = 'CREATE TABLE IF NOT EXISTS ' + process.env.DB_KEYSPACE +
    '.files_data (object_id uuid, chunk_id int, data blob, PRIMARY KEY(object_id, chunk_id))';

const upsertFileMetaData = 'INSERT INTO ' + process.env.DB_KEYSPACE +
    '.files_metadata (object_id, file_name, disposition, type, length, upload_date, upload_time) VALUES (?, ?, ?, ?, ?, ?, ?)';

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
      if(fileDataObj.byteCount > 1048576) {
        fileDataObj.chunks = chunks;
        resolve(fileDataObj);
      } else {
        fileDataObj.buffer = Buffer.concat(chunks);
        resolve(fileDataObj);
      }
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
                                        // however it is needed if we would like to specify encoding
  const fileMetaDataQueryParams = [uuid, fileDataObj.filename, fileDataObj.disposition, fileDataObj.type, fileDataObj.byteCount, date, time];

  await client.execute(upsertFileMetaData, fileMetaDataQueryParams, { prepare: true })
    .then(() => {
      console.log(getCurrTimeConsole() + 'API: File meta data has been uploaded...');
    })
    .catch(err => {
      console.log(err);
    });

  if(fileDataObj.buffer != undefined) {
    const bufferObj = fileDataObj.buffer; // this var might not needed
                                          // however it is needed if we would like to specify encoding (same for chunks in else statement below)
    client.execute(upsertFileData, [uuid, 0, bufferObj], { prepare: true })
      .then(() => {
        console.log(getCurrTimeConsole() + 'API: File has been uploaded... File size is: ' + fileDataObj.byteCount);
        res.json({ 'status': 'File upload finished...' });
      })
      .catch(err => {
        console.log(err);
        res.json({ 'status': 'Error uploading file!' });
      });

  } else {
    await asyncForEach(fileDataObj.chunks, async (chunk, chunk_id) => {

      await client.execute(upsertFileData, [uuid, chunk_id, chunk], { prepare: true })
        .then(() => {
          console.log(getCurrTimeConsole() + 'API: Chunk has been uploaded... Chunk size is: ' + chunk.length);
        })
        .catch(err => {
          console.log(err);
          res.json({ 'status': 'Error uploading file!' });
        });
    });
    res.json({ 'status': 'File upload finished...' });
  }
}

const downloadFile = async (req, res) => {
  client.execute('SELECT * FROM ' + process.env.DB_KEYSPACE + '.files_metadata WHERE object_id = ' + req.params.id)
    .then(fileMetaData => {
      return fileMetaData.first();
    })
    .then(fileMetaData => {
      return client.execute(selectFileChunks, [req.params.id])
        .then(async chunks => {
          if(chunks.rowLength > 1) {
            let extractedChunks = [];
            await asyncForEach(chunks.rows, async (row) => {
              extractedChunks.push(row.data);
            });

            res.status(200);

            res.set({
              'Cache-Control': 'no-cache',
              'Content-Type': fileMetaData.type,
              'Content-Length': fileMetaData.length,
              'Content-Disposition': fileMetaData.disposition
            });

            res.send(Buffer.concat(extractedChunks));
          } else {
            res.status(200);

            res.set({
              'Cache-Control': 'no-cache',
              'Content-Type': fileMetaData.type,
              'Content-Length': fileMetaData.length,
              'Content-Disposition': fileMetaData.disposition
            });

            res.send(chunks.first().data);
          }
        });
    })
    .catch(err => {
      console.error('There was an error', err);
    });
}

exports.uploadFile = uploadFile;
exports.downloadFile = downloadFile;
