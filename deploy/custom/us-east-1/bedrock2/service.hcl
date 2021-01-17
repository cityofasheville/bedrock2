# Set common variables for the environment. This is automatically pulled in in the root terragrunt.hcl configuration to
# feed forward to the child modules.
locals {
  name = "Bedrock2"
  tags = {
    Service    = "Bedrock2",
    Owner      = "CustomDevelopment",
    Department = "ITS",
  }
}
