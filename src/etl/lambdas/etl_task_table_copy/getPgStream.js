/* eslint-disable no-console */
const { Client } = require('pg');
const copyTo = require('pg-copy-streams').to; // pipe from a table _TO_ stream
const copyFrom = require('pg-copy-streams').from; // pipe to a table _FROM_ stream

function getPgStream(location) {
  return new Promise((resolve, reject) => {
    try {
      const tablename = `"${location.schemaname}"."${location.tablename}"`;
      const tableheaders = location.tableheaders ? ', HEADER ' : '';
      const copySinceQuery = location.copy_since
        ? ` WHERE "${location.copy_since.column_to_filter}" >= NOW() - interval '${location.copy_since.num_weeks} WEEK' `
        : '';

      let orderby;
      if (location.sortdesc) {
        orderby = ` order by "${location.sortdesc}" desc `;
      } else if (location.sortasc) {
        orderby = ` order by "${location.sortasc}" asc `;
      } else {
        orderby = '';
      }
      const tempTablename = `"temp_${location.tablename}"`;
      const connInfo = location.conn_info;
      const client = new Client({
        host: connInfo.host,
        port: connInfo.port,
        user: connInfo.username,
        password: connInfo.password,
        database: connInfo.database,
        max: 10,
        idleTimeoutMillis: 10000,
      });
      let stream;

      const copyFromTemp = () => {
        const serialToAppend = location.append_serial
          ? `alter table ${tempTablename} add column ${location.append_serial} serial;`
          : '';
        let deleteOld;
        if (location.append === true) {
          deleteOld = '';
        } else if (location.copy_since) {
          deleteOld = `DELETE FROM ${tablename} ${copySinceQuery};`;
        } else {
          deleteOld = `TRUNCATE TABLE ${tablename};`;
        }

        const transString = `
          BEGIN TRANSACTION;
          ${serialToAppend}
          ${deleteOld}
          INSERT INTO ${tablename} SELECT * FROM ${tempTablename};
          COMMIT;
        `;
        client.query(transString, (err) => {
          client.end();
          if (err) reject(err);
          // console.log('pgto: '+res)
        });
      };

      client.connect()
        .then(() => {
          if (location.fromto === 'source_location') {
            if (location.fixedwidth_noquotes) {
              reject(new Error("Postgres 'fixedwidth_noquotes' not implemented"));
            }

            const queryString = `COPY (SELECT * FROM ${tablename} 
              ${copySinceQuery}
              ${orderby}) TO STDOUT WITH (FORMAT csv ${tableheaders})`;

            stream = client.query(copyTo(queryString));

            stream.on('error', (err) => { client.end(); reject(err); });
            stream.on('end', () => { client.end(); });
            console.log('Copy from Postgres: ', location.connection, tablename);
            resolve({ stream, promise: Promise.resolve() });
          } else if (location.fromto === 'target_location') {
            // create empty temp table
            const createtempString = `SELECT * INTO TEMP ${tempTablename} FROM ${tablename} WHERE 1=2;`;
            client.query(createtempString)
              .then(() => {
                if (location.append_serial) {
                  // The serial column appears in target but not source,
                  // so drop it first and read it after stream
                  const dropserialString = `alter table ${tempTablename} drop column ${location.append_serial};`;
                  client.query(dropserialString).catch((err) => { reject(err); });
                }

                const queryString = `COPY ${tempTablename} FROM STDIN WITH (FORMAT csv)`;
                stream = client.query(copyFrom(queryString));

                stream.on('error', (err) => { client.end(); reject(err); });
                stream.on('finish', copyFromTemp);

                console.log('Copy to Postgres: ', location.connection, tablename);
                resolve({ stream, promise: Promise.resolve() });
              });
          }
        })
        .catch((err) => { console.error('Connection error', err.stack); reject(err); });
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = getPgStream;

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
