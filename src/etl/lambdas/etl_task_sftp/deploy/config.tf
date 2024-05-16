provider "aws" {
  region	= var.region
}

resource "aws_lambda_function" "etl_task_sftp-$$INSTANCE$$" {
    description      = "Bedrock - ETL Task SFTP" 
    filename        = "../function.zip"
    function_name   = "etl_task_sftp-$$INSTANCE$$"
    description     = "Copies files between S3 and FTP sites."
    role            = data.terraform_remote_state.lambda_role.outputs.bedrock_lambda_role_arn
    handler         = "handler.lambda_handler"
    runtime         = "python3.8"
    source_code_hash = filebase64sha256("../function.zip")
    timeout         = 300
    tags = {
      "coa:application" = "bedrock"
      "coa:department"  = "information-technology"
      "coa:owner"       = "jtwilson@ashevillenc.gov"
      "coa:owner-team"  = "dev"
    }
    vpc_config {
      subnet_ids         = var.subnet_ids
      security_group_ids = var.security_group_ids
    }
}

output "etl_task_sftp_arn" {
  value = "${aws_lambda_function.etl_task_sftp-$$INSTANCE$$.arn}"
}
