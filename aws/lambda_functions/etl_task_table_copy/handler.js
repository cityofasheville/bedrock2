const getPgStream = require('./getPgStream')
const getSsStream = require('./getSsStream')
const getGoogleStream = require('./getGoogleStream')
// eslint-disable-next-line no-unused-vars
const streamDebug = require('./streamDebug')
const getConnection = require('./getConnection')

const util = require('util')
const stream = require('stream');
const pipeline = util.promisify(stream.pipeline);
// const { pipeline } = require('stream/promises') //requires node 15: lambda max currently 14

exports.lambda_handler = function (event, context) {
  const task = new Promise(async (resolve) => {
    // console.log('event', JSON.stringify(event, null, ' '))
    try {
      const etl = event.ETLJob.etl_tasks[event.TaskIndex]
      if (!etl.active) {
        resolve({ statusCode: 200, body: { lambda_output: 'Inactive: skipped' } })
      } else {
        const streams = {}

        const bothloc = [
          { name: 'source_location' },
          { name: 'target_location' }
        ]
        for (const eachloc of bothloc) {
          eachloc.location = etl[eachloc.name]
          eachloc.location.fromto = eachloc.name
          eachloc.location.conn_info = await getConnection(eachloc.location.connection)

          if (eachloc.location.conn_info.type === 'postgresql') {
            streams[eachloc.name] = await getPgStream(eachloc.location)
          } else if (eachloc.location.conn_info.type === 'sqlserver') {
            streams[eachloc.name] = await getSsStream(eachloc.location)
          } else if (eachloc.location.conn_info.type === 'google_sheets') {
            streams[eachloc.name] = await getGoogleStream(eachloc.location)
          }
        }

        pipeline(
          streams.source_location,
          // streamDebug,
          streams.target_location)
          .then(() => {
            resolve({
              statusCode: 200,
              body: {
                lambda_output: output_msg(etl.target_location)
              }
            })
          })
          .catch(err => {
            resolve(returnError(err))
          })
      }
    } catch (err) {
      resolve(returnError(err))
    }
  })

  // timeout task

  const timeleft = context.getRemainingTimeInMillis() - 300
  // const timeleft = 1000 * 10 //SAM bug workaround

  const timeout = new Promise((resolve) => {
    setTimeout(() => resolve({ statusCode: 500, message: `Lambda timed out after ${Math.round(timeleft / 1000)} seconds` }), timeleft)
  })
  // race the timeout task with the real task
  return Promise.race([task, timeout])
    .then((res) => {
      return res
    })
}

function returnError (err) {
  return {
    statusCode: 500,
    body: {
      lambda_output: err.toString()
    }
  }
}

function output_msg(loc){
  if( loc.tablename !== undefined ){
    return `Table copied ${loc.connection} ${loc.schemaname}.${loc.tablename}`
  }else if( loc.conn_info.type === 'google_sheets'){
    return `Google Sheet copied ${loc.spreadsheetid}`
  }else{
    return `Copied ${loc.connection}`
  }
}