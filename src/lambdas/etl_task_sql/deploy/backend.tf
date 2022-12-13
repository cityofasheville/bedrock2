terraform { 
  backend "s3" {
    region = $$region$$
    bucket = $$statebucket$$
    key = "terraform/bedrock/$$INSTANCE$$/lambdas/etl_task_sql/terraform.tfstate"
  }
}
