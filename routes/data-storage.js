const express = require('express');
const router = express.Router();
const multiparty = require('multiparty');
const dataStorageController = require('../controllers/dataStorageController');

router.get('/', (req, res) => {
  // res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    "APIs": {
      "GET": {
        "APIs-list" : "/api/data-storage",
        "content-meta-data": "/api/data-storage/content-meta-data",
        "space-info": "/api/data-storage/space-info",
        "download-file": "/api/data-storage/download-file/:id",
      },
      "POST": {
        "upload-file": "/api/data-storage/upload-file",
        "rename-uploaded-file": "/api/data-storage/rename-uploaded-file/:id",
        "delete-uploaded-file": "/api/data-storage/delete-uploaded-file/:id"
      }
    }
  });
});

router.get('/content-meta-data', (req, res) => {
  res.json({ "status": "OK" });
});

router.get('/space-info', (req, res) => {
  res.json({ "status": "OK" });
});

router.get('/download-file/:id', dataStorageController.downloadFile);

router.post('/upload-file', dataStorageController.uploadFile);

router.post('/rename-uploaded-file/:id', (req, res) => {
  res.json({ "status": "OK" });
});

router.post('/delete-uploaded-file/:id', (req, res) => {
  res.json({ "status": "OK" });
});

module.exports = router;
