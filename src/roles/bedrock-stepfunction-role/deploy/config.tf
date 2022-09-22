provider "aws" {
  region	= var.region
}

resource "aws_iam_role" "bedrock-stepfunction-role-$$BRANCH$$" {
    name = "bedrock-stepfunction-role-${var.branch}"
    assume_role_policy = file("./role.json")
    tags = {
        Name          = "bedrock-stepfunction-role"
        Application   = "bedrock"
        Environment   = "development"
        TechnicalLead = "custom-dev"
        SupportLead   = "tbd"
        Department    = "citywide"
        DataClass     = "confidential"
        Description   = "Role used by Bedrock step functions."
    }
}

resource "aws_iam_policy" "bedrock-stepfunction-policy-$$BRANCH$$" {
  name        = "bedrock-stepfunction-policy-${var.branch}"
  description = "Policy for Bedrock step functions"
  policy = templatefile("./policy.json", {
    account_num: var.account_num
  })
}

resource "aws_iam_role_policy_attachment" "test-attach-$$BRANCH$$" {
    role    = aws_iam_role.bedrock-stepfunction-role-$$BRANCH$$.name.name
    policy_arn  = aws_iam_policy.bedrock-stepfunction-policy-$$BRANCH$$.name.arn
}

output "bedrock_stepfunction_role_arn" {
  value = "${aws_iam_role.bedrock-stepfunction-role-$$BRANCH$$.name.arn}"
}

