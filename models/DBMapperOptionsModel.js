const cassandra = require('cassandra-driver');
const DefaultTableMappings = cassandra.mapping.DefaultTableMappings;

module.exports = function DBMapperOptionsModel() {
  if(!new.target) {
    return new DBMapperOptionsModel();
  }

  return {
    models: {
      'fileMetaData': {
        tables: ['files_metadata'],
        mappings: new DefaultTableMappings()
      },
      'fileData': {
        tables: ['files_data'],
        mappings: new DefaultTableMappings()
      }
    }
  }
}
