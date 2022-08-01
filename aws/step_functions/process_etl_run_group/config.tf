terraform {
  backend "s3" {
    bucket = "ca-tfstate-store"
    key    = "terraform/bedrock/step_functions/process_etl_run_group/terraform_dev.tfstate"
    region = "us-east-1"
  }
}

variable "region" {
  type          = string
  description   = "Region in which to create resources"
}

variable "aws_profile" {
  type          = string
  description   = "AWS User Profile to use"
}

provider "aws" {
  profile	= var.aws_profile
  region = var.region
}

resource "aws_sfn_state_machine" "sfn_state_machine" {
  name     = "process_etl_run_group"
  role_arn = data.terraform_remote_state.stepfunction_role.outputs.bedrock_stepfunction_role_arn

  definition = templatefile("./states.json", {
    create_etl_run_map_arn: data.terraform_remote_state.create_etl_run_map_lambda.outputs.create_etl_run_map_arn,
    update_etl_run_map_arn: data.terraform_remote_state.update_etl_run_map_lambda.outputs.update_etl_run_map_arn,
    setup_etl_job_task_arn:         data.terraform_remote_state.setup_etl_job_task_lambda.outputs.setup_etl_job_task_arn,  
    etl_task_noop_arn:      data.terraform_remote_state.etl_task_noop_lambda.outputs.etl_task_noop_arn,
    etl_task_sql_arn:      data.terraform_remote_state.etl_task_sql_lambda.outputs.etl_task_sql_arn,
    etl_task_table_copy_arn:      data.terraform_remote_state.etl_task_table_copy_lambda.outputs.etl_task_table_copy_arn,
    etl_task_sftp_arn:      data.terraform_remote_state.etl_task_sftp_lambda.outputs.etl_task_sftp_arn,
    etl_task_encrypt_arn:   data.terraform_remote_state.etl_task_encrypt_lambda.outputs.etl_task_encrypt_arn,
    etl_task_file_copy_arn:      data.terraform_remote_state.etl_task_file_copy_lambda.outputs.etl_task_file_copy_arn,
    etl_task_unknown_arn:   data.terraform_remote_state.etl_task_unknown_lambda.outputs.etl_task_unknown_arn,
    check_etl_job_task_status_arn:  data.terraform_remote_state.check_etl_job_task_status_lambda.outputs.check_etl_job_task_status_arn,
    etl_email_results_arn:  data.terraform_remote_state.etl_email_results_lambda.outputs.etl_email_results_arn
    })
}
