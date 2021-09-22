const sql = require('mssql')
const csv = require('csv')
const { closeAllPools, getPool } = require('./ssPools')

async function getSsStream (location) {
  return new Promise(async function (resolve, reject) {
    sql.on('error', err => {
      reject(err)
    })
    try {
      if (location.fromto === 'source_location') {
        const tablename = `${location.schemaname}.${location.tablename}`
        const connInfo = location.conn_info
        const poolName = location.connection

        const sqlString = `SELECT * FROM ${tablename}`
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
          trustServerCertificate: true,  // Acella has self-signed certs?
        }
        if (connInfo.domain) config.domain = connInfo.domain
        if (connInfo.parameters) {
          if (connInfo.parameters.encrypt === false) config.options.encrypt = false // for <= SQL 2008
        }
        const pool = await getPool(poolName, config)
        const request = await pool.request()
        request.stream = true

        request.query(sqlString)
        request.on('error', err => {
          reject(err)
        })
        request.on('finish', () => { // done?
          closeAllPools()
        })
        console.log('Copy from SQL Server: ', location.connection, tablename)
        const stream = request
          .pipe(csv.stringify({
            cast: {
              date: (date) => {
                return date.toISOString()
              },
              boolean: (value) => {
                return value ? '1' : '0'
              }
            },
            quoted_match: /\r/ // csv.stringify already checks for \n and \r\n. Our data has \r too. ¯\_(ツ)_/¯
          }))
        resolve(stream)
      } else if (location.fromto === 'target_location') {
        reject(new Error("SQL Server 'To' not implemented"))
      }
    } catch (err) {
      reject(new Error('SQL Server stream error ' + err))
    }
  })
}

module.exports = getSsStream
