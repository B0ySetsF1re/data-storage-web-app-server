module.exports = {
  createKeySpace: 'CREATE KEYSPACE IF NOT EXISTS ' + process.env.DB_KEYSPACE +
        ' WITH replication = {\'class\': \'SimpleStrategy\', \'replication_factor\': 3}',

  createFilesMetaDataTable: 'CREATE TABLE IF NOT EXISTS ' + process.env.DB_KEYSPACE +
      '.files_metadata (object_id uuid, file_name text, disposition text, type text, length double, upload_date date, upload_time time, PRIMARY KEY(object_id, file_name))',

  crateFilesDataTable: 'CREATE TABLE IF NOT EXISTS ' + process.env.DB_KEYSPACE +
      '.files_data (object_id uuid, chunk_id int, data blob, PRIMARY KEY(object_id, chunk_id))',

  upsertFileMetaData: 'INSERT INTO ' + process.env.DB_KEYSPACE +
      '.files_metadata (object_id, file_name, disposition, type, length, upload_date, upload_time) VALUES (?, ?, ?, ?, ?, ?, ?)',

  upsertFileData: 'INSERT INTO ' + process.env.DB_KEYSPACE +
      '.files_data (object_id, chunk_id, data) VALUES (?, ?, ?)',

  selectFileChunks: 'SELECT object_id, chunk_id, data FROM ' + process.env.DB_KEYSPACE + '.files_data WHERE object_id = ?'
}
