data "terraform_remote_state" "bedrock_eventbridge_role" {
  backend = "s3"
  config = {
    bucket = var.statebucket
    key = "terraform/bedrock/$$INSTANCE$$/roles/bedrock-eventbridge-role/terraform.tfstate"
    region = var.region
  }
}

data "terraform_remote_state" "process_etl_run_group" {
  backend = "s3"
  config = {
    bucket = var.statebucket
    key = "terraform/bedrock/$$INSTANCE$$/stepfunctions/process_etl_run_group/terraform.tfstate"
    region = var.region
  }
}

