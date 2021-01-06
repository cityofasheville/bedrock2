const pug = require('pug');
const path = require('path');
const ses_sendemail = require('./ses_sendemail');

const compiledFunction = pug.compileFile(path.join(__dirname, '/email.pug'));

function sendEmails(results) {
    results.failure = results.failure.map(res=>res.name) 
    results.success.sort() 
    results.failure.sort() 
    results.skipped.sort()

    let emailSubject = "ETL Jobs Status: OK"
    if (results.skipped.length > 0 || results.failure.length > 0) {
        emailSubject = "ETL Jobs Status: Error"
    }

    let emailAddrs = ["jtwilson@ashevillenc.gov"]
    let pugObj = {};
    pugObj.results = results;
    let htmlEmail = compiledFunction(pugObj);
    ses_sendemail(emailAddrs,htmlEmail,emailSubject);
}

module.exports = sendEmails;