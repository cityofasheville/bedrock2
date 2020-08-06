data "terraform_remote_state" "stepfunction_role" {
  backend = "s3"
  config = {
    bucket = "ca-tfstate-store"
    key    = "terraform/bedrock-internal/roles/bedrock-stepfunction-role/terraform_dev.tfstate"
    region = "us-east-1"
  }
}

data "terraform_remote_state" "create_etl_run_map_lambda" {
  backend = "s3"
  config = {
    bucket = "ca-tfstate-store"
    key    = "terraform/bedrock/lambda_functions/create_etl_run_map/terraform_dev.tfstate"
    region = "us-east-1"
  }
}

data "terraform_remote_state" "update_etl_run_map_lambda" {
  backend = "s3"
  config = {
    bucket = "ca-tfstate-store"
    key    = "terraform/bedrock/lambda_functions/update_etl_run_map/terraform_dev.tfstate"
    region = "us-east-1"
  }
}

data "terraform_remote_state" "setup_etl_job_task_lambda" {
  backend = "s3"
  config = {
    bucket = "ca-tfstate-store"
    key    = "terraform/bedrock/lambda_functions/setup_etl_job_task/terraform_dev.tfstate"
    region = "us-east-1"
  }
}

data "terraform_remote_state" "check_etl_job_task_status_lambda" {
  backend = "s3"
  config = {
    bucket = "ca-tfstate-store"
    key    = "terraform/bedrock/lambda_functions/check_etl_job_task_status/terraform_dev.tfstate"
    region = "us-east-1"
  }
}

data "terraform_remote_state" "etl_task_noop_lambda" {
  backend = "s3"
  config = {
    bucket = "ca-tfstate-store"
    key    = "terraform/bedrock/lambda_functions/etl_task_noop/terraform_dev.tfstate"
    region = "us-east-1"
  }
}

data "terraform_remote_state" "etl_task_sql_lambda" {
  backend = "s3"
  config = {
    bucket = "ca-tfstate-store"
    key    = "terraform/bedrock/lambda_functions/etl_task_sql/terraform_dev.tfstate"
    region = "us-east-1"
  }
}

data "terraform_remote_state" "etl_task_table_copy_lambda" {
  backend = "s3"
  config = {
    bucket = "ca-tfstate-store"
    key    = "terraform/bedrock/lambda_functions/etl_task_table_copy/terraform_dev.tfstate"
    region = "us-east-1"
  }
}

data "terraform_remote_state" "etl_task_unknown_lambda" {
  backend = "s3"
  config = {
    bucket = "ca-tfstate-store"
    key    = "terraform/bedrock/lambda_functions/etl_task_unknown/terraform_dev.tfstate"
    region = "us-east-1"
  }
}
