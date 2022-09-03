provider "aws" {
  region	= var.region
}

resource "aws_iam_role" "bedrock-lambda-role-$$BRANCH$$" {
    name = "bedrock-lambda-role-${var.branch}"
    assume_role_policy = file("./policy_role.json")
    tags = {
        Name          = "bedrock-lambda-role-${var.branch}"
        Application   = "bedrock"
        Environment   = "development"
        TechnicalLead = "custom-dev"
        SupportLead   = "tbd"
        Department    = "citywide"
        DataClass     = "confidential"
        Description   = "Role used by all Bedrock lambda functions."
    }
}

resource "aws_iam_policy" "secrets_manager_policy-$$BRANCH$$" {
  name        = "secrets_manager_policy-${var.branch}"
  description = "Read secrets"
  policy = templatefile("./policy_secrets_manager.json",{})
}

resource "aws_iam_policy" "invoke_lambda_policy-$$BRANCH$$" {
  name        = "invoke_lambda_policy-${var.branch}"
  description = "Invoke another Lambda"
  policy = templatefile("./policy_invoke_lambda.json",{})
}

resource "aws_iam_role_policy_attachment" "lambda_basic-$$BRANCH$$" {
    role        = aws_iam_role.bedrock-lambda-role-$$BRANCH$$.name
    policy_arn  = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_s3_access-$$BRANCH$$" {
    role        = aws_iam_role.bedrock-lambda-role-$$BRANCH$$.name
    policy_arn  = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

resource "aws_iam_role_policy_attachment" "lambda_ses_access-$$BRANCH$$" {
    role        = aws_iam_role.bedrock-lambda-role-$$BRANCH$$.name
    policy_arn  = "arn:aws:iam::aws:policy/AmazonSESFullAccess"
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_access-$$BRANCH$$" {
    role        = aws_iam_role.bedrock-lambda-role-$$BRANCH$$.name
    policy_arn  = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_role_policy_attachment" "secrets_manager-$$BRANCH$$" {
    role        = aws_iam_role.bedrock-lambda-role-$$BRANCH$$.name
    policy_arn  = aws_iam_policy.secrets_manager_policy-$$BRANCH$$.arn
}

resource "aws_iam_role_policy_attachment" "invoke_lambda_policy-$$BRANCH$$" {
    role        = aws_iam_role.bedrock-lambda-role-$$BRANCH$$.name
    policy_arn  = aws_iam_policy.invoke_lambda_policy-$$BRANCH$$.arn
}

output "bedrock_lambda_role_arn" {
  value = "${aws_iam_role.bedrock-lambda-role-$$BRANCH$$.arn}"
}