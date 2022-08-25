
variable "region" {
  type          = string
  description   = "Region in which to create resources"
}

variable "aws_profile" {
  type          = string
  description   = "AWS User Profile to use"
}

variable "s3_bucket_arn" {
  type          = string
  description   = "ARN of the S3 Bucket that the key is allowed to decrypt"
}

variable "s3_key_arn" {
  type          = string
  description   = "ARN of KMS key to decrypt S3"
}
