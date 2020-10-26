const cassandra = require('cassandra-driver');
const Client = cassandra.Client;

const getCurrTimeConsole = require('../lib/debuggingTools/getCurrentTime/console');
const QueriesModel = require('./queriesModel');
const queries = new QueriesModel(process.env.DB_KEYSPACE);

module.exports = function DBClientModel(HOST, KEYSPACE, DATACENTER) {
  if(!new.target) {
    return new DBClientModel(HOST, KEYSPACE, DATACENTER);
  }

  const client = new Client({
    contactPoints: [HOST],
    //keyspace: process.env.DB_KEYSPACE,
    localDataCenter: DATACENTER
  });

  client.connect()
    .then(() => {
      return client.execute(queries.createKeySpace);
    })
    .then(() => {
      console.log(getCurrTimeConsole() + 'API: keyspace initialization complete');
      return client.execute(queries.createFilesMetaDataTable);
    })
    .then(() => {
      console.log(getCurrTimeConsole() + 'API: files metadata table initialization complete');
      return client.execute(queries.crateFilesDataTable);
    })
    .then(() => {
      console.log(getCurrTimeConsole() + 'API: files data table initialization complete');
      console.log(getCurrTimeConsole() + 'API: cassandra main client connected');
    })
    .catch((err) => {
      console.error(getCurrTimeConsole() + 'API: there was an error -', err);
      return client.shutdown().then(() => { throw err; });
    });

  return client;
}
