/* eslint-disable no-console */
const sql = require('mssql');
const csv = require('csv');
const MultiStream = require('multistream');
const { getPool } = require('./ssPools');
const createSsWritable = require('./createSsWritable');

async function getSsStream(location) {
  if (location.fromto === 'source_location') {
    return new Promise((resolve, reject) => {
      sql.on('error', (err) => {
        reject(err);
      });
      try {
        const arrayOfSQL = [];
        let nonObjStream;
        const tablename = `[${location.schemaname}].[${location.tablename}]`;
        const connInfo = location.conn_info;
        const poolName = location.connection;
        const copySinceQuery = location.copy_since
          ? ` WHERE [${location.copy_since.column_to_filter}] >= DATEADD(WW,${location.copy_since.num_weeks * -1}, GETDATE() ) `
          : '';

        let orderby;
        if (location.sortdesc) {
          orderby = ` order by [${location.sortdesc}] desc `;
        } else if (location.sortasc) {
          orderby = ` order by [${location.sortasc}] asc `;
        } else {
          orderby = '';
        }

        if (location.tableheaders) {
          arrayOfSQL.push(`
          with data as (
            select top 100 percent COLUMN_NAME, TABLE_NAME from INFORMATION_SCHEMA.COLUMNS
            where TABLE_NAME = '${location.tablename}' and TABLE_SCHEMA = '${location.schemaname}'
            order by ORDINAL_POSITION)
          SELECT headerrow = STUFF((SELECT ',' + COLUMN_NAME FROM data FOR XML PATH ('')), 1, 1, '') 
          FROM data GROUP BY TABLE_NAME
          `); // Accela DB is too old for STRING_AGG so back to 'stuff for xml path' :(
          // https://stackoverflow.com/questions/31211506/how-stuff-and-for-xml-path-work-in-sql-server/31212160#31212160
        } else {
          arrayOfSQL.push('');
        }

        const mainSqlString = `SELECT * FROM ${tablename} ${copySinceQuery} ${orderby}`;
        arrayOfSQL.push(mainSqlString);

        const config = {
          server: connInfo.host,
          port: connInfo.port,
          user: connInfo.username,
          password: connInfo.password,
          database: connInfo.database,
          connectionTimeout: 30000,
          requestTimeout: 680000,
          options: {
            enableArithAbort: true,
          },
          pool: {
            max: 10,
            min: 0,
            idleTimeoutMillis: 30000,
          },
          trustServerCertificate: true, // Accela has self-signed certs?
        };
        if (connInfo.domain) config.domain = connInfo.domain;
        if (connInfo.parameters) {
          // for <= SQL 2008
          if (connInfo.parameters.encrypt === false) config.options.encrypt = false;
        }
        getPool(poolName, config)
          .then((pool) => {
            const arrayOfStreams = arrayOfSQL.map((sqlString, index) => {
              const request = pool.request();

              request.stream = true;

              request.query(sqlString);

              request.on('error', (err) => {
                reject(err);
              });
              if (index === 0) {
                nonObjStream = request
                  .pipe(csv.stringify({
                    quote: '',
                  }));
              } else {
                const stringifyOptions = {
                  cast: {
                    date: (date) => date.toISOString(),
                    boolean: (value) => (value ? '1' : '0'),
                  },
                  quoted_match: /\r/, // csv.stringify already checks for \n and \r\n. Our data has \r too. ¯\_(ツ)_/¯
                };
                if (location.fixedwidth_noquotes) {
                  stringifyOptions.quote = '';
                  stringifyOptions.escape = '';
                }
                if (location.crlf) {
                  stringifyOptions.record_delimiter = 'windows'
                }
                nonObjStream = request
                  .pipe(csv.stringify(stringifyOptions));
              }
              return nonObjStream;
            });

            console.log('Copy from SQL Server: ', location.connection, tablename);
            const retStream = new MultiStream(arrayOfStreams);

            retStream.on('done', (result) => {
              console.log(`SQL Server rows affected: ${result.rowsAffected}`);
            });

            resolve({ stream: retStream, promise: Promise.resolve() });
          });
      } catch (err) {
        reject(new Error(`SQL Server stream error ${err}`));
      }
    });
  }
  if (location.fromto === 'target_location') {
    return createSsWritable(location);
  }
  return (0);
}

module.exports = getSsStream;
