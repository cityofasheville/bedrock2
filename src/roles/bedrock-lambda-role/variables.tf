
variable "region" {
  type          = string
  description   = "Region in which to create resources"
}

variable "aws_profile" {
  type          = string
  description   = "AWS User Profile to use"
}

variable "branch" {
  type          = string
  description   = "Github environment or branch"
}