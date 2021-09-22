const { Client } = require('pg')
const copyTo = require('pg-copy-streams').to // pipe from a table _TO_ stream
const copyFrom = require('pg-copy-streams').from // pipe to a table _FROM_ stream

function getPgStream (location) {
  return new Promise(async function (resolve, reject) {
    // console.log(location)
    try {
      const tablename = `${location.schemaname}.${location.tablename}`
      const tempTablename = `temp_${location.tablename}`
      const connInfo = location.conn_info
      const client = new Client({
        host: connInfo.host,
        port: connInfo.port,
        user: connInfo.username,
        password: connInfo.password,
        database: connInfo.database,
        max: 10,
        idleTimeoutMillis: 10000
      })
      let stream

      const copyFromTemp = () => {
        let serialToAppend = ''
        if (location.append_serial) {
          serialToAppend = `alter table ${tempTablename} add column ${location.append_serial} serial;`
        }
        const transString = `
        BEGIN TRANSACTION;
        ${serialToAppend}
        TRUNCATE TABLE ${tablename};
        INSERT INTO ${tablename} SELECT * FROM ${tempTablename};
        COMMIT;
        `
        client.query(transString, (err, res) => {
          console.log(res)
          client.end()
          if (err) reject(err)
        })
      }

      await client.connect()
        .catch(err => { console.error('Connection error', err.stack); reject(err) })

      if (location.fromto === 'source_location') {
        const queryString = `COPY (SELECT * FROM ${tablename}) TO STDOUT WITH (FORMAT csv)`
        stream = client.query(copyTo(queryString))

        stream.on('error', err => { client.end(); reject(err) })
        stream.on('end', () => { client.end() })
        console.log('Copy from Postgres: ', location.connection, tablename)
      } else if (location.fromto === 'target_location') {
        // create empty temp table
        const createtempString = `SELECT * INTO TEMP ${tempTablename} FROM ${tablename} WHERE 1=2;`
        await client.query(createtempString).catch((err) => { reject(err) })
        if (location.append_serial) { // The serial column appears in target but not source, so drop it first and readd it after stream
          const dropserialString = `alter table ${tempTablename} drop column ${location.append_serial};`
          await client.query(dropserialString).catch((err) => { reject(err) })
        }

        const queryString = `COPY ${tempTablename} FROM STDIN WITH (FORMAT csv)`
        stream = client.query(copyFrom(queryString))

        stream.on('error', err => { client.end(); reject(err) })
        stream.on('finish', copyFromTemp)

        console.log('Copy to Postgres: ', location.connection, tablename)
      }

      resolve(stream)
    } catch (err) {
      reject(err)
    }
  })
}

module.exports = getPgStream

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
