terraform {
  backend "s3" {
    bucket = "ca-tfstate-store"
    key    = "terraform/bedrock-internal/roles/bedrock-eventbridge-role/terraform_dev.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  profile	= var.aws_profile
  region	= var.region
}

variable "region" {
  type          = string
  description   = "Region in which to create resources"
}

variable "aws_profile" {
  type          = string
  description   = "AWS User Profile to use"
}

variable "state_machine_arn" {
  type          = string
  description   = "state_machine_arn"
}

resource "aws_iam_role" "bedrock-eventbridge-role" {
    name = "bedrock-eventbridge-role"
    assume_role_policy = file("./role.json")
    tags = {
        Name          = "bedrock-eventbridge-role"
        Application   = "bedrock"
        Environment   = "development"
        TechnicalLead = "custom-dev"
        SupportLead   = "tbd"
        Department    = "citywide"
        DataClass     = "confidential"
        Description   = "Role used by Bedrock eventbridge step function events."
    }
}

resource "aws_iam_policy" "bedrock-eventbridge-policy" {
  name        = "bedrock-eventbridge-policy"
  description = "Policy for Bedrock eventbridge step function events"
  policy = templatefile("./policy.json", {
    state_machine_arn: var.state_machine_arn
  })
}

resource "aws_iam_role_policy_attachment" "test-attach" {
    role    = aws_iam_role.bedrock-eventbridge-role.name
    policy_arn  = aws_iam_policy.bedrock-eventbridge-policy.arn
}

output "bedrock_eventbridge_role_arn" {
  value = "${aws_iam_role.bedrock-eventbridge-role.arn}"
}

