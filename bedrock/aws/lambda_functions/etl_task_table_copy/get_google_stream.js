const {google} = require('googleapis');
const { Readable } = require('stream'); 
const csv = require('csv');

async function get_google_stream(location){
    if(location.fromto == 'source_location') {
        try {
            let jwtClient = new google.auth.JWT(
                location.conn_info.client_email,
                null,
                location.conn_info.private_key,
                ['https://www.googleapis.com/auth/spreadsheets.readonly']
            );        
            await jwtClient.authorize()

            let spreadsheetId = location.spreadsheetid
            let range = location.range
            let sheets = google.sheets('v4')

            let response = await sheets.spreadsheets.values.get({
                auth: jwtClient,
                spreadsheetId,
                range
            })

            console.log("Copy from Google Sheet: https://docs.google.com/spreadsheets/d/", location.spreadsheetid)

            const csvstring = csv.stringify(response.data.values)
            return Readable.from(csvstring);

        } catch (err) {
            console.error("Google Sheet error: ", err);
            throw("Google Sheet error: " + err)
        }   
    }else if(location.fromto == 'target_location'){
        throw ("Google Sheets 'To' not implemented")
    }
}

module.exports= get_google_stream
