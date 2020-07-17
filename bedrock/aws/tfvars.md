# Mac/Linux environment variables

export TF_VAR_region=us-east-1
export TF_VAR_lambda_role=arn:aws:iam::382274149743:role/bedrock-lambda-role
export TF_VAR_stepfunction_role=arn:aws:iam::382274149743:role/bedrock-stepfunction-role

# Windows environment variables
$env:TF_VAR_region = 'us-east-1'
$env:TF_VAR_lambda_role = 'arn:aws:iam::382274149743:role/bedrock-lambda-role'
$env:TF_VAR_stepfunction_role = 'arn:aws:iam::382274149743:role/bedrock-stepfunction-role'
