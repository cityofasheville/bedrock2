terraform { 
  backend "s3" {
    region = $$region$$
    bucket = $$statebucket$$
    key = "terraform/bedrock/$$INSTANCE$$/lambdas/etl_email_results/terraform_dev.tfstat"
  }
}
