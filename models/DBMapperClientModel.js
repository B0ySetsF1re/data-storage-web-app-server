const cassandra = require('cassandra-driver');
const Client = cassandra.Client;

const getCurrTimeConsole = require('../lib/debuggingTools/getCurrentTime/console');

module.exports = function DBMapperClientModel(HOST, KEYSPACE, DATACENTER) {
  if(!new.target) {
    return new DBMapperClientModel(HOST, KEYSPACE, DATACENTER);
  }

  this.mapperClient = new Client({
    contactPoints: [HOST],
    keyspace: KEYSPACE,
    localDataCenter: DATACENTER
  });

  this.mapperClient.connect()
    .then(() => {
      return this.mapperClient.connect();
    })
    .then(() => {
      console.log(getCurrTimeConsole() + 'API: cassandra mapper client connected');
    })
    .catch((err) => {
      console.error(getCurrTimeConsole() + 'API: there was an error -', err);
      return this.client.shutdown().then(() => { throw err; });
    });

  return this.mapperClient;
}
