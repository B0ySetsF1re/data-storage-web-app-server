const express = require('express');
const router = express.Router();
const dataStorageController = require('../controllers/dataStorageController');
const { Readable } = require('stream');

router.post('/upload-file', dataStorageController.uploadFile);

module.exports = router;
