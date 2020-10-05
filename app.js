require('dotenv').config();

const getCurrTimeConsole = require('./lib/debuggingTools/getCurrentTime/console');

const express = require('express');

const bodyParser = require('body-parser');
const path = require('path');

const app = express();

const routes = require('./routes/index');
const files = require('./routes/data-storage');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/', routes);
app.use('/api/data-storage', files);

app.listen(process.env.PORT, process.env.HOST);
console.log(getCurrTimeConsole() + 'App: server started on port ' + process.env.PORT);

module.exports = app;
