provider "aws" {
  region	= var.region
}

resource "aws_lambda_function" "bedrock_etl_backend-ejdev" {
    filename        = "function.zip"
    function_name   = "bedrock_etl_backend-ejdev"
    role            = data.terraform_remote_state.lambda_role.outputs.bedrock_api_lambda_role_arn
    handler         = "handler.lambda_handler"
    runtime         = "nodejs14.x"
    source_code_hash = filebase64sha256("function.zip")
    timeout         = 900
    vpc_config {
      subnet_ids         = var.subnet_ids
      security_group_ids = var.security_group_ids
    }
}

output "create_etl_run_map_arn" {
  value = "${aws_lambda_function.bedrock_etl_backend-ejdev.arn}"
}