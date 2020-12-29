const pug = require('pug');
const path = require('path');
const ses_sendemail = require('./ses_sendemail');

const compiledFunction = pug.compileFile(path.join(__dirname, '/email.pug'));

function sendEmails(results) {
    results.success.sort()
    results.failure.sort()
    results.skipped.sort()
    let emailAddrs = ["jtwilson@ashevillenc.gov"]
    let pugObj = {};
    pugObj.results = results;
    let htmlEmail = compiledFunction(pugObj);
    ses_sendemail(emailAddrs,htmlEmail);
}

module.exports = sendEmails;