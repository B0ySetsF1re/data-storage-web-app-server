const getCurrTimeConsole = require('../lib/debuggingTools/getCurrentTime/console');

const multiparty = require('multiparty');
const niceBytes = require('nice-bytes');
const cliProgress = require('cli-progress');
const { Client, types } = require('cassandra-driver');

const QueriesModel = require('../models/queriesModel');

class UploadData {
  constructor(queries, client) {
    if(!(queries instanceof QueriesModel)) {
      throw new Error('Queries must be instantiated by the "QueriesModel" class!');
    } else if(!(client instanceof Client)) {
      throw new Error('Client must be instantiated by the cassandra-driver "Client" class!')
    }

    this._queries = queries;
    this._client = client;

    this._parseFileBar = new cliProgress.SingleBar({
      format: getCurrTimeConsole() +
      'API: parse file progress | {bar} | {percentage}% || {value}/{total} Bytes',
    }, cliProgress.Presets.shades_classic);

    this._uploadFileBar = new cliProgress.SingleBar({
      format: getCurrTimeConsole() +
      'API: upload file progress | {bar} | {percentage}% || {value}/{total} Chunks',
    }, cliProgress.Presets.shades_classic);
  }


  async _getMultiPartFrmData(req, res) {
    return new Promise((resolve, reject) => {
      let fileDataObj = {};
      let chunks = [];

      let form = new multiparty.Form();

      form.on('error', err => {
        reject(err);
      });

      form.on('progress', (bytesReceived, bytesExpected) => {
          this._parseFileBar.update(bytesReceived);
      });

      form.on('part', async part => {

        part.on('error', err => {
          reject(err);
        });

        if(part.byteCount <= 0) {
          //throw new Error('Empty data received!');
          reject(new Error('Empty data received!'));
          return;
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
          this._parseFileBar.stop();

          resolve(fileDataObj);
        } else {
          fileDataObj.buffer = Buffer.concat(chunks);
          this._parseFileBar.stop();

          resolve(fileDataObj);
        }
      });

      form.parse(req);
      this._parseFileBar.start(form.bytesExpected, 0);
    });
  }

  async _fillBuffer(req, res) {
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

  async uploadFile(req, res) {
    const uuid = types.uuid();
    const date = types.LocalDate.now();
    const time = types.LocalTime.now();

    await this._getMultiPartFrmData(req, res)
      .then(async (fileDataObj) => {
        const fileMetaDataQueryParams = [uuid, fileDataObj.filename, fileDataObj.disposition, fileDataObj.type, fileDataObj.extension, fileDataObj.byteCount, date, time];

        await this._client.execute(this._queries.upsertFileMetaData, fileMetaDataQueryParams, { prepare: true })
          .then(() => {
            console.log(getCurrTimeConsole() + 'API: file meta data has been uploaded...');
          })
          .catch(err => {
            console.log(err);
          });

        if(fileDataObj.buffer != undefined) {
          const bufferObj = fileDataObj.buffer; // this var might not needed
                                                // however it is needed if we would like to specify encoding (same for chunks in else statement below)
                                                // if the encoding will be applied, we need to specify it again while obtainig bufer from database on file download
          this._client.execute(this._queries.upsertFileData, [uuid, 0, bufferObj], { prepare: true })
            .then(() => {
              console.log(getCurrTimeConsole() + 'API: file data has been uploaded... File size is: ' + niceBytes(fileDataObj.byteCount).text);
              res.json({ 'Success': 'File upload finished...' });
            })
            .catch(err => {
              console.error(getCurrTimeConsole() + 'API: there was an error -', err);
              res.status(400).json({ 'Error': err.message });
            });

        } else {
          this._uploadFileBar.start(fileDataObj.chunks.length, 0);

          for await (const [chunk_id, chunk] of fileDataObj.chunks.entries()) {

            await this._client.execute(this._queries.upsertFileData, [uuid, chunk_id, chunk], { prepare: true })
              .then(async () => {
                this._uploadFileBar.update(chunk_id);
              })
              .catch(err => {
                console.log(err);
                res.status(400).json({ 'Error': err.message });
              });
          };

          this._uploadFileBar.increment();
          this._uploadFileBar.stop();
          console.log(getCurrTimeConsole() + 'API: file data has been uploaded... File size is: ' + niceBytes(fileDataObj.byteCount).text);
          res.json({ 'Success': 'File upload finished...' });
        }
      })
      .catch(err => {
        console.error(getCurrTimeConsole() + 'API: there was an error -', err);
        res.status(400).json({ 'Error': err.message })
      });
  }
}

module.exports = UploadData;
