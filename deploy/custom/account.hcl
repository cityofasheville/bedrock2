# Set account-wide variables. These are automatically pulled in to configure the remote state bucket in the root
# terragrunt.hcl configuration.terraform
locals {
  account_name   = "custom-asheville"
  aws_account_id = "518970837364"
  profile        = "518970837364_SystemAdministrator"
  tags = {
    Terraform     = true
    TerraformPath = path_relative_to_include()
  }
}
