terraform {
  backend "s3" {
    region = $$region$$
    bucket = $$statebucket$$
    key = "terraform/bedrock/$$INSTANCE$$/roles/bedrock-stepfunction-role/terraform_dev.tfstat"
  }
}