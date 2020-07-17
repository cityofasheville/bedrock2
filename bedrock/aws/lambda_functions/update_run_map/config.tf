terraform {
  backend "s3" {
    bucket = "cad-tfstate-store"
    key    = "terraform/bedrock/lambda_functions/update_run_map/terraform_dev.tfstate"
    region = "us-east-1"
  }
}

variable "region" {
  type          = string
  description   = "Region in which to create resources"
}

variable "stepfunction_role" {
  type          = string
  description   = "Role to use for the state machine"
}

provider "aws" {
  profile	= "default"
  region	= "us-east-1"
}

resource "aws_lambda_function" "update_run_map" {
    filename        = "function.zip"
    function_name   = "update_run_map"
    role            = var.lambda_role
    handler         = "handler.lambda_handler"
    runtime         = "python3.8"
    source_code_hash = filebase64sha256("function.zip")
}

