
import sendEmails from './sendEmails.js';

export function lambda_handler(event, context, callback) {
  sendEmails(event);
}
