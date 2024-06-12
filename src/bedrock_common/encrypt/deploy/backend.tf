terraform {
  backend "s3" {
    region = $$region$$
    bucket = $$statebucket$$
    key    = "terraform/bedrock/$$INSTANCE$$/layers/encrypt/terraform.tfstate"
  }
}
