terraform {
  backend "s3" {
    region = $$region$$
    bucket = $$statebucket$$
    key = "terraform/bedrock/$$INSTANCE$$/roles/bedrock-api-lambda-role/terraform.tfstate"
  }
}