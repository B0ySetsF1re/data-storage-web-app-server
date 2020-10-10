module.exports = {
  createKeySpace: 'CREATE KEYSPACE IF NOT EXISTS ' + process.env.DB_KEYSPACE +
        ' WITH replication = {\'class\': \'SimpleStrategy\', \'replication_factor\': 3}',

  createFilesMetaDataTable: 'CREATE TABLE IF NOT EXISTS ' + process.env.DB_KEYSPACE +
      '.files_metadata (object_id uuid, file_name text, disposition text, type text, extension text, length double, upload_date date, upload_time time, PRIMARY KEY(object_id))',

  crateFilesDataTable: 'CREATE TABLE IF NOT EXISTS ' + process.env.DB_KEYSPACE +
      '.files_data (object_id uuid, chunk_id int, data blob, PRIMARY KEY(object_id, chunk_id))',

  upsertFileMetaData: 'INSERT INTO ' + process.env.DB_KEYSPACE +
      '.files_metadata (object_id, file_name, disposition, type, extension, length, upload_date, upload_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',

  upsertFileData: 'INSERT INTO ' + process.env.DB_KEYSPACE +
      '.files_data (object_id, chunk_id, data) VALUES (?, ?, ?)',

  selectFileMetaData: 'SELECT * FROM ' + process.env.DB_KEYSPACE + '.files_metadata WHERE object_id = ?',

  selectFileChunks: 'SELECT * FROM ' + process.env.DB_KEYSPACE + '.files_data WHERE object_id = ?',

  selectAllMetaDataContent: 'SELECT * FROM ' + process.env.DB_KEYSPACE + '.files_metadata',

  selectAllFileExtensionsAndLength: 'SELECT extension, length FROM ' + process.env.DB_KEYSPACE +  '.files_metadata',

  selectFileMetaDataNameAndDisposition: 'SELECT file_name, disposition, extension FROM ' + process.env.DB_KEYSPACE + '.files_metadata WHERE object_id = ?',

  updateFileMetaDataNameAndDisposition: 'UPDATE ' + process.env.DB_KEYSPACE + '.files_metadata SET file_name = ?, disposition = ? WHERE object_id = ?',

  deleteFileMetaDataContent: 'DELETE FROM ' + process.env.DB_KEYSPACE + '.files_metadata WHERE object_id = ?',

  deleteFileDataContent: 'DELETE FROM ' + process.env.DB_KEYSPACE + '.files_data WHERE object_id = ?'
}
