terraform {
  backend "s3" {
    bucket = "cad-tfstate-store"
    key    = "terraform/bedrock/step_functions/process_etl_run_group/terraform_dev.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  profile	= "default"
  region = var.region
}

resource "aws_sfn_state_machine" "sfn_state_machine" {
  name     = "process_etl_run_group"
  role_arn = var.stepfunction_role

  definition = file("./states.json")
}

resource "aws_sfn_state_machine" "sfn_state_machine_dev" {
  name     = "process_etl_run_group_dev"
  role_arn = var.stepfunction_role

  definition = templatefile("./states_dev.json", {
    create_etl_run_map_arn: var.create_etl_run_map_arn,
    update_etl_run_map_arn: var.update_etl_run_map_arn,
    setup_task_arn:         var.setup_task_arn,  
    etl_task_noop_arn:      var.etl_task_noop_arn,
    etl_task_unknown_arn:   var.etl_task_unknown_arn,
    check_task_status_arn:  var.check_task_status_arn
    })
}
