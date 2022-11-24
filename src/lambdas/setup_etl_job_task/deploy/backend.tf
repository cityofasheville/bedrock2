terraform { 
  backend "s3" {
    region = $$region$$
    bucket = $$statebucket$$
    key = "terraform/bedrock/$$INSTANCE$$/lambdas/setup_etl_job_task/terraform_dev.tfstat"
  }
}
