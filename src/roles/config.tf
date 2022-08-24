terraform {
  backend "s3" {
    bucket = "ca-tfstate-store"
    key    = "terraform/bedrock-new/roles/bedrock-lambda-role/terraform_dev.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  profile	= var.aws_profile
  region	= var.region
}

resource "aws_iam_role" "bedrock-lambda-role" {
    name = "bedrock-lambda-role"
    assume_role_policy = file("./role.json")
    tags = {
        Name          = "bedrock-lambda-role"
        Application   = "bedrock"
        Environment   = "development"
        TechnicalLead = "custom-dev"
        SupportLead   = "tbd"
        Department    = "citywide"
        DataClass     = "confidential"
        Description   = "Role used by all Bedrock lambda functions."
    }
}
##################
# List of Policies
##################

resource "aws_iam_role_policy_attachment" "lambda_basic" {
    role        = aws_iam_role.bedrock-lambda-role.name
    policy_arn  = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_s3_access" {
    role        = aws_iam_role.bedrock-lambda-role.name
    policy_arn  = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}

resource "aws_iam_role_policy_attachment" "lambda_ses_access" {
    role        = aws_iam_role.bedrock-lambda-role.name
    policy_arn  = "arn:aws:iam::aws:policy/AmazonSESFullAccess"
}

resource "aws_iam_role_policy_attachment" "lambda_vpc_access" {
    role        = aws_iam_role.bedrock-lambda-role.name
    policy_arn  = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

resource "aws_iam_policy" "decrypt_policy" {
  name        = "Decrypt_S3_managed-data-assets"
  description = "Decrypt files in S3 bucket managed-data-assets"
  policy = templatefile("./decrypt_policy.json", {
    s3_key_arn: var.s3_key_arn
    s3_bucket_arn: var.s3_bucket_arn
  })
}

resource "aws_iam_policy" "secrets_manager_policy" {
  name        = "secrets_manager_policy"
  description = "Read secrets"
  policy = templatefile("./secrets_manager_policy.json",{})
}

resource "aws_iam_policy" "invoke_lambda_policy" {
  name        = "invoke_lambda_policy"
  description = "Invoke another Lambda"
  policy = templatefile("./invoke_lambda_policy.json",{})
}

resource "aws_iam_role_policy_attachment" "decrypt_s3" {
  role       = aws_iam_role.bedrock-lambda-role.name
  policy_arn =  aws_iam_policy.decrypt_policy.arn
}

resource "aws_iam_role_policy_attachment" "secrets_manager" {
    role        = aws_iam_role.bedrock-lambda-role.name
    policy_arn  = aws_iam_policy.secrets_manager_policy.arn
}

resource "aws_iam_role_policy_attachment" "invoke_lambda_policy" {
    role        = aws_iam_role.bedrock-lambda-role.name
    policy_arn  = aws_iam_policy.invoke_lambda_policy.arn
}

output "bedrock_lambda_role_arn" {
  value = "${aws_iam_role.bedrock-lambda-role.arn}"
}