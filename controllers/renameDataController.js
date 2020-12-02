const getCurrTimeConsole = require('../lib/debuggingTools/getCurrentTime/console');

const contentDisposition = require('content-disposition');
const niceBytes = require('nice-bytes');

const QueriesModel = require('../models/queriesModel');

class RenameData {
  constructor(queries, client) {
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
