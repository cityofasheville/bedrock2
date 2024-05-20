from handler import lambda_handler
event = {
    "ETLJob": {
      "etl_tasks": [
        {
            "type": "sftp",
            "active": True,
            "action": "list",
            "ftp_connection": "aclara_ftp",
            "ftp_path": "/AclaraLatestReads"
        }
      ]
    },
    "TaskIndex": 0
  }
context = {}

print(lambda_handler(event, context))
