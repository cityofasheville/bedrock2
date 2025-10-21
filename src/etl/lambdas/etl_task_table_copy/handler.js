import { pipeline } from 'node:stream/promises';
import { getConnection } from 'bedrock_common';
import getPgStream from './getPgStream.js';
import getSsStream from './getSsStream.js';
import getS3Stream from './getS3Stream.js';
import getGoogleStream from './getGoogleStream.js';
import getBigQueryStream from './getBigQueryStream.js';
// eslint-disable-next-line no-unused-vars
import streamDebug from './streamDebug.js';

function returnError(err) {
  console.log(err);
  return {
    statusCode: 500,
    body: {
      lambda_output: err.message,
    },
  };
}

function outputMsg(loc) {
  if (loc.tablename !== undefined) {
    return `Table copied ${loc.connection} ${loc.schemaname}.${loc.tablename}`;
  } if (loc.conn_info.type === 'google_sheets') {
    return `Google Sheet copied ${loc.spreadsheetid}`;
  }
  return `Copied ${loc.connection}`;
}

export async function lambda_handler(event) {
  try {
    const etl = event.ETLJob.etl_tasks[event.TaskIndex];
    if (!etl.active) {
      return ({ statusCode: 200, body: { lambda_output: 'Inactive: skipped' } });
    } else {
      if (etl.source_location.copy_since) {
        etl.target_location.copy_since = etl.source_location.copy_since;
      }
      const loc = {
        source_location: {},
        target_location: {},
      };

      for (const locname of Object.keys(loc)) {
          let streamObject; // { stream, promise }
          const eachloc = {};
          eachloc.location = etl[locname];
          eachloc.location.fromto = locname;
          eachloc.location.conn_info = await getConnection(eachloc.location.connection);

          if (eachloc.location.conn_info.type === 'postgresql') {
            streamObject = await getPgStream(eachloc.location);
          } else if (eachloc.location.conn_info.type === 'sqlserver') {
            streamObject = await getSsStream(eachloc.location);
          } else if (eachloc.location.conn_info.type === 'google_sheets') {
            streamObject = await getGoogleStream(eachloc.location);
          } else if (eachloc.location.conn_info.type === 's3') {
            streamObject = await getS3Stream(eachloc.location);
          } else if (eachloc.location.conn_info.type === 'bigquery') {
            streamObject = await getBigQueryStream(eachloc.location);
          } else {
            return (returnError(`Invalid connection type: ${eachloc.location.conn_info.type}`));
          }
          eachloc.stream = streamObject.stream;
          eachloc.promise = streamObject.promise;
          loc[locname] = eachloc;
      }
      pipeline(
        loc.source_location.stream,
        // streamDebug,
        loc.target_location.stream,
      )

      await loc.source_location.promise;
      await loc.target_location.promise;
      return ({
        statusCode: 200,
        body: {
          lambda_output: outputMsg(etl.target_location),
        },
      });
    }
  } catch (err) {
    return (returnError(err));
  }
};
