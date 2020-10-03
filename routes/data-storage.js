const express = require('express');
const router = express.Router();
const dataStorageController = require('../controllers/dataStorageController');

router.get('/', (req, res) => {
  res.status(200).json({
    "APIs": {
      "POST": {
        "upload-file": "/api/data-storage/upload-file"
      },
      "GET": {
        "APIs main page" : "/api/data-storage"
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
