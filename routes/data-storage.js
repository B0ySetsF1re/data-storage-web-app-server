const express = require('express');
const router = express.Router();
const dataStorageController = require('../controllers/dataStorageController');

router.get('/', (req, res) => {
  res.status(200).json({
    "APIs": {
      "GET": {
        "APIs-list" : "/api/data-storage",
        "content": "/api-data-storage/content",
        "space-info": "/api-data-storage/space-info",
        "download-file": "/api-data-storage/download-file/:file-id",
      },
      "POST": {
        "upload-file": "/api/data-storage/upload-file",
        "upload-large-file": "/api-data-storage/upload-large-file/:file-id",
        "rename-uploaded-file": "/api-data-storage/rename-uploaded-file/:file-id",
        "delete-uploaded-file": "/api-data-storage/delete-uploaded-file/:file-id"
      }
    }
  });
});

router.get('/content', (req, res) => {
  res.json({ "status": "OK" });
});

router.get('/space-info', (req, res) => {
  res.json({ "status": "OK" });
});

router.get('/download-file/:file-id', (req, res) => {
  res.send('Download file request...');
});

router.post('/upload-file', dataStorageController.uploadFile);    // Less than 1MB

router.post('/upload-large-file', (req, res) => {                 // More than 1MB
  res.json({ "status": "OK" });
});

router.post('/rename-uploaded-file/:file-id', (req, res) => {
  res.json({ "status": "OK" });
});

router.post('/delete-uploaded-file/:file-id', (req, res) => {
  res.json({ "status": "OK" });
});

module.exports = router;
