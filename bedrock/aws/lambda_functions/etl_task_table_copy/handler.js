const get_pg_stream = require('./get_pg_stream')
const get_ss_stream = require('./get_ss_stream')
const getGoogleStream = require('./get_google_stream')
const stream_debug = require('./stream_debug')
const get_connections = require('./get_connections')
const util = require('util')
const stream = require('stream')

// const pipeline = util.promisify(stream.pipeline);
const { pipeline } = require('stream/promises')
// OR MAYBE... const { pipeline } = require('stream/promises');

exports.lambda_handler = function (event, context) {
  console.log('Set up the task')
  const task = new Promise(async (resolve) => {
    console.log('event', JSON.stringify(event, null, ' '))
    try {
      const etl = event.ETLJob.etl_tasks[event.TaskIndex]
      if (!etl.active) {
        return resolve({ statusCode: 200, body: {lambda_output: 'Inactive: skipped' } })
      } else {
        console.log('Get the connections')
        const connections = await get_connections()
        console.log('We have the connections: ')
        const streams = {}

        const bothloc = [
          { name: 'source_location' },
          { name: 'target_location' }
        ]
        for (const eachloc of bothloc) {
          console.log('Processing ' + eachloc.name)
          eachloc.location = etl[eachloc.name]
          eachloc.location.fromto = eachloc.name
          if (connections[eachloc.location.connection]) {
            eachloc.location.conn_info = connections[eachloc.location.connection]
          } else { 
            throw `Connection definition ${eachloc.location.connection} not found`
          }
          // console.log(JSON.stringify(eachloc.location,null,2))
          if (eachloc.location.conn_info.type === 'postgresql') {
            streams[eachloc.name] = await get_pg_stream(eachloc.location)
          } else if (eachloc.location.conn_info.type === 'sqlserver') {
            streams[eachloc.name] = await get_ss_stream(eachloc.location)
          } else if (eachloc.location.conn_info.type === 'google_sheets') {
            streams[eachloc.name] = await getGoogleStream(eachloc.location)
          }
        }
        console.log('Now the pipeline')
        const x = await pipeline(
          streams.source_location,
          // stream_debug,
          streams.target_location)
          .then(() => {
            console.log('Done with the pipeline')
            return resolve({
              statusCode: 200,
              body: {
                lambda_output: `Table copied ${etl.target_location.connection} ${etl.target_location.schemaname}.${etl.target_location.tablename}`
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
  const timeleft = context.getRemainingTimeInMillis() - 300;
  const timeout = new Promise((resolve) => {
    setTimeout(() => resolve({ statusCode: 500, message: `Lambda timed out after ${Math.round(timeleft/1000)} seconds` }), timeleft)
  })
  // race the timeout task with the real task
  console.log('Start the race')
  return Promise.race([task, timeout])
    .then((res) => {
      console.log('Here we are!')
      console.log(res)
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
