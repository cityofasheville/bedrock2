import { lambda_handler } from './handler.js';
import { readFile } from 'fs/promises';

let event = JSON.parse(await readFile("localtest.json", "utf8"));

let context = {
  getRemainingTimeInMillis: () => 900_000
}
console.log( await lambda_handler(event, context));

/*
"source_location": {
"asset": "generalledgerparameters.mun",
"tablename": "GeneralLedgerParameters",
"connection": "munis/munprod/fme_jobs",
"schemaname": "dbo"
},
"target_location": {
"asset": "general_ledger_parameters.lib",
"tablename": "general_ledger_parameters",
"connection": "pubrecdb1/mdastore1/dbadmin",
"schemaname": "internal"
}

"source_location": {
  "asset": "paymentus_paper_suppression.s3",
  "removeheaders": true,
  "path": "paymentus/",
  "filename": "ashv-paper-suppression-${YYYY}${MM}${DD}.csv",
  "connection": "s3_data_files"
},
"target_location": {
  "asset": "paymentus_paper_suppression.mun",
  "tablename": "Paymentus_Paper_Suppression_Table",
  "connection": "munis/munprod/fme_jobs",
  "schemaname": "avl"
}

"source_location": {
"asset": "coa_cip_project_points.wh",
"tablename": "coa_cip_project_points",
"connection": "gis-warehouse/coagiswarehouse/coagis",
"schemaname": "coagis"
},
"target_location": {
"asset": "coa_cip_project_points.lib",
"tablename": "coa_cip_project_points",
"connection": "pubrecdb1/mdastore1/dbadmin",
"schemaname": "internal"
}

"source_location": {
"asset": "generalledgerparameters.mun",
"tablename": "GeneralLedgerParameters",
"connection": "munis/munprod/fme_jobs",
"schemaname": "dbo"
},
"target_location": {
"asset": "general_ledger_parameters.lib",
"tablename": "general_ledger_parameters",
"connection": "pubrecdb1/mdastore1/dbadmin",
"schemaname": "internal"
}

"source_location": {
  "asset": "iran_divestment_companies.goog",
  "tab": "Bad Actors",
  "range": "A5:B",
  "filename": "Iran Divestment Companies",
  "connection": "bedrock-googlesheets",
  "spreadsheetid": "1FOmrFm5afRc_XqTeF2T-ilWtZDIYzdqKiZlPX129IQA"
},
"target_location": {
  "asset": "iran_divestment_restricted_companies.lib",
  "tablename": "iran_divestment_restricted_companies",
  "connection": "pubrecdb1/mdastore1/dbadmin",
  "schemaname": "internal"
}
  "source_location": {
    "crlf": true,
    "asset": "aclara.mun",
    "tablename": "UB_AMI_3_Aclara_Account_Feed",
    "connection": "munis/munprod/fme_jobs",
    "schemaname": "avl"
  },
  "target_location": {
    "asset": "aclara.s3",
    "path": "aclara/",
    "filename": "AccountImport_${YYYY}${MM}${DD}.imp",
    "connection": "s3_data_files"
  }

  */