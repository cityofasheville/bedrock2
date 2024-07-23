provider "aws" {
  region	= var.region
}

resource "aws_lambda_function" "etl_task_sftp-$$INSTANCE$$" {
    description      = "Bedrock - Copies files between S3 and FTP sites" 
    filename        = "../function.zip"
    function_name   = "etl_task_sftp-$$INSTANCE$$"
    role            = data.terraform_remote_state.lambda_role.outputs.bedrock_lambda_role_arn
    handler         = "handler.lambda_handler"
    runtime         = "python3.12"
    source_code_hash = filebase64sha256("../function.zip")
    layers = [
      data.terraform_remote_state.bedrock_packages_py_$$INSTANCE$$.outputs.bedrock_packages_py_$$INSTANCE$$_layer_arn,
    ]
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
