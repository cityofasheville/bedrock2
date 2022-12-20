data "terraform_remote_state" "process_etl_run_group" {
  backend = "s3"
  config = {
    bucket = var.statebucket
    key = "terraform/bedrock/$$INSTANCE$$/stepfunctions/process_etl_run_group/terraform.tfstate"
    region = var.region
  }
}
