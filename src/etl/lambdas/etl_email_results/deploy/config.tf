provider "aws" {
  region	= var.region
}

resource "aws_lambda_function" "etl_email_results-$$INSTANCE$$" {
    description      = "Bedrock - Email Results" 
    filename        = "../function.zip"
    function_name   = "etl_email_results-$$INSTANCE$$"
    role            = data.terraform_remote_state.lambda_role.outputs.bedrock_lambda_role_arn
    handler         = "handler.lambda_handler"
    runtime         = "nodejs20.x"
    source_code_hash = filebase64sha256("../function.zip")
    layers = [
      data.terraform_remote_state.bedrock_packages_$$INSTANCE$$.outputs.bedrock_packages_$$INSTANCE$$_layer_arn
    ]
    timeout         = 900
    memory_size     = 256
    tags = {
      "coa:application" = "bedrock"
      "coa:department"  = "information-technology"
      "coa:owner"       = "jtwilson@ashevillenc.gov"
      "coa:owner-team"  = "dev"
    }
    environment {
      variables = {
          "EMAIL_RECIPIENT" = $$EMAIL_RECIPIENT$$
          "EMAIL_SENDER"    = $$EMAIL_SENDER$$
      }
    }
}

output "etl_email_results_arn" {
  value = "${aws_lambda_function.etl_email_results-$$INSTANCE$$.arn}"
}