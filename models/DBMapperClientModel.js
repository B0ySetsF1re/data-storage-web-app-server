const cassandra = require('cassandra-driver');
const Client = cassandra.Client;

const getCurrTimeConsole = require('../lib/debuggingTools/getCurrentTime/console');

module.exports = function DBMapperClientModel(HOST, KEYSPACE, DATACENTER) {
  if(!new.target) {
    return new DBMapperClientModel(HOST, KEYSPACE, DATACENTER);
  }

  this._mapperClient = new Client({
    contactPoints: [HOST],
    keyspace: KEYSPACE,
    localDataCenter: DATACENTER
  });

  this._mapperClient.connect()
    .then(() => {
      return this._mapperClient.connect();
    })
    .then(() => {
      console.log(getCurrTimeConsole() + 'API: cassandra mapper client connected');
    })
    .catch((err) => {
      console.error(getCurrTimeConsole() + 'API: there was an error -', err);
      return this._client.shutdown().then(() => { throw err; });
    });

    this.getMP = () => {
      return this._mapperClient;
    }

  return this;
}
