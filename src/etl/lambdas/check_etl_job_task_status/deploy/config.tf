provider "aws" {
  region	= var.region
}

resource "aws_lambda_function" "check_etl_job_task_status-$$INSTANCE$$" {
    filename        = "function.zip"
    function_name   = "check_etl_job_task_status-$$INSTANCE$$"
    role            = data.terraform_remote_state.lambda_role.outputs.bedrock_lambda_role_arn
    handler         = "handler.lambda_handler"
    runtime         = "python3.8"
    source_code_hash = filebase64sha256("function.zip")
}

output "check_etl_job_task_status_arn" {
  value = "${aws_lambda_function.check_etl_job_task_status-$$INSTANCE$$.arn}"
}
