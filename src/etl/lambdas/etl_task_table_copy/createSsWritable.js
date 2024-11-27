/* eslint-disable max-len */
/* eslint-disable no-console */
import mssqlpkg from 'mssql';
const { VarChar, Table } = mssqlpkg;
import { parse } from 'csv-parse';
import { getPool } from './ssPools.js';
import { createPromise } from './promiseWithResolvers.js';

async function createSsWritable(location) {
  const { promise, resolve, reject } = createPromise();
  const { tablename, tempTablename, dropTempQuery, copySinceQuery, config, poolName } = setParameters(location);

  const timeout = 900_000; // 15 min
  const recordsToLoad = 100_000;

  const pool = await getPool(poolName, config);

  const queryStr = `
  select count(*) as colcount from INFORMATION_SCHEMA.COLUMNS 
  where TABLE_SCHEMA = '${location.schemaname}' and TABLE_NAME = '${location.tablename}';
  `;
  const result = await pool.query(queryStr);
  const numCols = result.recordset[0].colcount;
  if(numCols === 0) { throw(new Error(`Table ${tablename} not found`)); }

  let tableArr = [];
  const resPromiseArr = [];
  const SsStream = parse();

  SsStream.on('readable', () => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const record = SsStream.read();
      if (record == null) {
        break;
      }
      tableArr.push(record);
      if (tableArr.length >= recordsToLoad) {
        resPromiseArr.push(loadTempTable(tableArr, numCols, tempTablename, pool));
        tableArr = [];
      }
    }
  });

  SsStream.on('error', (err) => { 
    reject(err); 
  });

  SsStream.on('finish', async () => { // 'end' is readable event, 'finish' is writable event
    if (tableArr.length > 0) {
      resPromiseArr.push(loadTempTable(tableArr, numCols, tempTablename, pool));
    }
    await Promise.all(resPromiseArr);
    await copyFromTemp(location, tablename, tempTablename, dropTempQuery, copySinceQuery, pool);
    resolve();
  });
  console.log(`Copy to SQL Server ${location.connection} ${tablename}`);

  return { stream: SsStream, promise };
}

// loadTempTable: Load batch of rows into temp table
async function loadTempTable(tableArr, numCols, tempTablename, pool) {
  return new Promise((resolve, reject) => {
    try {
      // create a generic temp table with same number of cols as target.
      const table = new Table(tempTablename);
      table.create = true;

      for (let x = 0; x < numCols; x += 1) {
        table.columns.add(`col${x}`, VarChar(8000), { nullable: true });
      }
      tableArr.forEach((record) => {
        table.rows.add(...record);
      });

      const request = pool.request();
      request.bulk(table, (err, res) => {
        if (err) {
          reject(err);
        }
        console.log('Bulk results: ', res);
        resolve(0);
      });
    } catch (err) {
      console.log('Table load error: ', err);
      reject(err);
    }
  });
}

// copyFromTemp: After temp table is full, load real table
async function copyFromTemp(location, tablename, tempTablename, dropTempQuery, copySinceQuery, pool) {
  try {
    const serialToAppend = location.append_serial
      ? `alter table ${tempTablename} add [${location.append_serial}] int identity;`
      : '';
    let deleteOld;
    if (location.copy_since) {
      deleteOld = `DELETE FROM ${tablename} ${copySinceQuery};`;
    } else if (location.append) {
      deleteOld = '';
    } else {
      deleteOld = `DELETE FROM ${tablename};`;
    }

    const transString = `
          BEGIN TRANSACTION;
          ${serialToAppend}
          ${deleteOld}
          INSERT INTO ${tablename} SELECT * FROM ${tempTablename};
          ${dropTempQuery}
          COMMIT;
        `;

    await pool.query(transString);
  } catch (err) {
    console.log(err);
  }
}

function setParameters(location) {
  const tablename = `[${location.schemaname}].[${location.tablename}]`;
  // const tempTablename = `[${location.schemaname}].[tempbedrock_${location.tablename}]`;
  const tempTablename = `[#tempbedrock_${location.tablename}]`;
  const dropTempQuery = `IF OBJECT_ID('${tempTablename}', 'U') IS NOT NULL DROP TABLE ${tempTablename};`;
  const copySinceQuery = location.copy_since
    ? ` where [${location.copy_since.column_to_filter}] >= dateadd(WEEK,-${location.copy_since.num_weeks},GETDATE())`
    : '';

  const connInfo = location.conn_info;
  const poolName = location.connection;
  const config = setDBConfigFromConnInfo(connInfo);
  return { tablename, tempTablename, dropTempQuery, copySinceQuery, config, poolName }
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

export default createSsWritable;
