const { pipeline } = require('node:stream/promises'); // nodejs 16+
const getPgStream = require('./getPgStream');
const getSsStream = require('./getSsStream');
const getS3Stream = require('./getS3Stream');
const getGoogleStream = require('./getGoogleStream');
// eslint-disable-next-line no-unused-vars
const streamDebug = require('./streamDebug');
const getConnection = require('./getConnection');

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

exports.lambda_handler = async function x(event, context) {
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
  // const timeleft = 1000 * 60 * 15 - 1000 //SAM bug workaround

  const timeout = new Promise((resolve) => {
    setTimeout(() => resolve({ statusCode: 500, message: `Lambda timed out after ${Math.round(timeleft / 1000)} seconds` }), timeleft);
  });
  // race the timeout task with the real task
  return Promise.race([task, timeout])
    .then((res) => res)
    .catch((err) => (err));
};
