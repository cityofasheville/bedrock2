data "terraform_remote_state" "bedrock_api_backend_lambda" {
  backend = "s3"
  config = {
    bucket = var.statebucket
    key    = "terraform/bedrock/$$INSTANCE$$/lambdas/bedrock-api-backend/terraform.tfstate"
    region = var.region
  }
}
