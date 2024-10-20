provider "aws" {
  region	= var.region
}

resource "aws_lambda_function" "setup_etl_job_task-$$INSTANCE$$" {
    description      = "Bedrock - Setup ETL Job Task" 
    filename        = "../function.zip"
    function_name   = "setup_etl_job_task-$$INSTANCE$$"
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

output "setup_etl_job_task_arn" {
  value = "${aws_lambda_function.setup_etl_job_task-$$INSTANCE$$.arn}"
}
