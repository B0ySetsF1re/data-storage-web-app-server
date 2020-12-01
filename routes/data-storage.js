const express = require('express');
const router = express.Router();
const cassandra = require('cassandra-driver');
const dataStorageController = require('../controllers/dataStorageController');

const Mapper = cassandra.mapping.Mapper;
const DBClientModel = require('../models/DBClientModel');
const DBMapperClientModel = require('../models/DBMapperClientModel');
const DBMapperOptionsModel = require('../models/DBMapperOptionsModel');
const UploadData = require('../controllers/uploadDataController');
const DownloadData = require('../controllers/downloadDataController');
const DataInfo = require('../controllers/dataInfoController');
const RenameData = require('../controllers/renameDataController');

const client = new DBClientModel(process.env.HOST, process.env.DB_KEYSPACE, process.env.DB_DATACENTER);
const mapperClient = new DBMapperClientModel(process.env.HOST, process.env.DB_KEYSPACE, process.env.DB_DATACENTER).getMP();
const mappingOptions = new DBMapperOptionsModel();
const mapper = new Mapper(mapperClient, mappingOptions);
const fileMetaDataMapper = mapper.forModel('fileMetaData');
const fileDataMapper = mapper.forModel('fileData');

const uploadDataController = new UploadData(client.getDB());
const downloadDataController = new DownloadData(client.getDB());
const dataInfoController = new DataInfo(client.getDB(), fileMetaDataMapper);
const renameDataController = new RenameData(client.getDB());

router.get('/', (req, res) => {
  // res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    "APIs": {
      "GET": {
        "APIs-list" : "/api/data-storage",
        "meta-data-content": "/api/data-storage/meta-data-content",
        "files-stats": "/api/data-storage/files-stats",
        "download-file": "/api/data-storage/download-file/:id",
      },
      "POST": {
        "upload-file": "/api/data-storage/upload-file",
        "rename-uploaded-file": "/api/data-storage/rename-uploaded-file/:id",
        "delete-uploaded-file": "/api/data-storage/delete-uploaded-file/:id",
        "delete-all-uploaded-files": "/api/data-storage/delete-all-uploaded-files",
        "delete-selected-uploaded-files": "/api/data-storage/delete-selected-uploaded-files"
      }
    }
  });
});

router.get('/meta-data-content', (req, res) => {
  dataInfoController.getFilesMetaDataContent(req, res);
});

router.get('/files-stats', (req, res) => {
  dataInfoController.getFilesDataStats(req, res);
});

router.get('/download-file/:id', (req, res) => {
  downloadDataController.downloadFile(req, res);
});

router.post('/upload-file', (req, res) => {
  uploadDataController.uploadFile(req, res);
});

router.post('/rename-uploaded-file/:id', (req, res) => {
  renameDataController.renameFile(req, res);
});

router.post('/delete-uploaded-file/:id', dataStorageController.deleteFile);

router.post('/delete-all-uploaded-files', dataStorageController.deleteAllFiles);

router.post('/delete-selected-uploaded-files', dataStorageController.deleteSelectedFiles);

module.exports = router;
