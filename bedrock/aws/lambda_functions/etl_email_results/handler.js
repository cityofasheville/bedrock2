
let sendEmails = require('./sendEmails');

exports.lambda_handler = (event, context, callback) => {
  sendEmails(event)
}
