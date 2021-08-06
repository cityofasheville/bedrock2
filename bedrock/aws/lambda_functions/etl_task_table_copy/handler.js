const getPgStream = require('./getPgStream')
const getSsStream = require('./getSsStream')
const getGoogleStream = require('./getGoogleStream')
// eslint-disable-next-line no-unused-vars
const streamDebug = require('./streamDebug')
const getConnections = require('./getConnections')

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
        return resolve({ statusCode: 200, body: { lambda_output: 'Inactive: skipped' } })
      } else {
        const connections = await getConnections()
        const streams = {}

        const bothloc = [
          { name: 'source_location' },
          { name: 'target_location' }
        ]
        for (const eachloc of bothloc) {
          eachloc.location = etl[eachloc.name]
          eachloc.location.fromto = eachloc.name
          if (connections[eachloc.location.connection]) {
            eachloc.location.conn_info = connections[eachloc.location.connection]
          } else {
            throw new Error(`Connection definition ${eachloc.location.connection} not found`)
          }
          // console.log(JSON.stringify(eachloc.location,null,2))
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
          // stream_debug,
          streams.target_location)
          .then(() => {
            return resolve({
              statusCode: 200,
              body: {
                lambda_output: `Table copied ${etl.target_location.connection} ${ifok(etl.target_location.schemaname)}.${ifok(etl.target_location.tablename)}`
              }
            })
          })
          .catch(err => {
            return resolve(returnError(err))
          })
      }
    } catch (err) {
      return resolve(returnError(err))
    }
  })

  // timeout task
  // const timeleft = context.getRemainingTimeInMillis() - 300
  const timeleft = 1000 * 10
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

function ifok(x) {
  return typeof x !== 'undefined' ? x : ''
}