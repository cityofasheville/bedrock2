provider "aws" {
  region = var.region
}

resource "aws_lambda_layer_version" "bedrock_encrypt_$$INSTANCE$$_layer" {
  filename   = "layer.zip"
  source_code_hash = filebase64sha256("layer.zip")
  layer_name = "bedrock_encrypt_$$INSTANCE$$_layer"
  description = <<EOF
openpgp,
@aws-sdk/client-s3,@aws-sdk/lib-storage,
EOF
}

output "bedrock_encrypt_$$INSTANCE$$_layer_arn" {
  value = aws_lambda_layer_version.bedrock_encrypt_$$INSTANCE$$_layer.arn
}
