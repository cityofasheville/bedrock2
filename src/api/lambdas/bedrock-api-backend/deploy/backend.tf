terraform { 
  backend "s3" {
    region = $$region$$
    bucket = $$statebucket$$
    key = "terraform/bedrock/$$INSTANCE$$/lambdas/bedrock-api-backend/terraform.tfstate"
  }
}
