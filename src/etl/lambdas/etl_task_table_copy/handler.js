const getPgStream = require('./getPgStream')
const getSsStream = require('./getSsStream')
const getS3Stream = require('./getS3Stream')
const getGoogleStream = require('./getGoogleStream')
// eslint-disable-next-line no-unused-vars
const streamDebug = require('./streamDebug')
const getConnection = require('./getConnection')

const { pipeline } = require('node:stream/promises'); //nodejs 16+

exports.lambda_handler = async function (event, context) {
  const task = new Promise((resolve) => {
    try {
      const etl = event.ETLJob.etl_tasks[event.TaskIndex]
      if (!etl.active) {
        resolve({ statusCode: 200, body: { lambda_output: 'Inactive: skipped' } })
      } else {
        const locations = [
          { name: 'source_location' },
          { name: 'target_location' }
        ]

        Promise.all(locations.map(async (eachloc) => {
          let streamObject;
          eachloc.location = etl[eachloc.name]
          eachloc.location.fromto = eachloc.name
          eachloc.location.conn_info = await getConnection(eachloc.location.connection)
          if (etl.copy_since) {
            eachloc.location.copy_since = etl.copy_since
          }

          if (eachloc.location.conn_info.type === 'postgresql') {
            streamObject = await getPgStream(eachloc.location);
          } else if (eachloc.location.conn_info.type === 'sqlserver') {
            streamObject = await getSsStream(eachloc.location);
          } else if (eachloc.location.conn_info.type === 'google_sheets') {
            streamObject = await getGoogleStream(eachloc.location);
          } else if (eachloc.location.conn_info.type === 's3') {
            streamObject = getS3Stream(eachloc.location);
          } else {
            resolve({
              statusCode: 500, body:
                { lambda_output: 'Invalid connection type: ' + eachloc.location.conn_info.type }
            })
          }
          eachloc.stream = streamObject.stream;
          eachloc.promise = streamObject.promise;

          return eachloc
        }))
          .then(() => {
            pipeline(
              locations[0].stream,
              // streamDebug,
              locations[1].stream)
              .then(() => {
                locations[0].promise
                  .then(() => {
                    locations[1].promise
                      .then(() => {
                        resolve({
                          statusCode: 200,
                          body: {
                            lambda_output: output_msg(etl.target_location)
                          }
                        });
                      });
                  });
              })
              .catch(err => {
                resolve(returnError(err))
              })
          })
      }
    } catch (err) {
      resolve(returnError(err))
    }
  })

  // timeout task
  const timeleft = context.getRemainingTimeInMillis() - 300
  // const timeleft = 1000 * 60 * 15 - 1000 //SAM bug workaround

  const timeout = new Promise((resolve) => {
    setTimeout(() => resolve({ statusCode: 500, message: `Lambda timed out after ${Math.round(timeleft / 1000)} seconds` }), timeleft)
  })
  // race the timeout task with the real task
  return Promise.race([task, timeout])
    .then((res) => {
      return res
    })
}

function returnError(err) {
  return {
    statusCode: 500,
    body: {
      lambda_output: err.toString()
    }
  }
}

function output_msg(loc) {
  if (loc.tablename !== undefined) {
    return `Table copied ${loc.connection} ${loc.schemaname}.${loc.tablename}`
  } else if (loc.conn_info.type === 'google_sheets') {
    return `Google Sheet copied ${loc.spreadsheetid}`
  } else {
    return `Copied ${loc.connection}`
  }
}