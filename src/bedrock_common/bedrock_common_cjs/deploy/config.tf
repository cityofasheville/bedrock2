provider "aws" {
  region = var.region
}

resource "aws_lambda_layer_version" "bedrock_common_$$INSTANCE$$_layer" {
  filename   = "layer.zip"
  source_code_hash = filebase64sha256("layer.zip")
  layer_name = "bedrock_common_$$INSTANCE$$_layer"
  description = "bedrock_common"
}

output "bedrock_common_$$INSTANCE$$_layer_arn" {
  value = aws_lambda_layer_version.bedrock_common_$$INSTANCE$$_layer.arn
}
