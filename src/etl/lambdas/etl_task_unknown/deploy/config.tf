provider "aws" {
  region	= var.region
}

resource "aws_lambda_function" "etl_task_unknown-$$INSTANCE$$" {
    filename        = "function.zip"
    function_name   = "etl_task_unknown-$$INSTANCE$$"
    role            = data.terraform_remote_state.lambda_role.outputs.bedrock_lambda_role_arn
    handler         = "handler.lambda_handler"
    runtime         = "python3.8"
    source_code_hash = filebase64sha256("function.zip")
}

output "etl_task_unknown_arn" {
  value = "${aws_lambda_function.etl_task_unknown-$$INSTANCE$$.arn}"
}
