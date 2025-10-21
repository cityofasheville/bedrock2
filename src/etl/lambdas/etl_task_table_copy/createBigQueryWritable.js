import fs from 'fs';
import * as fsp from 'fs/promises';
import { BigQuery } from '@google-cloud/bigquery';
import { google } from 'googleapis';
import { createPromise } from './promiseWithResolvers.js';
import { Writable } from 'stream';


async function createBigQueryWritable(location) {
  const { promise, resolve, reject } = createPromise();
  let buff = '';
  const folderPath = '/tmp';
  const tempFilePath = `${folderPath}/tmpStream.csv`;
  const append = location.append ?? false;

  const csvStream = new Writable({
    write(chunk, encoding, done) {
      buff += chunk;
      done();
    },

    async final(done) {
      try {
        await fsp.mkdir(folderPath, { recursive: true });
        await fsp.writeFile(tempFilePath, buff);
        console.log(`Successfully created CSV: ${tempFilePath}`);

        await updateBqTableFromCsv(location, tempFilePath, append);

        resolve(tempFilePath);
      } catch (err) {
        console.error('CSV error: ', err);
        reject(err);
      } finally {
        if (tempFilePath && fs.existsSync(tempFilePath)) {
          await fsp.rm(folderPath, { recursive: true, force: true });
          console.log(`\nCleaned up temporary file: ${tempFilePath}`);
        }
      }
      done();
    },
  });

  return { stream: csvStream, promise };
}

async function updateBqTableFromCsv(location, csvFilePath, append = false) {
  const jwtClient = new google.auth.JWT({
    email: location.conn_info.client_email,
    key: location.conn_info.private_key,
    scopes: ['https://www.googleapis.com/auth/bigquery'],
  });

  const bigquery = new BigQuery({
    projectId: location.conn_info.project_id,
    authClient: jwtClient,
  });

  const writeDisposition = append ? 'WRITE_APPEND' : 'WRITE_TRUNCATE'; 
  const metadata = {
    sourceFormat: 'CSV',
    skipLeadingRows: 0,
    maxBadRecords: 0,
    writeDisposition: writeDisposition, //'WRITE_APPEND' or 'WRITE_TRUNCATE'
  };

  console.log(`Starting update job for table ${location.schemaname}.${location.tablename}`);

  try {
    if (!fs.existsSync(csvFilePath)) {
      throw new Error(`File not found at path: ${csvFilePath}`);
    }

    const [job] = await bigquery
      .dataset(location.schemaname)
      .table(location.tablename)
      .createLoadJob(csvFilePath, metadata);

    let state = 'RUNNING'

    while (state === 'RUNNING') {  
      await job.get();
      const status = job.metadata.status;
      state = status.state;
      if (status.errorResult) {
        throw new Error(`BigQuery Job failed with error: ${JSON.stringify(status.errors)}`);
      }
    }
    console.log(`BigQuery Job ${job.id} completed successfully.`);

  } catch (error) {
    console.error('An error occurred during the bulk update process:');
    console.error(error);
    throw error;
  }
}

export default createBigQueryWritable;