data "terraform_remote_state" "lambda_role" {
  backend = "s3"
  config = {
    bucket = var.statebucket
    key = var.rolekey
    region = var.region
  }
}

data "terraform_remote_state" "bedrock_common_$$INSTANCE$$" {
  backend = "s3"
  config = {
    bucket = "avl-tfstate-store"
    key    = "terraform/bedrock/$$INSTANCE$$/layers/common/terraform.tfstate"
    region = "us-east-1"
  }
}

data "terraform_remote_state" "bedrock_encrypt_$$INSTANCE$$" {
  backend = "s3"
  config = {
    bucket = "avl-tfstate-store"
    key    = "terraform/bedrock/$$INSTANCE$$/layers/encrypt/terraform.tfstate"
    region = "us-east-1"
  }
}