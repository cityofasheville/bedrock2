import { pipeline } from 'node:stream/promises';
import { getConnection } from 'bedrock_common';
import getPgStream from './getPgStream.js';
import getSsStream from './getSsStream.js';
import getS3Stream from './getS3Stream.js';
import getGoogleStream from './getGoogleStream.js';
// eslint-disable-next-line no-unused-vars
import streamDebug from './streamDebug.js';

function returnError(err) {
  return {
    statusCode: 500,
    body: {
      lambda_output: err.toString(),
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

export const lambda_handler = async function x(event, context) {
  const task = new Promise((resolve) => {
    try {
      const etl = event.ETLJob.etl_tasks[event.TaskIndex];
      if (!etl.active) {
        resolve({ statusCode: 200, body: { lambda_output: 'Inactive: skipped' } });
      } else {
        const loc = {
          source_location: {},
          target_location: {},
        };

        Promise.all(Object.keys(loc).map(async (locname) => {
          try {
            let streamObject; // { stream, promise }
            const eachloc = {};
            eachloc.location = etl[locname];
            eachloc.location.fromto = locname;
            eachloc.location.conn_info = await getConnection(eachloc.location.connection);
            if (etl.copy_since) {
              eachloc.location.copy_since = etl.copy_since;
            }

            if (eachloc.location.conn_info.type === 'postgresql') {
              streamObject = await getPgStream(eachloc.location);
            } else if (eachloc.location.conn_info.type === 'sqlserver') {
              streamObject = await getSsStream(eachloc.location);
            } else if (eachloc.location.conn_info.type === 'google_sheets') {
              streamObject = await getGoogleStream(eachloc.location);
            } else if (eachloc.location.conn_info.type === 's3') {
              streamObject = await getS3Stream(eachloc.location);
            } else {
              resolve({
                statusCode: 500,
                body:
                  { lambda_output: `Invalid connection type: ${eachloc.location.conn_info.type}` },
              });
            }
            eachloc.stream = streamObject.stream;
            eachloc.promise = streamObject.promise;
            loc[locname] = eachloc;
            return eachloc;
          } catch (err) {
            return (err);
          }
        }))
          .then(() => {
            pipeline(
              loc.source_location.stream,
              // streamDebug,
              loc.target_location.stream,
            )
              .then(() => {
                loc.source_location.promise
                  .then(() => {
                    loc.target_location.promise
                      .then(() => {
                        resolve({
                          statusCode: 200,
                          body: {
                            lambda_output: outputMsg(etl.target_location),
                          },
                        });
                      });
                  });
              })
              .catch((err) => {
                resolve(returnError(err));
              });
          });
      }
    } catch (err) {
      resolve(returnError(err));
    }
  });

  // timeout task
  const timeleft = context.getRemainingTimeInMillis() - 300;

  const timeout = new Promise((resolve) => {
    setTimeout(() => resolve({ statusCode: 500, message: `Lambda timed out after ${Math.round(timeleft / 1000)} seconds` }), timeleft);
  });
  // race the timeout task with the real task
  return Promise.race([task, timeout])
    .then((res) => res)
    .catch((err) => (err));
};
