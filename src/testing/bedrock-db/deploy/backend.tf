terraform {
  backend "s3" {
    region = $$region$$
    bucket = $$statebucket$$
    key = "terraform/bedrock/$$INSTANCE$$/testing/bedrock-db/terraform_dev.tfstat"
  }
}