
variable "region" {
  type          = string
  description   = "Region in which to create resources"
}

variable "aws_profile" {
  type          = string
  description   = "AWS User Profile to use"
}

variable "rolekey" {
  type          = string
  description   = "Lambda role to assume"
}

variable "statebucket" {
  type          = string
  description   = "S3 bucket used for backend"
}