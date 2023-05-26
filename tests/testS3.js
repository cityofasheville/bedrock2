
const fs = require("fs")
const getS3Stream = require('../getS3Stream')
const util = require('util')
const stream = require('stream');
const pipeline = util.promisify(stream.pipeline);

(async()=>{
// exports.lambda_handler = async function (event, context) {
    let streamfrom = stream.Readable.from(["input string"])

    let location = {
        "connection": "s3_data_files",
        "filename": "test${YYYY}${MM}${DD}.txt",
        "path": "test/",
        "fromto": "target_location",
        "conn_info": {
            "type": "s3",
            "s3_bucket": "bedrock-data-files"
        }
    }

    let streamto = await getS3Stream(location) //fs.createWriteStream("./moo.txt") // 


    pipeline(
        streamfrom,
        streamto)
    .then(() => {
    console.log("done")
    })
    .catch(err => {
        console.log(err)
    })
// }
})()