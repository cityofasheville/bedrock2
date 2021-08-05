const stream = require('stream')
const { google } = require('googleapis')

/*
writable._write(chunk, encoding, callback)
https://nodejs.org/api/stream.html#stream_writable_write_chunk_encoding_callback_1
*/

async function writeToSheet (location, theData, append = false) {
  console.log('IN writeToSheet!')
  try {
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
    // https://developers.google.com/sheets/api/reference/rest/v4/spreadsheets.values/clear
    let response
    if (!append) {
      response = await sheets.spreadsheets.values.clear({
        auth: jwtClient,
        spreadsheetId,
        range: 'Sheet2!A2:B'
      })
      console.log('Cleared the sheet')
    }
    response = await sheets.spreadsheets.values.append({
      auth: jwtClient,
      spreadsheetId,
      range: 'Sheet2!A1:b',
      insertDataOption: 'OVERWRITE',
      valueInputOption: 'USER_ENTERED',
      resource: {
        majorDimension: 'ROWS',
        values: [
          ['1', '2'], ['3', '4'], ['5', '6']
        ]
      }
    })
    console.log(response)
    /*
      Maybe pasteData, maybe updateData or somethign
    */
    // response = await sheets.spreadsheets.values.batchUpdate({
    //   auth: jwtClient,
    //   spreadsheetId,
    //   resource: {
    //     requests: [
    //       {
    //         pasteData: {
    //           coordinate: {
    //             sheetId: spreadsheetId,
    //             rowIndex: 0,
    //             columnIndex: 0
    //           },
    //           data: theData,
    //           delimiter: ','
    //         }
    //       }
    //     ]
    //   }
    // })
  } catch (e) {
    console.log(e)
  }
}

module.exports = async function createGoogleWritable (location) {
  const googleStream = new stream.Writable()
  let result = ''
  const saveLocation = location
  const append = location.append
  googleStream._write = function (chunk, encoding, done) {
    console.log(chunk.toString())
    result += chunk
    done(null)
    return true
  }

  googleStream._close = function () {
    console.log('In close!')
  }

  googleStream._destroy = function (err, done) {
    console.log('in destroy ' + err)
    done()
    return true
  }

  googleStream._final = async function (done) {
    console.log('In final')
    console.log('Final result = ' + result)
    writeToSheet(saveLocation, result, append)
    done()
    return true
  }

  return googleStream
}
