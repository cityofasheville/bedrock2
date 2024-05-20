from handler import lambda_handler
event = {
    "ETLJob": {
      "etl_tasks": [
        {
          "type": "dance",
          "active": True
        }
      ]
    },
    "JobType": "dance",
    "TaskIndex": 0
  }
context = {}

lambda_handler(event, context)
