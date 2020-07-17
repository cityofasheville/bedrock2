terraform {
  backend "s3" {
    bucket = "cad-tfstate-store"
    key    = "terraform/bedrock/lambda_functions/noop_task/terraform_dev.tfstate"
    region = "us-east-1"
  }
}
provider "aws" {
  profile	= "default"
  region	= "us-east-1"
}

resource "aws_lambda_function" "noop_task" {
    filename        = "function.zip"
    function_name   = "noop_task"
    role            = "arn:aws:iam::382274149743:role/bedrock-lambda-role"
    handler         = "handler.lambda_handler"
    runtime         = "python3.8"
    source_code_hash = filebase64sha256("function.zip")
}
