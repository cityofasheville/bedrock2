
variable "region" {
  type          = string
  description   = "Region in which to create resources"
}

variable "rolekey" {
  type          = string
  description   = "Lambda role to assume"
}

variable "statebucket" {
  type          = string
  description   = "S3 bucket used for backend"
}