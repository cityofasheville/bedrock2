# Set common variables for the environment. This is automatically pulled in in the root terragrunt.hcl configuration to
# feed forward to the child modules.
locals {
  name = "Acumen-interface-payroll-download"
  tags = {
    Service    = "Bedrock",
    Owner      = "CustomDevelopment",
    Department = "ITS",
  }
}
