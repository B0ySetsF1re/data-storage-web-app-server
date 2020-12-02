const cassandra = require('cassandra-driver');
const Client = cassandra.Client;

const getCurrTimeConsole = require('../lib/debuggingTools/getCurrentTime/console');
const QueriesModel = require('./queriesModel');

module.exports = function DBClientModel(HOST, KEYSPACE, DATACENTER) {
  if(!new.target) {
    return new DBClientModel(HOST, KEYSPACE, DATACENTER);
  }

  this._queries = new QueriesModel(KEYSPACE);

  this._client = new Client({
    contactPoints: [HOST],
    //keyspace: process.env.DB_KEYSPACE,
    localDataCenter: DATACENTER
  });

  this._client.connect()
    .then(() => {
      return this._client.execute(this._queries.createKeySpace);
    })
    .then(() => {
      console.log(getCurrTimeConsole() + 'API: keyspace initialization complete');
      return this._client.execute(this._queries.createFilesMetaDataTable);
    })
    .then(() => {
      console.log(getCurrTimeConsole() + 'API: files metadata table initialization complete');
      return this._client.execute(this._queries.crateFilesDataTable);
    })
    .then(() => {
      console.log(getCurrTimeConsole() + 'API: files data table initialization complete');
      console.log(getCurrTimeConsole() + 'API: cassandra main client connected');
    })
    .catch((err) => {
      console.error(getCurrTimeConsole() + 'API: there was an error -', err);
      return this._client.shutdown().then(() => { throw err; });
    });

    this.getClient = () => {
      return this._client;
    }

  return this;
}
