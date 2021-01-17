output "lambda_arn" {
  value = aws_lambda_function.new_lambda.arn
}
output "lambda_name" {
  value = aws_lambda_function.new_lambda.function_name
}
