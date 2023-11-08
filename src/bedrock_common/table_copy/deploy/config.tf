provider "aws" {
  region = var.region
}

resource "aws_lambda_layer_version" "bedrock_table_copy_$$INSTANCE$$_layer" {
  filename   = "layer.zip"
  source_code_hash = filebase64sha256("layer.zip")
  layer_name = "bedrock_table_copy_$$INSTANCE$$_layer"
  description = "csv,googleapis,multistream,pg-copy-streams"
}

output "bedrock_table_copy_$$INSTANCE$$_layer_arn" {
  value = aws_lambda_layer_version.bedrock_table_copy_$$INSTANCE$$_layer.arn
}
