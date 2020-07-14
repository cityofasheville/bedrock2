provider "aws" {
  profile	= "default"
  region	= "us-east-1"
}

resource "aws_iam_role" "update_run_map_role" {
    name = "update_run_map_role"
    assume_role_policy = file("./role.json")
    tags = {
        tag-key = "tag-value"
    }
}

resource "aws_lambda_function" "update_run_map" {
    filename        = "function.zip"
    function_name   = "update_run_map"
    role            = aws_iam_role.update_run_map_role.arn
    handler         = "handler.lambda_handler"
    runtime         = "python3.8"
    source_code_hash = filebase64sha256("function.zip")
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
    role        = aws_iam_role.update_run_map_role.name
    policy_arn  = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}