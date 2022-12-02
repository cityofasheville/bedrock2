
variable "region" {
  type          = string
  description   = "Region in which to create resources"
}

variable "aws_profile" {
  type          = string
  description   = "AWS User Profile to use"
}

variable "instance" {
  type          = string
  description   = "Name of the current instance"
}