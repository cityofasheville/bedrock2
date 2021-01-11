# Set account-wide variables. These are automatically pulled in to configure the remote state bucket in the root
# terragrunt.hcl configuration.terraform
locals {
  account_name   = "enterprise-asheville"
  aws_account_id = "845346065373"
  profile        = "845346065373_AdministratorAccess"
  tags = {
    Terraform     = true
    TerraformPath = path_relative_to_include()
  }
}
