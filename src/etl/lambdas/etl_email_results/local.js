import { lambda_handler } from './handler.js';
let event = {
    "success": [
        "fakey_mcfakesterson.s3",
        "fakey_mcfakesterson.mun"
    ],
    "skipped": [],
    "failure": [],
    "results": null,
    "RunSetIsGo": false
};

console.log(await lambda_handler(event));

