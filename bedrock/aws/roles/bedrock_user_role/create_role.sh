#!/bin/bash
aws iam create-role --role-name bedrock_user_role --assume-role-policy-document file://trust_policy.json
aws iam attach-role-policy --role-name bedrock_user_role --policy-arn arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole
aws iam attach-role-policy --role-name bedrock_user_role --policy-arn arn:aws:iam::aws:policy/AmazonS3FullAccess
