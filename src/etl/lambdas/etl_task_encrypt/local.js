import { lambda_handler } from './handler.js';
let event = {
    "JobIsGo": true,
    "ETLJob": {
      "name": "arag_ftp",
      "depends": [],
      "path": "",
      "run_group": "tues_night",
      "etl_tasks": [
        {
          "type": "encrypt",
          "s3_connection": "s3_data_files",
          "encrypt_connection": "arag_ftp",
          "filename": "users20240704.csv",
          "encrypted_filename": "faketest${YYYY}${MM}${DD}${HH}.pgp",
          "path": "safetyskills/",
          "active": true
        }
      ]
    },
    "TaskIndex": 0,
    "JobType": "encrypt"
  };

console.log( await lambda_handler(event));
