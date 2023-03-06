#!/usr/bin/env python3
import json
import boto3
 
# Define the client to interact with AWS Lambda
client = boto3.client('lambda')
 
def lambda_handler(event,context):
    TaskIndex = event["TaskIndex"]
    FunctionName = event["ETLJob"]["etl_tasks"][TaskIndex]["lambda_arn"]
    response = client.invoke(
        FunctionName = FunctionName,
        InvocationType = 'RequestResponse',
        Payload = json.dumps(event)
    )
    print(response)
    responseFromChild = json.load(response['Payload'])
 
    return (responseFromChild)
