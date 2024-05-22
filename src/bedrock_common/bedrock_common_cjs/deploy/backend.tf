terraform {
  backend "s3" {
    region = $$region$$
    bucket = $$statebucket$$
    key    = "terraform/bedrock/$$INSTANCE$$/layers/common/terraform.tfstate"
  }
}
