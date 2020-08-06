
aws lambda invoke   \
    --function-name etl_task_sql   \
    --payload '{"JobIsGo": true,"ETLJob": {"name": "fake_weekly_asset","depends": [],"path": "store/assets/fake_weekly_asset/fake_weekly_asset.json","run_group": "tues_night","etl_tasks": [{"type": "sql","file": "update_test.sql","db": "library","active": true}]},"TaskIndex": 0,"JobType": "sql"}'   \
    --cli-binary-format raw-in-base64-out   \
    response.json
