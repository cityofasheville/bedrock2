provider "aws" {
  region	= var.region
}

resource "aws_lambda_function" "create_tables_bedrock-db-$$INSTANCE$$" {
  environment {
    variables = {
      DB_HOST = aws_db_instance.bedrock-db$$INSTANCE$$.endpoint
      DB_USERNAME = aws_db_instance.bedrock-db$$INSTANCE$$.username
      DB_PASSWORD = aws_db_instance.bedrock-db$$INSTANCE$$.password
    }
  }
}

data "aws_lambda_invocation" "bedrock_invocation" {
  function_name = aws_lambda_function.create_tables_bedrock-db-$$INSTANCE$$.function_name
}