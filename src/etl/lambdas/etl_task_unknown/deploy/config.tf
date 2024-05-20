provider "aws" {
  region	= var.region
}

resource "aws_lambda_function" "etl_task_unknown-$$INSTANCE$$" {
    description      = "Bedrock - ETL - Unknown Task Type" 
    filename        = "../function.zip"
    function_name   = "etl_task_unknown-$$INSTANCE$$"
    role            = data.terraform_remote_state.lambda_role.outputs.bedrock_lambda_role_arn
    handler         = "handler.lambda_handler"
    runtime         = "python3.12"
    source_code_hash = filebase64sha256("../function.zip")
    tags = {
      "coa:application" = "bedrock"
      "coa:department"  = "information-technology"
      "coa:owner"       = "jtwilson@ashevillenc.gov"
      "coa:owner-team"  = "dev"
    }
}

output "etl_task_unknown_arn" {
  value = "${aws_lambda_function.etl_task_unknown-$$INSTANCE$$.arn}"
}
