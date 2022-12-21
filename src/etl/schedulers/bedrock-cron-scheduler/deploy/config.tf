provider "aws" {
  region	= var.region
}

resource "aws_scheduler_schedule" "bedrock_cron_scheduler-$$INSTANCE$$" {
  name       = "bedrock-cron-scheduler-$$INSTANCE$$"
  group_name = "default"

  flexible_time_window {
    mode = "OFF"
  }

  state = "DISABLED"

  schedule_expression = "cron(0/15 * * * ? *)"

  target {
    arn      = data.terraform_remote_state.process_etl_run_group.outputs.process_etl_run_group_arn
    role_arn = data.terraform_remote_state.bedrock_eventbridge_role.outputs.bedrock_eventbridge_role_arn
  }
}

output "bedrock_cron_scheduler_arn" {
  value = "${aws_scheduler_schedule.bedrock_cron_scheduler-$$INSTANCE$$.arn}"
}
