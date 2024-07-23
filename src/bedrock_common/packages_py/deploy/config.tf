provider "aws" {
  region = var.region
}

resource "aws_lambda_layer_version" "bedrock_packages_py_$$INSTANCE$$_layer" {
  filename   = "layer.zip"
  source_code_hash = filebase64sha256("layer.zip")
  layer_name = "bedrock_packages_py_$$INSTANCE$$_layer"
  description = <<EOF
boto3
paramiko
pysmb
wheel
EOF
}

output "bedrock_packages_py_$$INSTANCE$$_layer_arn" {
  value = aws_lambda_layer_version.bedrock_packages_py_$$INSTANCE$$_layer.arn
}
