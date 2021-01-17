variable "lambda_role" {
  default = ""
}

variable "lambda_relative_path" {
  default = "/../"
}

variable "policy_statement" {
  default = null
}

variable "deploy_file_name" {
  default = ""
}

variable "function_name" {
  default = ""
}

variable "lambda_description" {
  default = null
}

variable "service_role" {
  default = ""
}

variable "lambda_handler" {
  default = "index.handler"
}

variable "memory_size" {
  description = "128 MB to 3,008 MB, in 64 MB increments."
  default     = null
}

variable "timeout" {
  description = "up to 900 seconds (15 minutes)"
  default     = null
}

variable "source_code" {
  default = null
}

variable "runtime" {
  default = "nodejs12.x"
}

variable "lambda_security_groups" {
  type    = list(string)
  default = null
}

variable "lambda_subnets" {
  type    = list(string)
  default = null
}


variable "enviroment_vars" {
  type    = map(string)
  default = null
}

variable "tags" {
  type    = map(string)
  default = {}
}

variable "source_directory" {
  type    = string
  default = "./"
}

variable "output_directory" {
  type    = string
  default = "../"
}
