provider "aws" {
  region	= var.region
}

resource "aws_lambda_function" "etl_email_results-$$INSTANCE$$" {
    filename        = "function.zip"
    function_name   = "etl_email_results-$$INSTANCE$$"
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
  value = "${aws_lambda_function.etl_email_results-$$INSTANCE$$.arn}"
}