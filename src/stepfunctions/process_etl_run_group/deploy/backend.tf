terraform { 
  backend "s3" {
    region = $$region$$
    bucket = $$statebucket$$
    key = "terraform/bedrock/$$INSTANCE$$/stepfunctions/process_etl_run_group/terraform.tfstate"
  }
}
