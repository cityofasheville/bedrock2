provider "aws" {
  region	= var.region
}

resource "aws_apigatewayv2_api" "aws_apigatewayv2_api-$$INSTANCE$$" {
  name          = "bedrock-api-$$INSTANCE$$"
  protocol_type = "HTTP"
  target        = data.terraform_remote_state.bedrock_api_backend_lambda.outputs.bedrock-api-backend_arn
  cors_configuration {
    allow_origins = ["*"]
    allow_headers     = ["*"]
    allow_methods     = ["POST", "GET", "PUT", "OPTIONS"]
    expose_headers    = ["*"]
    max_age           = 300
  }
}

resource "aws_lambda_permission" "apigw-$$INSTANCE$$" {
  action        = "lambda:InvokeFunction"
	function_name = data.terraform_remote_state.bedrock_api_backend_lambda.outputs.bedrock-api-backend_arn
	principal     = "apigateway.amazonaws.com"

	source_arn = "${aws_apigatewayv2_api.aws_apigatewayv2_api-$$INSTANCE$$.execution_arn}/*/*"
}
