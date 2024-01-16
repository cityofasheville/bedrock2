## Testing Lambdas locally

Some Lambdas can be tested running locally using ```sam local```. 
When deployed to AWS, the Lambdas use the code in src/bedrock_common as Lambda Layers, but sam local uses the dependencies and preinstall script in package.json for each Lambda. So to run a local test, run ```npm install``` in each script's home folder and then ```./runsam.sh``` in the test/ subdir.

### Example:
```
cd /src/etl/lambdas/etl_task_sql
npm install
cd test
./runsam.sh
```

This will use the file _test/sam_event.json_ as the input for the Lambda function.
