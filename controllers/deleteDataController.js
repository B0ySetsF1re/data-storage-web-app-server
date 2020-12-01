const getCurrTimeConsole = require('../lib/debuggingTools/getCurrentTime/console');
const asyncForEach = require('../lib/asyncForEach/index');

const contentDisposition = require('content-disposition');
const niceBytes = require('nice-bytes');

const QueriesModel = require('../models/queriesModel');

class DeleteData {
  constructor(client, mapper) {
    this.client = client;
    this.mapper = mapper;
    this.queries = new QueriesModel(process.env.DB_KEYSPACE);
  }

    async deleteFile(req, res) {
      let deletedFileInfo = await this.mapper.find({ object_id: req.params.id })
        .catch(err => {
          console.error(getCurrTimeConsole() + 'API: there was an error -', err);
          res.status(400).json({ 'Error': err.message });

          return;
        });
      deletedFileInfo = deletedFileInfo.toArray()[0];

      await this.client.execute(this.queries.deleteFileMetaDataContent, [req.params.id])
        .then(() => {
          return this.client.execute(this.queries.deleteFileDataContent, [req.params.id]);
        })
        .then(() => {
          console.log(getCurrTimeConsole() + 'API: file "' + deletedFileInfo.file_name + '" has been deleted successfully...');
          res.status(200).json({ 'Success': 'File \"' + deletedFileInfo.file_name + '\" has been deleted...'});
        })
        .catch(err => {
          console.error(getCurrTimeConsole() + 'API: there was an error -', err);
          res.status(400).json({ 'Error': err.message });
        });
    }

    async deleteAllFiles(req, res) {
      await this.client.execute(this.queries.deleteAllFilesMetaDataContent)
        .then(() => {
          return this.client.execute(this.queries.deleteAllFilesDataContent);
        })
        .then(() => {
          console.log(getCurrTimeConsole() + 'API: all the files have been deleted successfully...');
          res.status(200).json({ 'Success': 'All the files have been deleted successfully...'});
        })
        .catch(err => {
          console.error(getCurrTimeConsole() + 'API: there was an error -', err);
          res.status(400).json({ 'Error': err.message });
        })
    }

    async deleteSelectedFiles(req, res) {
      try {
        if(!req.body.ids) {
          throw new Error('IDs are not defined!');
        } else if(req.body.ids.length == 0) {
          throw new Error('No files were selected!');
        }

        await asyncForEach(req.body.ids, async (id) => {
          await this.client.execute(this.queries.deleteFileMetaDataContent, [id])
            .then(async () => {
              return await this.client.execute(this.queries.deleteFileDataContent, [id]);
            })
            .catch(err => {
              console.error(getCurrTimeConsole() + 'API: there was an error -', err);
              res.status(400).json({ 'Error': err.message });
            });
        });

        console.log(getCurrTimeConsole() + 'API: all the selected files have been deleted successfully...');
        res.status(200).json({ 'Success': 'All the selected files have been deleted successfully...'});

      } catch(err) {
        console.error(getCurrTimeConsole() + 'API: there was an error -', err);
        res.status(400).json({ 'Error': err.message });
      }
  }
}

module.exports = DeleteData;
