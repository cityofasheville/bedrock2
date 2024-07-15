import { compileFile } from 'pug';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import ses_sendemail from './ses_sendemail.js';

const __dirname = dirname(fileURLToPath(import.meta.url)); // current directory

const compiledFunction = compileFile(join(__dirname, '/email.pug'));

function sendEmails(results) {
  const totalResults = results?.failure?.length + results?.success?.length + results?.skipped?.length;
  if (totalResults > 0) {
    let emailRecip = [process.env.EMAIL_RECIPIENT];
    let emailSender = process.env.EMAIL_SENDER;
    let htmlEmail, emailSubject;
    let failureMessages = results.failure.map(res => res.result);
    results.failure = results.failure.map(res => res.name);
    results.failure.sort();
    results.success.sort();
    results.skipped.sort();

    emailSubject = "ETL Jobs Status: OK";
    if (results.skipped.length > 0 || results.failure.length > 0) {
      emailSubject = "ETL Jobs Status: Error";
    }

    let pugObj = {};
    pugObj.results = results;
    htmlEmail = compiledFunction(pugObj);
    return ses_sendemail(emailRecip, emailSender, htmlEmail, emailSubject, failureMessages);
  }else{
    console.log('No email sent');
  }
}

export default sendEmails;
