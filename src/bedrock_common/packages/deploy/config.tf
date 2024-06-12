provider "aws" {
  region = var.region
}

resource "aws_lambda_layer_version" "bedrock_packages_$$INSTANCE$$_layer" {
  filename   = "layer.zip"
  source_code_hash = filebase64sha256("layer.zip")
  layer_name = "bedrock_packages_$$INSTANCE$$_layer"
  description = <<EOF
aws-cron-parser,mssql,pg,toposort,pug,
@aws-sdk/client-s3,@aws-sdk/lib-storage,
@aws-sdk/client-lambda,@aws-sdk/client-ses
EOF
}

output "bedrock_packages_$$INSTANCE$$_layer_arn" {
  value = aws_lambda_layer_version.bedrock_packages_$$INSTANCE$$_layer.arn
}
