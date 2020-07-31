terraform {
  backend "s3" {
    bucket = "cad-tfstate-store"
    key    = "terraform/bedrock/lambda_functions/check_etl_job_task_status/terraform_dev.tfstate"
    region = "us-east-1"
  }
}

variable "region" {
  type          = string
  description   = "Region in which to create resources"
}

provider "aws" {
  profile	= "default"
  region	= var.region
}

resource "aws_lambda_function" "check_etl_job_task_status" {
    filename        = "function.zip"
    function_name   = "check_etl_job_task_status"
    role            = data.terraform_remote_state.lambda_role.outputs.bedrock_lambda_role_arn
    handler         = "handler.lambda_handler"
    runtime         = "python3.8"
    source_code_hash = filebase64sha256("function.zip")
}

output "check_etl_job_task_status_arn" {
  value = "${aws_lambda_function.check_etl_job_task_status.arn}"
}
