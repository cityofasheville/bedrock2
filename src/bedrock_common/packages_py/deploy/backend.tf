terraform {
  backend "s3" {
    region = $$region$$
    bucket = $$statebucket$$
    key    = "terraform/bedrock/$$INSTANCE$$/layers/packages_py/terraform.tfstate"
  }
}
