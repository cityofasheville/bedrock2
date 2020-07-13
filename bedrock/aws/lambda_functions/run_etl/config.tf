provider "aws" {
  profile	= "default"
  region	= "us-east-1"
}

resource "aws_iam_role" "run_etl_role" {
    name = "run_etl_role"
    assume_role_policy = file("./role.json")
    tags = {
        tag-key = "tag-value"
    }
}

resource "aws_lambda_function" "run_etl_lambda" {
    filename        = "function.zip"
    function_name   = "run_etl_lambda"
    role            = aws_iam_role.run_etl_role.arn
    handler         = "handler.lambda_handler"
    runtime         = "python3.8"
}