const sql = require('mssql');
const csv = require('csv');
const { getPool } = require('./ssPools');

async function createSsWritable(location) {
  const tablename = `[${location.schemaname}].[${location.tablename}]`;
  const tempTablename = `[${location.schemaname}].[tempbedrock_${location.tablename}]`;
  // const tempTablename = `[#tempbedrock_${location.tablename}]`;
  const dropTempQuery = `IF OBJECT_ID('${tempTablename}', 'U') IS NOT NULL DROP TABLE ${tempTablename}`;
  const copySinceQuery = location.copy_since
    ? ` where [${location.copy_since.column_to_filter}] >= dateadd(WEEK,-${location.copy_since.num_weeks},GETDATE())`
    : '';

  const connInfo = location.conn_info;
  const poolName = location.connection;
  const timeout = 900_000; // 15 min
  const recordsToLoad = 100_000;
  let promiseResolve;
  let promiseReject;

  const config = {
    server: connInfo.host,
    port: connInfo.port,
    user: connInfo.username,
    password: connInfo.password,
    database: connInfo.database,
    connectionTimeout: timeout,
    requestTimeout: timeout,
    options: {
      enableArithAbort: true,
    },
    pool: {
      max: 10,
      min: 1,
      idleTimeoutMillis: timeout,
      acquireTimeoutMillis: timeout,
      createTimeoutMillis: timeout,
      destroyTimeoutMillis: timeout,
      reapIntervalMillis: timeout,
      createRetryIntervalMillis: timeout,
    },
    trustServerCertificate: true, // Accela has self-signed certs?
  };
  const pool = await getPool(poolName, config);

  // copyFromTemp: After temp table is full, load real table
  async function copyFromTemp() {
    try {
      const serialToAppend = location.append_serial
        ? `alter table ${tempTablename} add [${location.append_serial}] int identity;`
        : '';
      const deleteOld = location.copy_since
        ? `DELETE FROM ${tablename} ${copySinceQuery};`
        : `TRUNCATE TABLE ${tablename};`;

      const transString = `
            BEGIN TRANSACTION;
            ${serialToAppend}
            ${deleteOld}
            INSERT INTO ${tablename} SELECT * FROM ${tempTablename};
            COMMIT;
          `;

      pool.query(transString, (err) => {
        if (err) return (err);
        pool.query(dropTempQuery);
        return 0;
      });
    } catch (err) {
      console.log(err);
    }
  }

  // loadTempTable: Load batch of rows into temp table
  function loadTempTable(tableArr) {
    return new Promise((resolve, reject) => {
      try {
        // create a generic temp table with same number of cols as target.
        const table = new sql.Table(tempTablename);
        table.create = true;

        for (let x = 0; x < numCols; x += 1) {
          table.columns.add(`col${x}`, sql.VarChar(8000), { nullable: true });
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

  await pool.query(dropTempQuery);

  const queryStr = `
  select count(*) as colcount from INFORMATION_SCHEMA.COLUMNS 
  where TABLE_SCHEMA = '${location.schemaname}' and TABLE_NAME = '${location.tablename}';
  `;
  const result = await pool.query(queryStr);
  const numCols = result.recordset[0].colcount;

  let tableArr = [];
  const resPromiseArr = [];
  const SsStream = csv.parse();

  SsStream.on('readable', () => {
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const record = SsStream.read();
      if (record == null) {
        break;
      }
      tableArr.push(record);
      if (tableArr.length >= recordsToLoad) {
        resPromiseArr.push(loadTempTable(tableArr));
        tableArr = [];
      }
    }
  });

  SsStream.on('error', (err) => {
    console.error(err.message);
  });

  SsStream.on('finish', () => {   // 'end' is readable event, 'finish' is writable event
    if (tableArr.length > 0) {
      resPromiseArr.push(loadTempTable(tableArr));
    }
    Promise.all(resPromiseArr)
      .then(() => {
        copyFromTemp();
      })
      .then(() => {
        promiseResolve();
      })
  });
  console.log(`Copy to SQL Server ${location.connection} ${tablename}`);

  // Return the results promise immediatly, but resolve when all data is copied.
  const promise = new Promise((resolve, reject) => {
    promiseResolve = resolve;
    promiseReject = reject;
  });
  
  return { promise, stream: SsStream };
}

module.exports = createSsWritable;
