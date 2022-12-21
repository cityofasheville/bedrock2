const pug = require('pug');
const path = require('path');
const ses_sendemail = require('./ses_sendemail');

const compiledFunction = pug.compileFile(path.join(__dirname, '/email.pug'));

function sendEmails(results) {
    let emailAddrs = JSON.parse(process.env.EMAIL_RECIPIENT_JSON);
    let htmlEmail, emailSubject;
    if (!results.failure || !results.success || !results.skipped) {
        emailSubject = "ETL Jobs Status: No valid results"
        htmlEmail = "No valid results. Invalid rungroup?"
    } else {
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
    }

    ses_sendemail(emailAddrs, htmlEmail, emailSubject);
}

module.exports = sendEmails;