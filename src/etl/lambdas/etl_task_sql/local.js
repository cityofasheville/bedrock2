import { lambda_handler } from './handler.js';
let event = {
    "ETLJob": {
      "etl_tasks": [
        {
          "type": "sql",
          "sql_string": "select * from internal.ad_info limit 1;",
          "connection": "pubrecdb1/mdastore1/dbadmin",
          "active": true
        }
      ]
    },
    "TaskIndex": 0
  };

let context = {
  getRemainingTimeInMillis: () => 900_000
}
console.log( await lambda_handler(event, context));
