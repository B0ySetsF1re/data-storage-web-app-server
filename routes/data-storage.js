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

router.post('/upload-file', dataStorageController.uploadFile);

module.exports = router;
