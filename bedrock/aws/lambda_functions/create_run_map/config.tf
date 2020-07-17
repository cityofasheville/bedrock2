terraform {
  backend "s3" {
    bucket = "cad-tfstate-store"
    key    = "terraform/bedrock/lambda_functions/create_run_map/terraform_dev.tfstate"
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

resource "aws_lambda_function" "create_run_map" {
    filename        = "function.zip"
    function_name   = "create_run_map"
    role            = var.lambda_role
    handler         = "handler.lambda_handler"
    runtime         = "python3.8"
    source_code_hash = filebase64sha256("function.zip")
}
