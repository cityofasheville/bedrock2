const openpgp = require('openpgp')
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3')
const { Upload } = require('@aws-sdk/lib-storage')
const getConnection = require('./getConnection')
const fillDateTemplate = require('./fillDateTemplate')
const s3_client = new S3Client({ region: 'us-east-1' })

exports.lambda_handler = async function (event, context) {
    try {
        let etl = event.ETLJob.etl_tasks[event.TaskIndex];
        if (!etl.active) { resolve(formatRes(200, "Inactive: skipped")) }
        let filename = fillDateTemplate(etl.filename)
        let encrypted_filename = fillDateTemplate(etl.encrypted_filename)
        const s3_conn = await getConnection(etl.s3_connection)
        const ftp_conn = await getConnection(etl.encrypt_connection)
        let pgp_key = ftp_conn.pgp_key

        // get unencrypted file 'filename' from s3
        let download_params = {
            Bucket: s3_conn.s3_bucket,
            Key: etl.s3_path + filename
        }
        console.log(JSON.stringify(download_params));

        const download_command = new GetObjectCommand(download_params);
        const { Body: readableStream } = await s3_client.send(download_command);

        // encrypt
        const publicKey = await openpgp.readKey({ armoredKey: pgp_key });
        const encrypted_stream = await openpgp.encrypt({
            message: await openpgp.createMessage({ binary: readableStream }),
            encryptionKeys: publicKey,
            config: {rejectPublicKeyAlgorithms:new Set([])} // Needed for Delta Dental, whose key is ElGamal, which OpenPGP won't encrypt by default cuz sux}
        });

        // put encrypted file 'encrypted_filename' to s3
        const upload = new Upload({
            client: s3_client,
            params: {
                Bucket: s3_conn.s3_bucket,
                Key: etl.s3_path + encrypted_filename,
                Body: encrypted_stream
            }
        })
        let promise = await upload.done()

        return (formatRes(200, promise.Location))
    }
    catch (err) {
        return (formatRes(500, JSON.stringify(err, Object.getOwnPropertyNames(err))))
    }
}

function formatRes(code, result) {
    return {
        'statusCode': code,
        'body': {
            "lambda_output": result
        }
    }
}




