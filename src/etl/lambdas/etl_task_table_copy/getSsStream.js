/* eslint-disable no-console */
import mssqlpkg from 'mssql';
const { on } = mssqlpkg;
import { PassThrough } from 'stream';
import { stringify } from 'csv-stringify';
import { getPool } from './ssPools.js';
import createSsWritable from './createSsWritable.js';
import { ssTableHeaders } from './ssTableHeaders.js';
import { createPromise } from './promiseWithResolvers.js';

async function getSsStream(location) {
  const { promise, resolve, reject } = createPromise();
  if (location.fromto === 'target_location') {
    return createSsWritable(location);
  }
  try {
    // let bodyStream;
    let retStream;

    const { tablename, config, poolName, copySinceQuery, orderby } = setParameters(location);
    const sqlString = `SELECT * FROM ${tablename} ${copySinceQuery} ${orderby}`;
    let bodyStream = new PassThrough();

    let pool = await getPool(poolName, config);

    const request = await pool.request();
    const readableStream = request.toReadableStream();
    // request.stream = true;

    readableStream.on('end', () => {
      resolve();
    });

    readableStream.on('error', (err) => {
      reject(err);
    });

    const stringifyOptions = setStringifyOptions(location);
    bodyStream = readableStream
      .pipe(stringify(stringifyOptions)
    );

    request.query(sqlString);

    console.log('Copy from SQL Server: ', location.connection, tablename);

    if (location.tableheaders) {
      retStream = await ssTableHeaders(location, bodyStream, pool);
    } else {
      retStream = bodyStream;
    }



    return { stream: retStream, promise };
  } catch (err) {
    throw new Error(`SQL Server stream error ${err}`);
  }
}

function setParameters(location) {
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
  const config = setDBConfigFromConnInfo(connInfo);
  return { tablename, config, poolName, copySinceQuery, orderby };
}



function setStringifyOptions(location) {
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
  return stringifyOptions;
}

function setDBConfigFromConnInfo(connInfo) {
  let config = {
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
  return config;
}

export default getSsStream;
