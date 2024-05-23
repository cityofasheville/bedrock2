
import sendEmails from './sendEmails.js';

export async function lambda_handler(event) {
  try {
    await sendEmails(event);
    return {
      statusCode: 200
    };
  } catch (error) {
    console.error(error);
    return {
      statusCode: 500,
      body: JSON.stringify(error)
    };
  }
}
