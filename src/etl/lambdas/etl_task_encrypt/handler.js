/* eslint-disable no-console */
import { readKey, encrypt, createMessage } from 'openpgp';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { getConnection } from 'bedrock_common';
import fillDateTemplate from './fillDateTemplate.js';

const s3Client = new S3Client({ region: 'us-east-1' });

function formatRes(code, result) {
  return {
    statusCode: code,
    body: {
      lambda_output: result,
    },
  };
}

export const lambda_handler = async function x(event) {
  try {
    const etl = event.ETLJob.etl_tasks[event.TaskIndex];
    if (!etl.active) { return (formatRes(200, 'Inactive: skipped')); }
    const filename = fillDateTemplate(etl.filename);
    const encryptedFilename = fillDateTemplate(etl.encrypted_filename);
    const s3Conn = await getConnection(etl.s3_connection);
    const encryptConnection = await getConnection(etl.encrypt_connection);
    const { pgp_key: pgpKey } = encryptConnection;

    // get unencrypted file 'filename' from s3
    const downloadParams = {
      Bucket: s3Conn.s3_bucket,
      Key: etl.path + filename,
    };
    console.log(JSON.stringify(downloadParams));

    const downloadCommand = new GetObjectCommand(downloadParams);
    const { Body: readableStream } = await s3Client.send(downloadCommand);

    // encrypt
    const publicKey = await readKey({ armoredKey: pgpKey });
    const encryptedStream = await encrypt({
      message: await createMessage({ binary: readableStream }),
      encryptionKeys: publicKey,
      config: { rejectPublicKeyAlgorithms: new Set([]) },
      // Needed for Delta Dental, whose key is ElGamal,
      // which OpenPGP won't encrypt by default cuz sux}
    });

    // put encrypted file 'encrypted_filename' to s3
    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: s3Conn.s3_bucket,
        Key: etl.path + encryptedFilename,
        Body: encryptedStream,
      },
    });
    const promise = await upload.done();

    return (formatRes(200, promise.Location));
  } catch (err) {
    return (formatRes(500, JSON.stringify(err, Object.getOwnPropertyNames(err))));
  }
};
