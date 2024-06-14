provider "aws" {
  region	= var.region
}

resource "aws_lambda_function" "bedrock-api-backend-$$INSTANCE$$" {
    description     = "Bedrock - API Backend"
    filename        = "../function.zip"
    function_name   = "bedrock-api-backend-$$INSTANCE$$"
    role            = data.terraform_remote_state.lambda_role.outputs.bedrock_lambda_role_arn
    handler         = "handler.lambda_handler"
    runtime         = "nodejs20.x"
    source_code_hash = filebase64sha256("../function.zip")
    layers = [
      data.terraform_remote_state.bedrock_common_$$INSTANCE$$.outputs.bedrock_common_$$INSTANCE$$_layer_arn,
      data.terraform_remote_state.bedrock_packages_$$INSTANCE$$.outputs.bedrock_packages_$$INSTANCE$$_layer_arn
    ]
    timeout         = 900
    tags = {
      "coa:application" = "bedrock"
      "coa:department"  = "information-technology"
      "coa:owner"       = "jtwilson@ashevillenc.gov"
      "coa:owner-team"  = "dev"
    }
    vpc_config {
      subnet_ids         = var.subnet_ids
      security_group_ids = var.security_group_ids
    }
    environment {
      variables = {
        BEDROCK_DB_HOST = $$BEDROCK_DB_HOST$$
        STATE_MACHINE_ARN = $$STATE_MACHINE_ARN$$
      }
    }
}

output "bedrock-api-backend_arn" {
  value = "${aws_lambda_function.bedrock-api-backend-$$INSTANCE$$.arn}"
}