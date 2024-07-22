/* eslint-disable import/extensions */
/* eslint-disable no-console */

async function handleAbout() {
  let result = {
    error: false,
    message: '',
    result: {
        inProduction: !(process.env.BEDROCK_DB_HOST)
    }
  };

  return result;
}

export default handleAbout;
