const getCurrTimeConsole = require('../lib/debuggingTools/getCurrentTime/console');
const asyncForEach = require('../lib/asyncForEach/index');

const multiparty = require('multiparty');
const contentDisposition = require('content-disposition');
const niceBytes = require('nice-bytes');

const cassandra = require('cassandra-driver');
const Client = cassandra.Client;
const Mapper = cassandra.mapping.Mapper;
const DefaultTableMappings = cassandra.mapping.DefaultTableMappings;
const queries = require('../models/dataStorageQueriesModel');

const client = new Client({
  contactPoints: [process.env.HOST],
  //keyspace: process.env.DB_KEYSPACE,
  localDataCenter: process.env.DB_DATACENTER
});

const mapperClient = new Client({
  contactPoints: [process.env.HOST],
  keyspace: process.env.DB_KEYSPACE,
  localDataCenter: process.env.DB_DATACENTER
});

client.connect()
  .then(() => {
    return client.execute(queries.createKeySpace);
  })
  .then(() => {
    console.log(getCurrTimeConsole() + 'API: keyspace initialization complete');
    return client.execute(queries.createFilesMetaDataTable);
  })
  .then(() => {
    console.log(getCurrTimeConsole() + 'API: files metadata table initialization complete');
    return client.execute(queries.crateFilesDataTable);
  })
  .then(() => {
    console.log(getCurrTimeConsole() + 'API: files data table initialization complete');
    console.log(getCurrTimeConsole() + 'API: cassandra main client connected');
    return mapperClient.connect();
  })
  .then(() => {
    console.log(getCurrTimeConsole() + 'API: cassandra mapper client connected');
  })
  .catch((err) => {
    console.error(getCurrTimeConsole() + 'API: there was an error -', err);
    return client.shutdown().then(() => { throw err; });
  });

const mappingOptions = {
  models: {
    'fileMetaData': {
      tables: ['files_metadata'],
      mappings: new DefaultTableMappings()
    },
    'fileData': {
      tables: ['files_data'],
      mappings: new DefaultTableMappings()
    }
  }
}

const mapper = new Mapper(mapperClient, mappingOptions);
const fileMetaDataMapper = mapper.forModel('fileMetaData');
const fileDataMapper = mapper.forModel('fileData');


const getMultiPartFrmData = async (req, res) => {
  return new Promise((resolve, reject) => {
    let fileDataObj = {};
    let chunks = [];

    let form = new multiparty.Form();

    form.on('error', err => {
      reject(err);
    });

    form.on('part', async part => {

      part.on('error', err => {
        reject(err);
      });

      if(part.byteCount <= 0) {
        //throw new Error('asdasd');
        reject(new Error('Empty data received!'));
      }

      fileDataObj.disposition = part.headers["content-disposition"];
      fileDataObj.type = part.headers["content-type"];
      fileDataObj.fieldname = part.name;
      fileDataObj.filename = part.filename;
      fileDataObj.extension = part.filename.split('.').pop();
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

const setFileHeaderBeforeSend = async (fileMetaData) => {
  return {
    'Cache-Control': 'no-cache',
    'Content-Type': fileMetaData.type,
    'Content-Length': fileMetaData.length,
    'Content-Disposition': !/^[ -~\t\n\r]+$/.test(fileMetaData.disposition)
                          ? contentDisposition(fileMetaData.file_name) : fileMetaData.disposition
  }
}

const uploadFile = async (req, res) => {
  const uuid = cassandra.types.uuid();
  const date = cassandra.types.LocalDate.now();
  const time = cassandra.types.LocalTime.now();

  await getMultiPartFrmData(req, res)
    .then(async (fileDataObj) => {
      const fileMetaDataQueryParams = [uuid, fileDataObj.filename, fileDataObj.disposition, fileDataObj.type, fileDataObj.extension, fileDataObj.byteCount, date, time];

      await client.execute(queries.upsertFileMetaData, fileMetaDataQueryParams, { prepare: true })
        .then(() => {
          console.log(getCurrTimeConsole() + 'API: File meta data has been uploaded...');
        })
        .catch(err => {
          console.log(err);
        });

      if(fileDataObj.buffer != undefined) {
        const bufferObj = fileDataObj.buffer; // this var might not needed
                                              // however it is needed if we would like to specify encoding (same for chunks in else statement below)
                                              // if the encoding will be applied, we need to specify it again while obtainig bufer from database on file download
        client.execute(queries.upsertFileData, [uuid, 0, bufferObj], { prepare: true })
          .then(() => {
            console.log(getCurrTimeConsole() + 'API: File data has been uploaded... File size is: ' + niceBytes(fileDataObj.byteCount).text);
            res.json({ 'Success': 'File upload finished...' });
          })
          .catch(err => {
            console.error(getCurrTimeConsole() + 'API: there was an error -', err);
            res.status(404).json({ 'Error': err.message });
          });

      } else {
        await asyncForEach(fileDataObj.chunks, async (chunk, chunk_id) => {

          await client.execute(queries.upsertFileData, [uuid, chunk_id, chunk], { prepare: true })
            .then(() => {
              console.log(getCurrTimeConsole() + 'API: Chunk has been uploaded... Chunk size is: ' + niceBytes(chunk.length).text);
            })
            .catch(err => {
              console.log(err);
              res.status(404).json({ 'Error': err.message });
            });
        });
        console.log(getCurrTimeConsole() + 'API: File data has been uploaded... File size is: ' + niceBytes(fileDataObj.byteCount).text);
        res.json({ 'Success': 'File upload finished...' });
      }
    })
    .catch(err => {
      console.error(getCurrTimeConsole() + 'API: there was an error -', err);
      res.status(404).json({ 'Error': err.message })
    });
}

const downloadFile = async (req, res) => {
  client.execute(queries.selectFileMetaData, [req.params.id])
    .then(fileMetaData => {
      return fileMetaData.first();
    })
    .then(fileMetaData => {
      return client.execute(queries.selectFileChunks, [req.params.id])
        .then(async chunks => {
          if(chunks.rowLength > 1) {
            let extractedChunks = [];

            await asyncForEach(chunks.rows, async (row) => {
              extractedChunks.push(row.data);
            });

            res.status(200);
            res.set(await setFileHeaderBeforeSend(fileMetaData));

            console.log(getCurrTimeConsole() + 'API: File "' + fileMetaData.file_name + '" has been downloaded successfully...');
            res.send(Buffer.concat(extractedChunks));
          } else {
            res.status(200);
            res.set(await setFileHeaderBeforeSend(fileMetaData));

            console.log(getCurrTimeConsole() + 'API: File "' + fileMetaData.file_name + '" has been downloaded successfully...');
            res.send(chunks.first().data);
          }
        });
    })
    .catch(err => {
      console.error(getCurrTimeConsole() + 'API: there was an error -', err);
      res.status(404).json({ 'Error': err.message });
    });
}

const getFilesMetaDataContent = async (req, res) => {
  let content = await fileMetaDataMapper.findAll()
  .catch(err => {
    console.error(getCurrTimeConsole() + 'API: there was an error -', err);
    res.status(404).json({ 'Error': err.message });
  });

  let formattedContent = [];

  await asyncForEach(content.toArray(), async (row) => {
    formattedContent.push({
          object_id: row.object_id.toString(),
          file_name: row.file_name,
          disposition: row.disposition,
          length: niceBytes(row.length).text,
          type: row.type,
          extension: row.extension,
          upload_date: row.upload_date,
          upload_time: row.upload_time.toString().split('.')[0]
        });
  });
  res.status(200).send(JSON.stringify(formattedContent));
}

const getAllUniqueFileExtensions = async () => {
  let extensionsCollected = [];

  await client.execute(queries.selectAllFileExtensionsAndLength)
    .then(async types => {
      await asyncForEach(types.rows, async (type) => {
        extensionsCollected.push(type.extension);
      })
    })
    .catch(err => {
      return err;
    });

  return Array.from(new Set(extensionsCollected));
}

const initFileStatsContentObj = async () => {
  const extensions = await getAllUniqueFileExtensions();
  let fileContentObj = {};

  await asyncForEach(extensions, async (extension) => {
    fileContentObj[extension] = 0;
  });

  fileContentObj.total_content_size = 0;

  return fileContentObj;
}

const initFileStatsContentArray = async () => {    // Optional function, if you would like to initiate body content
                                              // as an array and then loop through asyncForEach with await and then parse it to the object
  const extensions = await getAllUniqueFileExtensions();
  let fileContentArr = [];

  await asyncForEach(extensions, async (extension) => {
    fileContentArr[extension] = 0;
  });

  fileContentArr['total_content_size'] = 0;

  return fileContentObj;
}

const getFilesDataStats = async (req, res) => {
  const uniqueExtensions = await getAllUniqueFileExtensions();
  let contentObj = await initFileStatsContentObj();

  await client.execute(queries.selectAllFileExtensionsAndLength)
    .then(async (files) => {

      await asyncForEach(uniqueExtensions, async (extension) => {
        await asyncForEach(files.rows, async (file) => {
          if(extension == file.extension) {
            contentObj[extension] += file.length;
            contentObj.total_content_size += file.length;
          }
        });
      });

      for(const property in contentObj) {
        contentObj[property] = niceBytes(contentObj[property]).text;
      }
    })
    .catch(err => {
      console.error(getCurrTimeConsole() + 'API: there was an error -', err);
      res.status(404).json({ 'Error': err.message })
    });

    res.status(200).json(contentObj);
}

const renameFile = async(req, res) => {
  await client.execute(queries.selectFileMetaDataNameAndDisposition, [req.params.id])
    .then(async (fileNameData) => {
      if(!req.body.new_name) {
        throw new Error('new_name body request was not defined!');
      }

      const regex = /filename=".*"/;
      const newFileName = req.body.new_name + '.' + fileNameData.first().extension;
      const newFileDisposition = fileNameData.first().disposition.replace(regex, 'filename="' + newFileName + '"');
      const params = [newFileName, newFileDisposition, req.params.id];

      return await client.execute(queries.updateFileMetaDataNameAndDisposition, params)
    })
    .then(() => {
      res.status(200).json({ 'Success': 'File name has been changed...'});
    })
    .catch(err => {
      console.error(getCurrTimeConsole() + 'API: there was an error -', err);
      res.status(404).json({ 'Error': err.message });
    });
}

const deleteFile = async(req, res) => {
  let deletedFileInfo = await fileMetaDataMapper.find({ object_id: req.params.id })
    .catch(err => {
      console.error(getCurrTimeConsole() + 'API: there was an error -', err);
      res.status(404).json({ 'Error': err.message });

      return;
    });
  deletedFileInfo = deletedFileInfo.toArray()[0];

  await client.execute(queries.deleteAllFilesMetaDataContent, [req.params.id])
    .then(() => {
      return client.execute(queries.deleteAllFilesDataContent, [req.params.id]);
    })
    .then(() => {
      console.log(getCurrTimeConsole() + 'API: File "' + deletedFileInfo.file_name + '" has been deleted successfully...');
      res.status(200).json({ 'Success': 'File \"' + deletedFileInfo.file_name + '\" has been deleted...'});
    })
    .catch(err => {
      console.error(getCurrTimeConsole() + 'API: there was an error -', err);
      res.status(404).json({ 'Error': err.message });
    });
}

exports.uploadFile = uploadFile;
exports.downloadFile = downloadFile;
exports.getFilesMetaDataContent = getFilesMetaDataContent;
exports.getFilesDataStats = getFilesDataStats;
exports.renameFile = renameFile;
exports.deleteFile = deleteFile;
