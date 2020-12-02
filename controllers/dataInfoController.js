const getCurrTimeConsole = require('../lib/debuggingTools/getCurrentTime/console');
const asyncForEach = require('../lib/asyncForEach/index');

const niceBytes = require('nice-bytes');

const QueriesModel = require('../models/queriesModel');

class DataInfo {
  constructor(queries, client, mapper) {
    this._queries = queries;
    this._client = client;
    this._mapper = mapper;
  }

  async getFilesMetaDataContent(req, res) {
    let content = await this._mapper.findAll()
    .catch(err => {
      console.error(getCurrTimeConsole() + 'API: there was an error -', err);
      res.status(400).json({ 'Error': err.message });
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

  async _getAllUniqueFileExtensions() {
    let extensionsCollected = [];

    await this._client.execute(this._queries.selectAllFileExtensionsAndLength)
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

  async _initFileStatsContentObj() {
    const extensions = await this._getAllUniqueFileExtensions();
    let fileContentObj = {};

    await asyncForEach(extensions, async (extension) => {
      fileContentObj[extension] = 0;
    });

    fileContentObj.total_content_size = 0;

    return fileContentObj;
  }

  async _initFileStatsContentArray() {    // Optional function, if you would like to initiate body content
                                                // as an array and then loop through asyncForEach with await and then parse it to the object
    const extensions = await this._getAllUniqueFileExtensions();
    let fileContentArr = [];

    await asyncForEach(extensions, async (extension) => {
      fileContentArr[extension] = 0;
    });

    fileContentArr['total_content_size'] = 0;

    return fileContentObj;
  }

  async getFilesDataStats(req, res) {
    const uniqueExtensions = await this._getAllUniqueFileExtensions();
    let contentObj = await this._initFileStatsContentObj();

    await this._client.execute(this._queries.selectAllFileExtensionsAndLength)
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
        res.status(400).json({ 'Error': err.message })
      });

      res.status(200).json(contentObj);
  }
}

module.exports = DataInfo;
