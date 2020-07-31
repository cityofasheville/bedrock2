
variable "region" {
  type          = string
  description   = "Region in which to create resources"
}

variable "stepfunction_role" {
  type          = string
  description   = "Role to use for the state machine"
}

variable "create_etl_run_map_arn" {
  type          = string
  description   = "ARN of create_etl_run_map_arn lambda"
}
variable "update_etl_run_map_arn" {
  type          = string
  description   = "ARN of update_etl_run_map_arn lambda"
}
variable "setup_task_arn" {
  type          = string
  description   = "ARN of setup_task_arn lambda"
}
variable "etl_task_noop_arn" {
  type          = string
  description   = "ARN of etl_task_noop_arn lambda"
}
variable "etl_task_unknown_arn" {
  type          = string
  description   = "ARN of etl_task_unknown_arn lambda"
}
variable "check_task_status_arn" {
  type          = string
  description   = "ARN of check_task_status_arn lambda"
}
