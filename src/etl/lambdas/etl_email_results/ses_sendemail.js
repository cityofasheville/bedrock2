import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
const REGION = "us-east-1";
const sesClient = new SESClient({ region: REGION });

async function ses_sendemail(emailAddrs, emailSender, htmlEmail, emailSubject) {
  let params = {
    Destination: {
      CcAddresses: [],
      ToAddresses: emailAddrs,
    },
    Message: { /* required */
      Body: { /* required */
        Html: {
          Charset: "UTF-8",
          Data: htmlEmail,
        },
        Text: {
          Charset: "UTF-8",
          Data: htmlEmail,
        },
      },
      Subject: {
        Charset: "UTF-8",
        Data: emailSubject
      },
    },
    Source: emailSender,
    ReplyToAddresses: [
      emailSender,
    ],
  };

  const sendEmailCommand = new SendEmailCommand(params);

  try {
    return await sesClient.send(sendEmailCommand);
  } catch (e) {
    console.error("Failed to send email.", e);
    return e;
  }
};

export default ses_sendemail;