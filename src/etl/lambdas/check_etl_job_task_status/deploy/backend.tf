terraform { 
  backend "s3" {
    region = $$region$$
    bucket = $$statebucket$$
    key = "terraform/bedrock/$$INSTANCE$$/lambdas/check_etl_job_task_status/terraform.tfstate"
  }
}
