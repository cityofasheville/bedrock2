from handler import lambda_handler
event = {
  "input": {
    "JobIsGo": True,
    "ETLJob": {
      "name": "coa_cip_project_points.lib",
      "run_group": "daily",
      "depends": [
        "coa_cip_project_points.wh"
      ],
      "etl_tasks": [
        {
          "type": "table_copy",
          "active": True,
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
        }
      ]
    },
    "TaskIndex": 0,
    "JobType": "table_copy",
    "TaskOutput": {
      "statusCode": 200,
      "body": {
        "lambda_output": "Table copied pubrecdb1/mdastore1/dbadmin internal.coa_cip_project_points"
      }
    }
  },
  "inputDetails": {
    "truncated": False
  },
  "name": "CheckTaskStatus"
}
context = {}

lambda_handler(event, context)
