const cassandra = require('cassandra-driver');
const Client = cassandra.Client;

const getCurrTimeConsole = require('../lib/debuggingTools/getCurrentTime/console');

module.exports = function DBMapperClientModel(HOST, KEYSPACE, DATACENTER) {
  if(!new.target) {
    return new DBMapperClientModel(HOST, KEYSPACE, DATACENTER);
  }

  const mapperClient = new Client({
    contactPoints: [HOST],
    keyspace: KEYSPACE,
    localDataCenter: DATACENTER
  });

  mapperClient.connect()
    .then(() => {
      return mapperClient.connect();
    })
    .then(() => {
      console.log(getCurrTimeConsole() + 'API: cassandra mapper client connected');
    })
    .catch((err) => {
      console.error(getCurrTimeConsole() + 'API: there was an error -', err);
      return client.shutdown().then(() => { throw err; });
    });

  return mapperClient;
}
