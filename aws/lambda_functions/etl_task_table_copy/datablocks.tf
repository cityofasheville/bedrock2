data "terraform_remote_state" "lambda_role" {
  backend = "s3"
  config = {
    bucket = "ca-tfstate-store"
    key    = "terraform/bedrock-internal/roles/bedrock-lambda-role/terraform_dev.tfstate"
    region = "us-east-1"
  }
}
