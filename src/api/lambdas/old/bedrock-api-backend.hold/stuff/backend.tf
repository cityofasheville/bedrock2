terraform { 
  backend "s3" {
    region = "us-east-1"
    bucket = "avl-tfstate-store"
    key = "terraform/bedrock/ejdev/api/lambdas/bedrock_api_backend/terraform.tfstate"
  }
}
