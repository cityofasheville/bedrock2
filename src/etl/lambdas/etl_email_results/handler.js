
import sendEmails from './sendEmails.js';

function formatRes(code, result) {
  return {
    statusCode: code,
    body: {
      lambda_output: result,
    },
  };
}

export async function lambda_handler(event) {
  let ret = await sendEmails(event);
  return formatRes(ret['$metadata'].httpStatusCode, ret.MessageId);
}
