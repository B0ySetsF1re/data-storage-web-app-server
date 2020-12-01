const getCurrTimeConsole = require('../lib/debuggingTools/getCurrentTime/console');
const asyncForEach = require('../lib/asyncForEach/index');

const contentDisposition = require('content-disposition');
const niceBytes = require('nice-bytes');

const QueriesModel = require('../models/queriesModel');

class DownloadData {
  constructor(client) {
    this.client = client;
    this.queries = this.queries = new QueriesModel(process.env.DB_KEYSPACE);
  }

  async _setFileHeaderBeforeSend(fileMetaData) {
    return {
      'Cache-Control': 'no-cache',
      'Content-Type': fileMetaData.type,
      'Content-Length': fileMetaData.length,
      'Content-Disposition': !/^[ -~\t\n\r]+$/.test(fileMetaData.disposition)
                            ? contentDisposition(fileMetaData.file_name) : fileMetaData.disposition
    }
  }

  async downloadFile(req, res) {
    this.client.execute(this.queries.selectFileMetaData, [req.params.id])
      .then(fileMetaData => {
        return fileMetaData.first();
      })
      .then(fileMetaData => {
        return this.client.execute(this.queries.selectFileChunks, [req.params.id])
          .then(async chunks => {
            if(chunks.rowLength > 1) {
              let extractedChunks = [];

              if(chunks.isPaged()) {
                for await(const row of chunks) {
                  extractedChunks.push(row.data);
                }
              } else {
                await asyncForEach(chunks.rows, async (row) => {
                  extractedChunks.push(row.data);
                });
              }

              res.status(200);
              res.set(await this._setFileHeaderBeforeSend(fileMetaData));

              console.log(getCurrTimeConsole() + 'API: file "' + fileMetaData.file_name + '" has been downloaded successfully...');
              res.send(Buffer.concat(extractedChunks));
            } else {
              res.status(200);
              res.set(await this._setFileHeaderBeforeSend(fileMetaData));

              console.log(getCurrTimeConsole() + 'API: file "' + fileMetaData.file_name + '" has been downloaded successfully...');
              res.send(chunks.first().data);
            }
          });
      })
      .catch(err => {
        console.error(getCurrTimeConsole() + 'API: there was an error -', err);
        res.status(400).json({ 'Error': err.message });
      });
  }
}

module.exports = DownloadData;
