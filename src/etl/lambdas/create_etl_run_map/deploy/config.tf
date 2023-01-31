provider "aws" {
  region	= var.region
}

resource "aws_lambda_function" "create_etl_run_map-$$INSTANCE$$" {
    filename        = "function.zip"
    function_name   = "create_etl_run_map-$$INSTANCE$$"
    role            = data.terraform_remote_state.lambda_role.outputs.bedrock_lambda_role_arn
    handler         = "handler.lambda_handler"
    runtime         = "nodejs16.x"
    source_code_hash = filebase64sha256("function.zip")
    timeout         = 900
    vpc_config {
      subnet_ids         = var.subnet_ids
      security_group_ids = var.security_group_ids
    }
}

output "create_etl_run_map_arn" {
  value = "${aws_lambda_function.create_etl_run_map-$$INSTANCE$$.arn}"
}