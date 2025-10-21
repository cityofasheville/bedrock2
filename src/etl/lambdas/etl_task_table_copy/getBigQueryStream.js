/* eslint-disable no-console */
import { google } from 'googleapis';
import { BigQuery } from '@google-cloud/bigquery';
import { PassThrough } from 'stream';
import { stringify } from 'csv-stringify';
import { createPromise } from './promiseWithResolvers.js';
import createBigQueryWritable from './createBigQueryWritable.js';


async function getBigQueryStream(location) {
  const { promise, resolve, reject } = createPromise();
  if (location.fromto === 'target_location') {
    return createBigQueryWritable(location);
  }
  try {
    const jwtClient = new google.auth.JWT({
        email: location.conn_info.client_email,
        key: location.conn_info.private_key,
        scopes: ['https://www.googleapis.com/auth/bigquery'],
      });

    const bigquery = new BigQuery({
      projectId: location.conn_info.project_id,
      authClient: jwtClient,
    });

    let retStream;
    let bodyStream = new PassThrough();
    const tableHeaders = location.tableheaders ?? false;
    const datasetId = location.schemaname;
    const tableId = location.tablename;
    const data = bigquery.dataset(datasetId).table(tableId);

    const readableStream = data.createReadStream();

    readableStream.on('end', () => {
      resolve();
    });

    readableStream.on('error', (err) => {
      reject(err);
    });

    bodyStream = readableStream
      .pipe(stringify({ header: tableHeaders })
    );

    console.log(`Copy from BigQuery Table: ${datasetId}.${tableId}`);

    if (location.tableheaders) {
      retStream = bodyStream;
    } else {
      retStream = bodyStream;
    }

    return { stream: retStream, promise };
  } catch (err) {
    throw new Error(`BigQuery stream error ${err}`);
  }
} 

export default getBigQueryStream;