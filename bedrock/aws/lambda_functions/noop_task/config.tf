provider "aws" {
  profile	= "default"
  region	= "us-east-1"
}

resource "aws_iam_role" "noop_task_role" {
    name = "noop_task_role"
    assume_role_policy = file("./role.json")
    tags = {
        tag-key = "tag-value"
    }
}

resource "aws_lambda_function" "noop_task" {
    filename        = "function.zip"
    function_name   = "noop_task"
    role            = aws_iam_role.noop_task_role.arn
    handler         = "handler.lambda_handler"
    runtime         = "python3.8"
    source_code_hash = filebase64sha256("function.zip")
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
    role        = aws_iam_role.noop_task_role.name
    policy_arn  = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}