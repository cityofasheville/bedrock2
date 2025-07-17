import { compileFile } from 'pug';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import ses_sendemail from './ses_sendemail.js';

const __dirname = dirname(fileURLToPath(import.meta.url)); // current directory

const compiledFunction = compileFile(join(__dirname, '/email.pug'));

async function sendEmails(results) {
  let noemail_list = results.noemail.map(item => item.name);
  let email_list = results.success.map(item => item.name)
                          .concat(results.skipped.map(item => item.name))
                          .concat(results.failure.map(item => item.name));
  let in_email_but_not_noemail = email_list.filter(item => !noemail_list.includes(item));
  if (in_email_but_not_noemail.length > 0) {
    let emailRecip = [process.env.EMAIL_RECIPIENT];
    let emailSender = process.env.EMAIL_SENDER;
    let errorEmailRecip = process.env.ERROR_EMAIL_RECIPIENT;
    let errorEmailSender = process.env.ERROR_EMAIL_SENDER;
    let htmlEmail, emailSubject;
    let failureMessages = results.failure.map(res => res.result);
    results.failure = results.failure.map(res => ({
      name: res.name,
      asset_url: res.asset_url
    }));
    results.failure.sort();
    results.success.sort();
    results.skipped.sort();
    results.sendToHelpDesk = process.env.SEND_ERRORS_TO_HELPDESK;
    emailSubject = "ETL Jobs Status: OK";
    if (results.skipped.length > 0 || results.failure.length > 0) {
      if (results.sendToHelpDesk === "true" || results.sendToHelpDesk === true) {
        emailSubject = `${process.env.ERROR_EMAIL_SUBJECT_TAG} Bedrock ETL Jobs Status: Error`;
        emailRecip = errorEmailRecip === null || errorEmailRecip === '' ? emailRecip : [errorEmailRecip];
        emailSender = errorEmailSender === null || errorEmailSender === '' ? emailSender : errorEmailSender;
      } else {
        emailSubject = 'ETL Jobs Status: Error';
      }
      // console.log(emailSubject,emailRecip,emailSender);
    }
    
    let pugObj = {};
    pugObj.results = results;
    htmlEmail = compiledFunction(pugObj);
    return await ses_sendemail(emailRecip, emailSender, htmlEmail, emailSubject, failureMessages);
  }else{
    console.log('No email sent');
    return 'No email sent';
  }
}

export default sendEmails;
