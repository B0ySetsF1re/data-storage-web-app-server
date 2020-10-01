require('dotenv').config();

const express = require('express');

const bodyParser = require('body-parser');
const path = require('path');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.send('Home page...');
});

app.listen(process.env.PORT, process.env.HOST);
console.log('Server started on port ' + process.env.PORT);

module.exports = app;
