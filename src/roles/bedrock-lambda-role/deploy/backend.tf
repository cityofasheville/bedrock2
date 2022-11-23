terraform {
  backend "s3" {
    region = $$region$$
    bucket = $$statebucket$$
    key = "terraform/bedrock/$$INSTANCE$$/roles/bedrock-lambda-role/terraform_dev.tfstat"
  }
}