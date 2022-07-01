terraform {
  backend "s3" {
    bucket = "ca-tfstate-store"
    key    = "terraform/bedrock/lambda_functions/etl_task_encrypt/terraform_dev.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  profile	= var.aws_profile
  region	= var.region
}

resource "aws_lambda_function" "etl_task_encrypt" {
    filename        = "function.zip"
    function_name   = "etl_task_encrypt"
    description     = "Encrypts files read from and write back to S3."
    role            = data.terraform_remote_state.lambda_role.outputs.bedrock_lambda_role_arn
    handler         = "handler.lambda_handler"
    runtime         = "nodejs14.x"
    source_code_hash = filebase64sha256("function.zip")
    timeout         = 900
    vpc_config {
      subnet_ids         = var.subnet_ids
      security_group_ids = var.security_group_ids
    }
}

output "etl_task_encrypt_arn" {
  value = "${aws_lambda_function.etl_task_encrypt.arn}"
}