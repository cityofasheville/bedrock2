provider "aws" {
  region	= var.region
}

resource "aws_lambda_function" "update_etl_run_map-$$INSTANCE$$" {
    description      = "Bedrock - Update ETL Run Map" 
    filename        = "../function.zip"
    function_name   = "update_etl_run_map-$$INSTANCE$$"
    role            = data.terraform_remote_state.lambda_role.outputs.bedrock_lambda_role_arn
    handler         = "handler.lambda_handler"
    runtime         = "python3.8"
    source_code_hash = filebase64sha256("../function.zip")
    tags = {
      "coa:application" = "bedrock"
      "coa:department"  = "information-technology"
      "coa:owner"       = "jtwilson@ashevillenc.gov"
      "coa:owner-team"  = "dev"
    }
}

output "update_etl_run_map_arn" {
  value = "${aws_lambda_function.update_etl_run_map-$$INSTANCE$$.arn}"
}