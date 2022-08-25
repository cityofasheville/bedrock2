const sql = require('mssql')
const csv = require('csv')
const stream = require('stream')
const { getPool } = require('./ssPools')

function createSsWritable(location) {
  const Ssstream = new stream.Transform();
  ///////////
  const tablename = `[${location.schemaname}].[${location.tablename}]`
  const connInfo = location.conn_info
  const poolName = location.connection;

  const config = {
    server: connInfo.host,
    port: connInfo.port,
    user: connInfo.username,
    password: connInfo.password,
    database: connInfo.database,
    connectionTimeout: 30000,
    requestTimeout: 680000,
    options: {
      enableArithAbort: true
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    },
    trustServerCertificate: true,  // Accela has self-signed certs?
  }
  if (connInfo.domain) config.domain = connInfo.domain
  if (connInfo.parameters) {
    if (connInfo.parameters.encrypt === false) config.options.encrypt = false // for <= SQL 2008
  }
  getPool(poolName, config)
    .then(pool => {



      


      return Ssstream;
    })
}

module.exports = createSsWritable

/* parameter data structure
location = {
    schemaname,
    tablename,
    connection,
    conn_info: {
        host,
        post,
        ...
    }
}
*/
