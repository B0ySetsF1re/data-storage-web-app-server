const express = require('express');

const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const port = 3000;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.send('Home page...');
});

app.listen(port);
console.log('Server started on port ' + port);

module.exports = app;
