const pug = require('pug');
const path = require('path');
const ses_sendemail = require('./ses_sendemail');

const compiledFunction = pug.compileFile(path.join(__dirname, '/email.pug'));

function sendEmails(results) {
  const totalResults = results?.failure?.length + results?.success?.length + results?.skipped?.length;
  if (totalResults > 0) {
    let emailAddrs = JSON.parse(process.env.EMAIL_RECIPIENT_JSON);
    let htmlEmail, emailSubject;
      results.failure = results.failure.map(res => res.name)
      results.failure.sort()
      results.success.sort()
      results.skipped.sort()

      emailSubject = "ETL Jobs Status: OK"
      if (results.skipped.length > 0 || results.failure.length > 0) {
        emailSubject = "ETL Jobs Status: Error"
      }

      let pugObj = {};
      pugObj.results = results;
      htmlEmail = compiledFunction(pugObj);
      ses_sendemail(emailAddrs, htmlEmail, emailSubject);
  }else{
    console.log('No email sent')
  }
}

module.exports = sendEmails;