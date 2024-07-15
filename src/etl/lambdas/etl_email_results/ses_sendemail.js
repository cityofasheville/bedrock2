import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";

async function ses_sendemail(emailAddrs, emailSender, htmlEmail, emailSubject, failureMessages)  {

  const sesClient = new SESClient({ region: "us-east-1" });

  let attachmentPart = "";
  if(failureMessages.length > 0){
    let attachment = JSON.stringify(failureMessages,null,2);
    attachmentPart = [
      `--boundary`,
      `Content-Type: application/json`,
      `Content-Disposition: attachment; filename="error_messages.json"`,
      ``,
      `${attachment}`,
      ``,
      `--boundary--`
    ].join("\n");
  }

  let rawMessage = [
    `From: ${emailSender}`,
    `To: ${emailAddrs.join(",")}`,
    `Subject: ${emailSubject}`,
    `Content-Type: multipart/mixed; boundary="boundary"`,
    ``,
    `--boundary`,
    `Content-Type: text/html; charset=UTF-8`,
    ``,
    `${htmlEmail}`,
    ``,
    `${attachmentPart}`,
    `--boundary--`
  ].join("\n");

  const rawEmail = {
    Source: emailSender,
    Destinations: emailAddrs,
    RawMessage: {
      Data: Buffer.from(
        rawMessage
      ),
    },
  };

  try {
    const sendRawEmailCommand = new SendRawEmailCommand(rawEmail);
    const response = await sesClient.send(sendRawEmailCommand);
    console.log("Email sent successfully:", response.MessageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

export default ses_sendemail;
