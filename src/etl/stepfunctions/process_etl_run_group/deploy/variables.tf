variable "region" {
  type          = string
  description   = "Region in which to create resources"
}

variable "statebucket" {
  type          = string
  description   = "S3 bucket used for backend"
}
