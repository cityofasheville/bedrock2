const { S3Client } = require('@aws-sdk/client-s3')
const { Upload } = require('@aws-sdk/lib-storage')
const stream = require('stream')
const s3Region = 'us-east-1'

function getS3Stream (location) {
    try {
      if (location.fromto === 'source_location') {
        reject(new Error("S3 'From' not implemented"))
        // TODO: S3 'From' might look like this:
        // const obj = s3.send(new GetObjectCommand({ Bucket, Key}));
        // obj.Body.pipe(process.stdout);
      } else if (location.fromto === 'target_location') {
        const s3Client = new S3Client({ region: s3Region })
        const s3Key = location.s3_path + fillDateTemplate(location.filename)
        const bucket = location.conn_info.s3_bucket

        const s3stream = new stream.PassThrough()

        const upload = new Upload({
            client: s3Client,
            params: {
                Bucket: bucket,
                Key: s3Key,
                Body: s3stream,
                ContentType: 'text/plain'
            }
        })
        let promise = upload.done()
        console.log('Copy to S3 Bucket: ', bucket, s3Key)
        return({s3stream,promise})
      }
    } catch (err) {
      console.log('err::', err)
      return(new Error(['S3 stream error', err]))
    }
}

function fillDateTemplate (template) {
  // Completes template with today's date in parts: YYYY, MM, DD,, HH, mm and/or SS
  // eg. filename_${YYYY} returns filename_2022
  // Warning! Dangerous eval in code, dont allow untrusted users.
  const regex = /\$\{/g
  let templateString = template.replace(regex,"${this.")
  let today = new Date();

  let day = today.getUTCDate()
  this.DD = (day>9 ? '' : '0') + day

  let month = today.getUTCMonth() + 1
  this.MM = (month>9 ? '' : '0') + month

  this.YYYY = today.getUTCFullYear().toString()
  // this.YY = YYYY.slice(2,)

  let hours = today.getUTCHours()
  this.HH = (hours>9 ? '' : '0') + hours

  let mins = today.getUTCMinutes()
  this.mm = (mins>9 ? '' : '0') + mins

  let secs = today.getUTCSeconds()
  this.SS = (secs>9 ? '' : '0') + secs

  // eslint-disable-next-line no-new-func
  return new Function('return `' + templateString + '`;').call(this)
}

module.exports = getS3Stream
