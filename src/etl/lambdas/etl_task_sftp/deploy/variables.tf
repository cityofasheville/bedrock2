variable "subnet_ids" {
  type          = list(string)
  description   = "Array of subnet ids"
}

variable "security_group_ids" {
  type          = list(string)
  description   = "Array of security_group_ids"
}

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
