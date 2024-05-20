from handler import lambda_handler
event = {
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
    }
  }
context = {}

lambda_handler(event, context)
