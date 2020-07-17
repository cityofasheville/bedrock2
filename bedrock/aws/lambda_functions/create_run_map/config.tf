terraform {
  backend "s3" {
    bucket = "cad-tfstate-store"
    key    = "terraform/bedrock/lambda_functions/create_run_map/terraform_dev.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  profile	= "default"
  region	= "us-east-1"
}

resource "aws_iam_role" "create_run_map_role" {
    name = "create_run_map_role"
    assume_role_policy = file("./role.json")
    tags = {
        tag-key = "tag-value"
    }
}

resource "aws_lambda_function" "create_run_map" {
    filename        = "function.zip"
    function_name   = "create_run_map"
    role            = aws_iam_role.create_run_map_role.arn
    handler         = "handler.lambda_handler"
    runtime         = "python3.8"
    source_code_hash = filebase64sha256("function.zip")
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
    role        = aws_iam_role.create_run_map_role.name
    policy_arn  = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_s3_access" {
    role        = aws_iam_role.create_run_map_role.name
    policy_arn  = "arn:aws:iam::aws:policy/AmazonS3FullAccess"
}
