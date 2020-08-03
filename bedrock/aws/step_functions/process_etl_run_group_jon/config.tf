terraform {
  backend "s3" {
    bucket = "cad-tfstate-store"
    key    = "terraform/bedrock/step_functions/process_etl_run_group_jon/terraform_dev.tfstate"
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
  region = var.region
}

resource "aws_sfn_state_machine" "sfn_state_machine_jon" {
  name     = "process_etl_run_group_jon"
  role_arn = var.stepfunction_role

  definition = file("./states_jon.json")
}