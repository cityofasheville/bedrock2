provider "aws" {
  region	= var.region
}

resource "aws_iam_role" "bedrock-api-lambda-role-$$INSTANCE$$" {
    name = "bedrock-api-lambda-role-${var.instance}"
    assume_role_policy = file("./policy_role.json")
    tags = {
      Name          = "bedrock-api-lambda-role-${var.instance}"
      "coa:application" = "bedrock"
      "coa:department"  = "information-technology"
      "coa:owner"       = "jtwilson@ashevillenc.gov"
      "coa:owner-team"  = "dev"
      Description   = "Role used by all Bedrock lambda functions."
    }
}

# Basic
resource "aws_iam_role_policy_attachment" "lambda_basic-$$INSTANCE$$" {
    role        = aws_iam_role.bedrock-api-lambda-role-$$INSTANCE$$.name
    policy_arn  = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Secrets Manager
resource "aws_iam_policy" "secrets_manager_api_policy-$$INSTANCE$$" {
  name        = "secrets_manager_api_policy-${var.instance}"
  description = "Read secrets"
  policy = templatefile("./policy_secrets_manager.json",{})
}
resource "aws_iam_role_policy_attachment" "secrets_manager-$$INSTANCE$$" {
    role        = aws_iam_role.bedrock-api-lambda-role-$$INSTANCE$$.name
    policy_arn  = aws_iam_policy.secrets_manager_api_policy-$$INSTANCE$$.arn
}

# Invoke another Lambda
resource "aws_iam_policy" "invoke_lambda_api_policy-$$INSTANCE$$" {
  name        = "invoke_lambda_api_policy-${var.instance}"
  description = "Invoke another Lambda"
  policy = templatefile("./policy_invoke_lambda.json",{})
}
resource "aws_iam_role_policy_attachment" "invoke_lambda_api_policy-$$INSTANCE$$" {
    role        = aws_iam_role.bedrock-api-lambda-role-$$INSTANCE$$.name
    policy_arn  = aws_iam_policy.invoke_lambda_api_policy-$$INSTANCE$$.arn
}

# S3
resource "aws_iam_role_policy_attachment" "lambda_s3_access-$$INSTANCE$$" {
    role        = aws_iam_role.bedrock-api-lambda-role-$$INSTANCE$$.name
    policy_arn  = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

# SES
resource "aws_iam_role_policy_attachment" "lambda_ses_access-$$INSTANCE$$" {
    role        = aws_iam_role.bedrock-api-lambda-role-$$INSTANCE$$.name
    policy_arn  = "arn:aws:iam::aws:policy/AmazonSESFullAccess"
}

# VPC
resource "aws_iam_role_policy_attachment" "lambda_vpc_access-$$INSTANCE$$" {
    role        = aws_iam_role.bedrock-api-lambda-role-$$INSTANCE$$.name
    policy_arn  = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Step Functions
resource "aws_iam_policy" "step_functions_api_policy-$$INSTANCE$$" {
  name        = "step_functions_api_policy-${var.instance}"
  description = "Execute Step Functions"
  policy = templatefile("./policy_step_functions.json",{})
}
resource "aws_iam_role_policy_attachment" "step_functions_api_policy-$$INSTANCE$$" {
  role        = aws_iam_role.bedrock-api-lambda-role-$$INSTANCE$$.name
  policy_arn  = aws_iam_policy.step_functions_api_policy-$$INSTANCE$$.arn
}

output "bedrock_lambda_role_arn" {
  value = "${aws_iam_role.bedrock-api-lambda-role-$$INSTANCE$$.arn}"
}