
const ses_sendemail = require('./ses_sendemail');

exports.lambda_handler = (event, context) => {
        let emailAddrs = JSON.parse(process.env.EMAIL_RECIPIENT_JSON);
        let htmlEmail = JSON.stringify(event);
        return ses_sendemail(emailAddrs,htmlEmail);
}
