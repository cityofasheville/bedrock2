/* eslint-disable no-console */
import pgpkg from 'pg';
const { Client } = pgpkg;
import { to as copyTo } from 'pg-copy-streams'; // pipe from a table _TO_ stream
import { from as copyFrom } from 'pg-copy-streams'; // pipe to a table _FROM_ stream
import { createPromise } from './promiseWithResolvers.js';

async function getPgStream(location) {
  try {
    const { tablename, tableheaders, copySinceQuery, orderby, tempTablename, client } = setParameters(location);

    await client.connect()

    if (location.fromto === 'source_location') {
      const { promise, resolve, reject } = createPromise();
      if (location.fixedwidth_noquotes) {
        throw new Error("Postgres 'fixedwidth_noquotes' not implemented");
      }
      if (location.crlf) {
        throw new Error("Postgres 'crlf' not implemented");
      }
      const queryString = `COPY (SELECT * FROM ${tablename} 
              ${copySinceQuery}
              ${orderby}) TO STDOUT WITH (FORMAT csv ${tableheaders})`;

      let stream = client.query(copyTo(queryString));

      stream.on('error', (err) => { client.end(); reject(err); });
      stream.on('end', () => { client.end(); resolve(); });

      console.log('Copy from Postgres: ', location.connection, tablename);
      return { stream, promise };
    } else if (location.fromto === 'target_location') {
      const { promise, resolve, reject } = createPromise();
      // create empty temp table
      const createtempString = `SELECT * INTO TEMP ${tempTablename} FROM ${tablename} WHERE 1=2;`;
      await client.query(createtempString);

      if (location.append_serial) {
        // The serial column appears in target but not source,
        // so drop it first and read it after stream
        const dropserialString = `alter table ${tempTablename} drop column ${location.append_serial};`;
        client.query(dropserialString).catch((err) => { reject(err); });
      }

      const queryString = `COPY ${tempTablename} FROM STDIN WITH (FORMAT csv)`;
      let stream = client.query(copyFrom(queryString));

      stream.on('error', (err) => { client.end(); reject(err); });
      stream.on('finish', async () => { await copyFromTemp(location, tablename, tempTablename, client); client.end(); resolve(); });

      console.log('Copy to Postgres: ', location.connection, tablename);
      return { stream, promise };

    }
  } catch (err) {
    throw new Error(`Postgres stream error ${err}`);
  }
}

async function copyFromTemp(location, tablename, tempTablename, client) {
  try {
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
    await client.query(transString);
  } catch (err) {
    client.end();
    throw new Error(`Postgres copyFromTemp error ${err}`);
  }
}

function setParameters(location) {
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
  return { tablename, tableheaders, copySinceQuery, orderby, tempTablename, client };
}

export default getPgStream;

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
