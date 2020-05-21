# Step Function Proof of Concept

This is an example use of AWS Step Functions to execute lambda functions for the Bedrock 2 project.

## Lambdas

- Simple example of creating and executing lambdas, https://docs.aws.amazon.com/lambda/latest/dg/gettingstarted-awscli.html.
- AWS CLI Reference: https://awscli.amazonaws.com/v2/documentation/api/latest/reference/lambda/index.html

## Step Functions

- Simple example of creating a parallelized execution step function, https://docs.aws.amazon.com/step-functions/latest/dg/sample-map-state.html
- AWS CLI Reference: https://awscli.amazonaws.com/v2/documentation/api/latest/reference/stepfunctions/create-state-machine.html


## Deploying and Running this POC

### Setup

1. All the example commands need to be run from this directory
```
cd poc_step_function/
```
2. This example assumes you have the AWS CLI configured locally with proper access to Lambda and Step Functions through your IAM profile.
```
export AWS_PROFILE=myprofile
```
3. You will also need to export your AWS Account ID to use the account ID where you'd like to run the example:
```
export AWS_ACCOUNT_ID=1234567890
```

### Create Role for the Lambda Functions

```
aws iam create-role --role-name coa-lambda-example --assume-role-policy-document file://iam/lambda_trust_policy.json
```

This trust policy allows Lambda to use the role's permissions by giving the service principal lambda.amazonaws.com permission to call the AWS Security Token Service AssumeRole action.

```
aws iam attach-role-policy --role-name coa-lambda-example --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
```

The **AWSLambdaBasicExecutionRole** policy has the permissions that the function needs to write logs to CloudWatch Logs.

### Create the Lambda Functions

#### Zip them up

```
zip -rj lambda_functions/Noop/Noop.zip lambda_functions/Noop/index.js
zip -rj lambda_functions/FetchAssetMetadata/FetchAssetMetadata.zip lambda_functions/FetchAssetMetadata/index.js
```

#### Create/Upload the functions

```
aws lambda create-function --function-name CoaNoop \
--zip-file fileb://lambda_functions/Noop/Noop.zip --handler index.handler --runtime nodejs12.x \
--role arn:aws:iam::${AWS_ACCOUNT_ID}:role/coa-lambda-example
```

```
aws lambda create-function --function-name CoaFetchAssetMetadata \
--zip-file fileb://lambda_functions/FetchAssetMetadata/FetchAssetMetadata.zip --handler index.handler --runtime nodejs12.x \
--role arn:aws:iam::${AWS_ACCOUNT_ID}:role/coa-lambda-example
```

Verify they were created:

```
aws lambda list-functions --max-items 10
```

#### Test them

> LogResult data is base64 encoded. So, we decode it inline.

```
aws lambda invoke --function-name CoaNoop \
--cli-binary-format raw-in-base64-out \
--payload '{"example": "input"}' out \
--log-type Tail --query 'LogResult' \
--output text |  base64 -d
```

```
aws lambda invoke --function-name CoaFetchAssetMetadata \
--cli-binary-format raw-in-base64-out \
--payload '{"name":"ExampleAssetName","AssetMetadataS3Location":"/my/s3/location/example.json"}' out \
--log-type Tail \
--query 'LogResult' \
--output text |  base64 -d
```

### Create role for the Step Function

```
aws iam create-role --role-name coa-stepfunctions-example --assume-role-policy-document file://iam/stepfunctions_trust_policy.json
aws iam attach-role-policy --role-name coa-stepfunctions-example --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaRole
```

### Create the Step Function

```
aws stepfunctions create-state-machine --name 'StandardETL' \
--definition file://step_functions/standard_etl/standard_etl.json \
--role-arn arn:aws:iam::${AWS_ACCOUNT_ID}:role/coa-stepfunctions-example
```

Update, if needed:

```
aws stepfunctions update-state-machine \
--definition file://step_functions/standard_etl/standard_etl.json \
--state-machine-arn arn:aws:states:us-east-1:${AWS_ACCOUNT_ID}:stateMachine:StandardETL
```

#### Test it

```
aws stepfunctions start-execution --name TestExection-$(date +%s) \
--state-machine-arn arn:aws:states:us-east-1:${AWS_ACCOUNT_ID}:stateMachine:StandardETL \
--input file://step_functions/standard_etl/example_input.json
```

```
aws stepfunctions list-executions \
--state-machine-arn arn:aws:states:us-east-1:${AWS_ACCOUNT_ID}:stateMachine:StandardETL
```

### Cleanup

```
aws lambda delete-function --function-name CoaNoop
aws lambda delete-function --function-name CoaFetchAssetMetadata
```

```
aws iam detach-role-policy --role-name coa-lambda-example --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam delete-role --role-name coa-lambda-example
```

```
aws stepfunctions delete-state-machine \
--state-machine-arn arn:aws:states:us-east-1:${AWS_ACCOUNT_ID}:stateMachine:StandardETL
```

```
aws iam detach-role-policy --role-name coa-stepfunctions-example --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaRole
aws iam delete-role --role-name coa-stepfunctions-example
```
