const getCurrTimeConsole = require('../lib/debuggingTools/getCurrentTime/console');

const { Client } = require('cassandra-driver');

const QueriesModel = require('../models/queriesModel');

class RenameData {
  constructor(queries, client) {
    if(!queries instanceof QueriesModel) {
      throw new Error('Queries must be instantiated by the "QueriesModel" class!');
    } else if(!client instanceof Client) {
      throw new Error('Client must be instantiated by the cassandra-driver "Client" class!')
    }

    this._queries = queries;
    this._client = client;
  }

  async renameFile(req, res) {
    await this._client.execute(this._queries.selectFileMetaDataNameAndDisposition, [req.params.id])
      .then(async (fileNameData) => {
        if(!req.body.new_name) {
          throw new Error('File name was not defined!');
          return;
        }

        const regex = /filename=".*"/;
        const newFileName = req.body.new_name + '.' + fileNameData.first().extension;
        const newFileDisposition = fileNameData.first().disposition.replace(regex, 'filename="' + newFileName + '"');
        const params = [newFileName, newFileDisposition, req.params.id];

        return await this._client.execute(this._queries.updateFileMetaDataNameAndDisposition, params)
      })
      .then(() => {
        res.status(200).json({ 'Success': 'File name has been changed...'});
      })
      .catch(err => {
        console.error(getCurrTimeConsole() + 'API: there was an error -', err);
        res.status(400).json({ 'Error': err.message });
      });
  }
}

module.exports = RenameData;
