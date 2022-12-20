terraform { 
  backend "s3" {
    region = $$region$$
    bucket = $$statebucket$$
    key = "terraform/bedrock/$$INSTANCE$$/schedulers/bedrock_cron_scheduler/terraform.tfstate"
  }
}
