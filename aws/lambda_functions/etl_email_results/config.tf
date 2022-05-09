terraform {
  backend "s3" {
    bucket = "ca-tfstate-store"
    key    = "terraform/bedrock/lambda_functions/etl_email_results/terraform_dev.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  profile	= var.aws_profile
  region	= var.region
}

resource "aws_lambda_function" "etl_email_results" {
    filename        = "function.zip"
    function_name   = "etl_email_results"
    role            = data.terraform_remote_state.lambda_role.outputs.bedrock_lambda_role_arn
    handler         = "handler.lambda_handler"
    runtime         = "nodejs14.x"
    source_code_hash = filebase64sha256("function.zip")
    timeout         = 30
    memory_size     = 256
    environment {
      variables = {
          "EMAIL_RECIPIENT_JSON" = jsonencode(
                ["gisadmins@ashevillenc.gov","jtwilson@ashevillenc.gov","ejackson@ashevillenc.gov"]
            )
          "EMAIL_SENDER"         = "asheville_notifications@ashevillenc.gov"
      }
    }
}

output "etl_email_results_arn" {
  value = "${aws_lambda_function.etl_email_results.arn}"
}