terraform {
  backend "s3" {
    bucket = "cad-tfstate-store"
    key    = "terraform/bedrock/lambda_functions/setup_etl_job_task/terraform_dev.tfstate"
    region = "us-east-1"
  }
}

variable "region" {
  type          = string
  description   = "Region in which to create resources"
}

variable "lambda_role" {
  type          = string
  description   = "Role to use for the lambda function"
}

provider "aws" {
  profile	= "default"
  region	= var.region
}

resource "aws_lambda_function" "setup_etl_job_task" {
    filename        = "function.zip"
    function_name   = "setup_etl_job_task"
    role            = var.lambda_role
    handler         = "handler.lambda_handler"
    runtime         = "python3.8"
    source_code_hash = filebase64sha256("function.zip")
}

output "setup_etl_job_task_arn" {
  value = "${aws_lambda_function.setup_etl_job_task.arn}"
}
