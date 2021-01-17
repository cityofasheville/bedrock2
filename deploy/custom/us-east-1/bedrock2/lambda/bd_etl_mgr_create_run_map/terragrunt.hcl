locals {
  # Automatically load environment-level variables
  service_vars     = read_terragrunt_config(find_in_parent_folders("service.hcl"))
  environment_vars = read_terragrunt_config(find_in_parent_folders("env.hcl"))
  account_vars     = read_terragrunt_config(find_in_parent_folders("account.hcl"))

  # Extract out common variables for reuse
  name         = local.service_vars.locals.name
  environment  = local.environment_vars.locals.environment
  account_name = local.account_vars.locals.account_name
}

terraform {
  source = "${get_terragrunt_dir()}/../../../../modules//lambda"
}

include {
  path = find_in_parent_folders()
}

inputs = {

  filename         = "payroll-download.zip"
  function_name    = "payroll-download"
  lambda_role      = "payroll_download_execution_role"
  handler          = "index.handler"
  runtime          = "nodejs12.x"
  source_directory = "/Users/jon/Documents/acumen-interface/payroll_download" //change for the computer that is deploying
  output_directory = "/Users/jon/Documents/acumen-interface"                  //change for the computer that is deploying
  timeout          = 900
  lambda_security_groups = ["sg-028de63b6fa395a1f"]
  lambda_subnets    = ["subnet-0511232cab631400b"]
  enviroment_vars = merge({
    APIURL            = "https://22.acumenwfm.com/asheville/PutdataAPI/"
    acumen_username   = "COAAPI"
    acumen_password   = "Api201027"
    payroll_endpoint  = "api/TimeDetail"
    DB_USERNAME       = "FME_Jobs"
    DB_PASSWORD       = "ETL_Yeah!@#"
    DB_SERVER         = "10.20.1.17"
    DB_DATABASE       = "muntest"
    PAYROLL_TABLENAME = "avl.acumen_payroll_import"
    PAYROLL_PROCEDURE = "avl.sp_acumen_insert_time"
    STAFF_VIEWNAME    = "avl.acumen_staff"

  })


  tags = merge(
    local.account_vars.locals.tags,
    local.service_vars.locals.tags,
    local.environment_vars.locals.tags,
    {
      Name      = local.name,
      DataClass = "Sensitive"
    }
  )
}
