from handler import lambda_handler
event = {
    "JobIsGo": True,
    "ETLJob": {
      "name": "everbridge.emp.ftp",
      "run_group": "daily",
      "depends": [
      ],
      "etl_tasks": [
        {
          "type": "file_copy",
          "active": True,
          "source_location": {
            "asset": "everbridge.emp.s3",
            "path": "everbridge/",
            "filename": "avl.PR_City_Employees_Everbridge.csv",
            "connection": "s3_data_files"
          },
          "target_location": {
            "asset": "everbridge.emp.fake.s3",
            "path": "everbridge/",
            "filename": "avl.PR_City_Employees_Everbridge.copy.csv",
            "connection": "s3_data_files"
          }
        }
      ]
    },
    "TaskIndex": 0,
    "JobType": "file_copy"
  }
context = {}

lambda_handler(event, context)
