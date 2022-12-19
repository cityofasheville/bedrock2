provider "aws" {
  region	= var.region
}

resource "aws_lambda_function" "create_etl_run_map-$$INSTANCE$$" {
    filename        = "function.zip"
    function_name   = "create_etl_run_map-$$INSTANCE$$"
    role            = data.terraform_remote_state.lambda_role.outputs.bedrock_lambda_role_arn
    handler         = "handler.lambda_handler"
    runtime         = "nodejs14.x"
    source_code_hash = filebase64sha256("function.zip")
}

output "create_etl_run_map_arn" {
  value = "${aws_lambda_function.create_etl_run_map-$$INSTANCE$$.arn}"
}