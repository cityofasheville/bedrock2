provider "aws" {
  region	= var.region
}

resource "aws_iam_role" "bedrock-lambda-role-$$INSTANCE$$" {
    name = "bedrock-lambda-role-${var.instance}"
    assume_role_policy = file("./policy_role.json")
    tags = {
        Name          = "bedrock-lambda-role-${var.instance}"
        Application   = "bedrock"
        Environment   = "development"
        TechnicalLead = "custom-dev"
        SupportLead   = "TBD"
        Department    = "citywide"
        DataClass     = "confidential"
        Description   = "Role used by all Bedrock lambda functions."
    }
}

resource "aws_iam_policy" "secrets_manager_policy-$$INSTANCE$$" {
  name        = "secrets_manager_policy-${var.instance}"
  description = "Read secrets"
  policy = templatefile("./policy_secrets_manager.json",{})
}

resource "aws_iam_policy" "invoke_lambda_policy-$$INSTANCE$$" {
  name        = "invoke_lambda_policy-${var.instance}"
  description = "Invoke another Lambda"
  policy = templatefile("./policy_invoke_lambda.json",{})
}

resource "aws_iam_role_policy_attachment" "lambda_basic-$$INSTANCE$$" {
    role        = aws_iam_role.bedrock-lambda-role-$$INSTANCE$$.name
    policy_arn  = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_s3_access-$$INSTANCE$$" {
    role        = aws_iam_role.bedrock-lambda-role-$$INSTANCE$$.name
    policy_arn  = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

resource "aws_iam_role_policy_attachment" "lambda_ses_access-$$INSTANCE$$" {
    role        = aws_iam_role.bedrock-lambda-role-$$INSTANCE$$.name
    policy_arn  = "arn:aws:iam::aws:policy/AmazonSESFullAccess"
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_access-$$INSTANCE$$" {
    role        = aws_iam_role.bedrock-lambda-role-$$INSTANCE$$.name
    policy_arn  = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy_attachment" "secrets_manager-$$INSTANCE$$" {
    role        = aws_iam_role.bedrock-lambda-role-$$INSTANCE$$.name
    policy_arn  = aws_iam_policy.secrets_manager_policy-$$INSTANCE$$.arn
}

resource "aws_iam_role_policy_attachment" "invoke_lambda_policy-$$INSTANCE$$" {
    role        = aws_iam_role.bedrock-lambda-role-$$INSTANCE$$.name
    policy_arn  = aws_iam_policy.invoke_lambda_policy-$$INSTANCE$$.arn
}

output "bedrock_lambda_role_arn" {
  value = "${aws_iam_role.bedrock-lambda-role-$$INSTANCE$$.arn}"
}