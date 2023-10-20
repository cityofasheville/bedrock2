terraform {
  backend "s3" {
    region = $$region$$
    bucket = $$statebucket$$
    key    = "terraform/bedrock/$$INSTANCE$$/layers/packages/terraform.tfstate"
  }
}
