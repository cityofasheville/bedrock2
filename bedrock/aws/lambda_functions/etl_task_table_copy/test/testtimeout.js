const get_ss_stream = require('../get_ss_stream')
const get_google_stream = require('../get_google_stream')
const get_connections = require('../get_connections')

const get_pg_stream = require('../get_pg_stream')
const stream = require('stream');
exports.lambda_handler = async (event, context) => {
    let timeleft = context.getRemainingTimeInMillis() - 300;


    // the real task
    const task = new Promise((resolve) => {
      setTimeout(() => { resolve({ statusCode: 200, message: 'Task finished.' }) }, 100000);
    })
    
    // timeout task 
    const timeout = new Promise(async (resolve) => {      
      await require('util').promisify(setTimeout)(timeleft);
      resolve({ statusCode: 500, message: `Lambda timed out after ${Math.round(timeleft/1000)} seconds` }) 
    })
    // race the timeout task with the real task
    const res = await Promise.race([task, timeout]);
    return res;
  };