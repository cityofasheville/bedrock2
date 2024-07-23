data "terraform_remote_state" "lambda_role" {
  backend = "s3"
  config = {
    bucket = var.statebucket
    key = var.rolekey
    region = var.region
  }
}

data "terraform_remote_state" "bedrock_packages_py_$$INSTANCE$$" {
  backend = "s3"
  config = {
    bucket = "avl-tfstate-store"
    key    = "terraform/bedrock/$$INSTANCE$$/layers/packages_py/terraform.tfstate"
    region = "us-east-1"
  }
}