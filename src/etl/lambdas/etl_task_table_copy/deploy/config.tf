provider "aws" {
  region	= var.region
}

resource "aws_lambda_function" "etl_task_table_copy-$$INSTANCE$$" {
    filename        = "function.zip"
    function_name   = "etl_task_table_copy-$$INSTANCE$$"
    role            = data.terraform_remote_state.lambda_role.outputs.bedrock_lambda_role_arn
    handler         = "handler.lambda_handler"
    runtime         = "nodejs16.x"
    source_code_hash = filebase64sha256("function.zip")
    timeout         = 900
    memory_size     = 256
    vpc_config {
      subnet_ids         = var.subnet_ids
      security_group_ids = var.security_group_ids
    }
}

output "etl_task_table_copy_arn" {
  value = "${aws_lambda_function.etl_task_table_copy-$$INSTANCE$$.arn}"
}
