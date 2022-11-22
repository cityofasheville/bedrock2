terraform { 
  backend "s3" {
    region = $$region$$
    bucket = $$statebucket$$
    key = "terraform/bedrock/$$BRANCH$$/lambdas/etl_task_noop/terraform_dev.tfstat"
  }
}
