terraform {
  backend "s3" {
    region = $$region$$
    bucket = $$statebucket$$
    key = "terraform/bedrock/$$INSTANCE$$/testing/bedrock-db-data/terraform_dev.tfstat"
  }
}