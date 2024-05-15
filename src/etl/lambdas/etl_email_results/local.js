import { lambda_handler } from './handler.js';
let event = {
    "success": [
        "paymentus_paper_suppression.s3",
        "paymentus_paper_suppression.mun"
    ],
    "skipped": [],
    "failure": [],
    "results": null,
    "RunSetIsGo": false
};

lambda_handler(event);

