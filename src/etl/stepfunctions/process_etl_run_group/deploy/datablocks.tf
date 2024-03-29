data "terraform_remote_state" "stepfunction_role" {
  backend = "s3"
  config = {
    bucket = var.statebucket
    key    = "terraform/bedrock/$$INSTANCE$$/roles/bedrock-stepfunction-role/terraform.tfstate"
    region = var.region
  }
}


data "terraform_remote_state" "create_etl_run_map_lambda" {
  backend = "s3"
  config = {
    bucket = var.statebucket
    key    = "terraform/bedrock/$$INSTANCE$$/lambdas/create_etl_run_map/terraform.tfstate"
    region = var.region
  }
}

data "terraform_remote_state" "update_etl_run_map_lambda" {
  backend = "s3"
  config = {
    bucket = var.statebucket
    key    = "terraform/bedrock/$$INSTANCE$$/lambdas/update_etl_run_map/terraform.tfstate"
    region = var.region
  }
}

data "terraform_remote_state" "setup_etl_job_task_lambda" {
  backend = "s3"
  config = {
    bucket = var.statebucket
    key    = "terraform/bedrock/$$INSTANCE$$/lambdas/setup_etl_job_task/terraform.tfstate"
    region = var.region
  }
}

data "terraform_remote_state" "check_etl_job_task_status_lambda" {
  backend = "s3"
  config = {
    bucket = var.statebucket
    key    = "terraform/bedrock/$$INSTANCE$$/lambdas/check_etl_job_task_status/terraform.tfstate"
    region = var.region
  }
}


data "terraform_remote_state" "etl_task_sql_lambda" {
  backend = "s3"
  config = {
    bucket = var.statebucket
    key    = "terraform/bedrock/$$INSTANCE$$/lambdas/etl_task_sql/terraform.tfstate"
    region = var.region
  }
}

data "terraform_remote_state" "etl_task_table_copy_lambda" {
  backend = "s3"
  config = {
    bucket = var.statebucket
    key    = "terraform/bedrock/$$INSTANCE$$/lambdas/etl_task_table_copy/terraform.tfstate"
    region = var.region
  }
}

data "terraform_remote_state" "etl_task_sftp_lambda" {
  backend = "s3"
  config = {
    bucket = var.statebucket
    key    = "terraform/bedrock/$$INSTANCE$$/lambdas/etl_task_sftp/terraform.tfstate"
    region = var.region
  }
}

data "terraform_remote_state" "etl_task_encrypt_lambda" {
  backend = "s3"
  config = {
    bucket = var.statebucket
    key    = "terraform/bedrock/$$INSTANCE$$/lambdas/etl_task_encrypt/terraform.tfstate"
    region = var.region
  }
}

data "terraform_remote_state" "etl_task_file_copy_lambda" {
  backend = "s3"
  config = {
    bucket = var.statebucket
    key    = "terraform/bedrock/$$INSTANCE$$/lambdas/etl_task_file_copy/terraform.tfstate"
    region = var.region
  }
}

data "terraform_remote_state" "etl_task_run_lambda" {
  backend = "s3"
  config = {
    bucket = var.statebucket
    key    = "terraform/bedrock/$$INSTANCE$$/lambdas/etl_task_run_lambda/terraform.tfstate"
    region = var.region
  }
}
data "terraform_remote_state" "etl_task_unknown_lambda" {
  backend = "s3"
  config = {
    bucket = var.statebucket
    key    = "terraform/bedrock/$$INSTANCE$$/lambdas/etl_task_unknown/terraform.tfstate"
    region = var.region
  }
}

data "terraform_remote_state" "etl_email_results_lambda" {
  backend = "s3"
  config = {
    bucket = var.statebucket
    key    = "terraform/bedrock/$$INSTANCE$$/lambdas/etl_email_results/terraform.tfstate"
    region = var.region
  }
}