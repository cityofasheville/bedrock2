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
    bucket = $$statebucket$$
    key    = "terraform/bedrock/$$INSTANCE$$/layers/common/terraform.tfstate"
    region = "us-east-1"
  }  
}

data "terraform_remote_state" "bedrock_packages_$$INSTANCE$$" {
  backend = "s3"
  config = {
    bucket = $$statebucket$$
    key    = "terraform/bedrock/$$INSTANCE$$/layers/packages/terraform.tfstate"
    region = "us-east-1"
  }
}

data "aws_secretsmanager_secret" "secrets" {
 name = "Bedrock_API_Key"
}

data "aws_secretsmanager_secret_version" "current" {
  secret_id = data.aws_secretsmanager_secret.secrets.id
}
