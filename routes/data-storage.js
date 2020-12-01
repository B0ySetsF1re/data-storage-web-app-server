const express = require('express');
const router = express.Router();
const { mapping } = require('cassandra-driver');

// Models
const QueriesModel = require('../models/queriesModel');
const DBClientModel = require('../models/DBClientModel');
const DBMapperClientModel = require('../models/DBMapperClientModel');
const DBMapperOptionsModel = require('../models/DBMapperOptionsModel');

// Controllers (classes)
const UploadData = require('../controllers/uploadDataController');
const DownloadData = require('../controllers/downloadDataController');
const DataInfo = require('../controllers/dataInfoController');
const RenameData = require('../controllers/renameDataController');
const DeleteData = require('../controllers/deleteDataController');

// Connecting and configuring cassandra client and mappers
const queries = new QueriesModel(process.env.DB_KEYSPACE);
const client = new DBClientModel(process.env.HOST, process.env.DB_KEYSPACE, process.env.DB_DATACENTER);
const mapperClient = new DBMapperClientModel(process.env.HOST, process.env.DB_KEYSPACE, process.env.DB_DATACENTER).getMP();
const mappingOptions = new DBMapperOptionsModel();
const mapper = new mapping.Mapper(mapperClient, mappingOptions);
const fileMetaDataMapper = mapper.forModel('fileMetaData');
const fileDataMapper = mapper.forModel('fileData');

// Controllers (instantiated objects)
const uploadDataController = new UploadData(queries, client.getDB());
const downloadDataController = new DownloadData(queries, client.getDB());
const dataInfoController = new DataInfo(queries, client.getDB(), fileMetaDataMapper);
const renameDataController = new RenameData(queries, client.getDB());
const deleteDataController = new DeleteData(queries, client.getDB(), fileMetaDataMapper);

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

router.post('/delete-uploaded-file/:id', (req, res) => {
  deleteDataController.deleteFile(req, res);
});

router.post('/delete-all-uploaded-files', (req, res) => {
  deleteDataController.deleteAllFiles(req, res);
});

router.post('/delete-selected-uploaded-files', (req, res) => {
  deleteDataController.deleteSelectedFiles(req, res);
});

module.exports = router;
