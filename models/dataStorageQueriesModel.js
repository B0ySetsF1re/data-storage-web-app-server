module.exports = function QueriesModel(KEYSPACE) {
  if(!new.target) {
    return new QueriesModel(KEYSPACE);
  }

  this.createKeySpace = 'CREATE KEYSPACE IF NOT EXISTS ' + KEYSPACE + ' WITH replication = {\'class\': \'SimpleStrategy\', \'replication_factor\': 3}';

  this.createFilesMetaDataTable = 'CREATE TABLE IF NOT EXISTS ' + KEYSPACE +
      `.files_metadata (object_id uuid, file_name text, disposition text, type text,
        extension text, length double, upload_date date, upload_time time, PRIMARY KEY(object_id))`;

  this.crateFilesDataTable = 'CREATE TABLE IF NOT EXISTS ' + KEYSPACE + '.files_data (object_id uuid, chunk_id int, data blob, PRIMARY KEY(object_id, chunk_id))';

  this.upsertFileMetaData = 'INSERT INTO ' + KEYSPACE + '.files_metadata (object_id, file_name, disposition, type, extension, length, upload_date, upload_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

  this.upsertFileData = 'INSERT INTO ' + KEYSPACE + '.files_data (object_id, chunk_id, data) VALUES (?, ?, ?)';

  this.selectFileMetaData = 'SELECT * FROM ' + KEYSPACE + '.files_metadata WHERE object_id = ?';

  this.selectFileChunks = 'SELECT * FROM ' + KEYSPACE + '.files_data WHERE object_id = ?';

  this.selectAllMetaDataContent = 'SELECT * FROM ' + KEYSPACE + '.files_metadata';

  this.selectAllFileExtensionsAndLength = 'SELECT extension, length FROM ' + KEYSPACE +  '.files_metadata';

  this.selectFileMetaDataNameAndDisposition = 'SELECT file_name, disposition, extension FROM ' + KEYSPACE + '.files_metadata WHERE object_id = ?';

  this.updateFileMetaDataNameAndDisposition = 'UPDATE ' + KEYSPACE + '.files_metadata SET file_name = ?, disposition = ? WHERE object_id = ?';

  this.deleteFileMetaDataContent = 'DELETE FROM ' + KEYSPACE + '.files_metadata WHERE object_id = ?';

  this.deleteFileDataContent = 'DELETE FROM ' + KEYSPACE + '.files_data WHERE object_id = ?';

  this.deleteAllFilesMetaDataContent = 'TRUNCATE ' + KEYSPACE + '.files_metadata';

  this.deleteAllFilesDataContent = 'TRUNCATE ' + KEYSPACE + '.files_data';
}
