const getCurrTimeConsole = require('../lib/debuggingTools/getCurrentTime/console');
const DBClientModel = require('../models/DBClientModel');

class DataBaseClient {
  constructor(HOST, KEYSPACE, DATACENTER) {
    try {
      this._client = new DBClientModel(HOST, KEYSPACE, DATACENTER);
    } catch(err) {
      console.err(getCurrTimeConsole() + 'API: there was an error -', err);
    }
  }

  getDB() {
    return this._client;
  }
}

module.exports = DataBaseClient;
