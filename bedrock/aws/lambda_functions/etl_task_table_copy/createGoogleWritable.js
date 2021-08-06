const stream = require('stream')
const { google } = require('googleapis')
const csvParse = require('csv/lib/sync')

async function writeToSheet (location, theData, append = false) {
  const jwtClient = new google.auth.JWT(
    location.conn_info.client_email,
    null,
    location.conn_info.private_key,
    ['https://www.googleapis.com/auth/spreadsheets']
  )
  await jwtClient.authorize()

  const spreadsheetId = location.spreadsheetid
  const sheets = google.sheets('v4')

  // First clear the spreadsheet
  if (!append) {
    await sheets.spreadsheets.values.clear({
      auth: jwtClient,
      spreadsheetId,
      range: location.range
    })
  }
  // Now append the new values
  sheets.spreadsheets.values.append({
    auth: jwtClient,
    spreadsheetId,
    range: location.range,
    insertDataOption: 'OVERWRITE',
    valueInputOption: 'USER_ENTERED',
    resource: {
      majorDimension: 'ROWS',
      values: csvParse.parse(theData)
    }
  }).then(function(response) {
    // TODO: Change code below to process the `response` object:
    console.log(response.result);
  }, function(reason) {
    console.error('error: ' + reason.result.error.message);
  })
}



module.exports = async function createGoogleWritable (location) {
  const googleStream = new stream.Writable()
  let result = ''
  const saveLocation = location
  const append = location.append

  googleStream._write = function (chunk, encoding, done) {
    result += chunk
    done()
  }

  googleStream._final = async function (done) {
    try {
      writeToSheet(saveLocation, result, append)
      console.log('Copy to Google Sheet: https://docs.google.com/spreadsheets/d/' + location.spreadsheetid + '/edit#gid=' + location.range.split('!')[0])
    } catch (err) {
      console.error('Google Sheet error: ', err)
      throw new Error('Google Sheet error: ' + err)
    }
    done()
  }

  return googleStream
}
