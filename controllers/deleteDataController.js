const getCurrTimeConsole = require('../lib/debuggingTools/getCurrentTime/console');

const contentDisposition = require('content-disposition');
const { Client, mapping } = require('cassandra-driver');

const QueriesModel = require('../models/queriesModel');

class DeleteData {
  constructor(queries, client, mapper) {
    if(!(queries instanceof QueriesModel)) {
      throw new Error('Queries must be instantiated by the "QueriesModel" class!');
    } else if(!(client instanceof Client)) {
      throw new Error('Client must be instantiated by the cassandra-driver "Client" class!')
    } else if (!(mapper instanceof mapping.ModelMapper)) {
      throw new Error('Mapper must be instantiated by the cassandra-driver "mapping.ModelMapper" class!')
    }

    this._queries = queries;
    this._client = client;
    this._mapper = mapper;
  }

    async deleteFile(req, res) {
      let deletedFileInfo = await this._mapper.find({ object_id: req.params.id })
        .catch(err => {
          console.error(getCurrTimeConsole() + 'API: there was an error -', err);
          res.status(400).json({ 'Error': err.message });

          return;
        });
      deletedFileInfo = deletedFileInfo.toArray()[0];

      await this._client.execute(this._queries.deleteFileMetaDataContent, [req.params.id])
        .then(() => {
          return this._client.execute(this._queries.deleteFileDataContent, [req.params.id]);
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
      await this._client.execute(this._queries.deleteAllFilesMetaDataContent)
        .then(() => {
          return this._client.execute(this._queries.deleteAllFilesDataContent);
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

        for await (const id of req.body.ids) {
          await this._client.execute(this._queries.deleteFileMetaDataContent, [id])
            .then(async () => {
              return await this._client.execute(this._queries.deleteFileDataContent, [id]);
            })
            .catch(err => {
              console.error(getCurrTimeConsole() + 'API: there was an error -', err);
              res.status(400).json({ 'Error': err.message });
            });
        };

        console.log(getCurrTimeConsole() + 'API: all the selected files have been deleted successfully...');
        res.status(200).json({ 'Success': 'All the selected files have been deleted successfully...'});

      } catch(err) {
        console.error(getCurrTimeConsole() + 'API: there was an error -', err);
        res.status(400).json({ 'Error': err.message });
      }
  }
}

module.exports = DeleteData;
