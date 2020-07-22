// const fs = require('fs');
// const csv = require('csv');
var AWS = require("aws-sdk");
var s3 = new AWS.S3({apiVersion: '2006-03-01'});

exports.handler = async (event) => {
    try {      
        const params = {Bucket: 'managed-data-assets-jon', Key: 'run/test_connections.json'};
         s3.getObject(params, function(err, data) {  
           if (err) console.log(err, err.stack); // an error occurred
           else     console.log(JSON.parse(data.Body.toString('utf8')));  
         })
    } catch (error) {
        console.log(error);
        return;
    }
}

// function get_db_defs() {
//     let db_defs

//     return db_defs
// }

// module.exports = get_db_defs