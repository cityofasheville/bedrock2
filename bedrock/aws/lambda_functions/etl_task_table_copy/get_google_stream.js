const {google} = require('googleapis');

async function get_google_stream(location) {
    let connection = location.connection

    // configure a JWT auth client
    let jwtClient = new google.auth.JWT(
    connection.client_email,
    null,
    connection.private_key,
    ['https://www.googleapis.com/auth/spreadsheets.readonly']);
    //authenticate request

  jwtClient.authorize(function (err, tokens) {
    if (err) {
      console.log(err);
      return;
    }
    try {
        let spreadsheetId = location.spreadsheetid;
        let range = location.range;
        let sheets = google.sheets(location.sheets);
        sheets.spreadsheets.values.get({
          auth,
          spreadsheetId,
          range
        }, function (err, response) { console.log("err response", err, response);
          if (err) {
            reject(new Error('The API returned an error: ' + err));
          }         
          const results = response.data.values;
          if (results) {
            resolve(results);  // this is not a stream... yet
          } else {
            reject(new Error('No data found.'));
          }
        });
    } catch (err) {
      console.error(err);
    }
  });
}

module.exports = get_google_stream