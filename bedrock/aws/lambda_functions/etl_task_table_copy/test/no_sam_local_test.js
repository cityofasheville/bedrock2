const { lambda_handler } = require('../handler')
const localEvent = require('./no_sam_local_event.json')
const context = {
  getRemainingTimeInMillis: function () {
    return 1000 * 10
  }
}

console.log(localEvent)
lambda_handler(localEvent, context)
  .then((results) => {
    // process.exit(0)
  }, err => {
    console.error('Ther ewas an error ' + err)
  })
