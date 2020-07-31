terraform {
  backend "s3" {
    bucket = "cad-tfstate-store"
    key    = "terraform/bedrock/lambda_functions/etl_task_noop/terraform_dev.tfstate"
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

resource "aws_lambda_function" "etl_task_noop" {
    filename        = "function.zip"
    function_name   = "etl_task_noop"
    role            = var.lambda_role
    handler         = "handler.lambda_handler"
    runtime         = "python3.8"
    source_code_hash = filebase64sha256("function.zip")
}

output "etl_task_noop_arn" {
  value = "${aws_lambda_function.etl_task_noop.arn}"
}
