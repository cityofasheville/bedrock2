provider "aws" {
  region	= var.region
}

resource "aws_iam_role" "bedrock-eventbridge-role-$$INSTANCE$$" {
    name = "bedrock-eventbridge-role-$$INSTANCE$$"
    assume_role_policy = file("./role.json")
    tags = {
        Name          = "bedrock-eventbridge-role-$$INSTANCE$$"
        Application   = "bedrock"
        Environment   = "development"
        TechnicalLead = "custom-dev"
        SupportLead   = "tbd"
        Department    = "citywide"
        DataClass     = "confidential"
        Description   = "Role used by Bedrock eventbridge step function events."
    }
}

resource "aws_iam_policy" "bedrock-eventbridge-policy-$$INSTANCE$$" {
  name        = "bedrock-eventbridge-policy-$$INSTANCE$$"
  description = "Policy for Bedrock eventbridge step function events"
  policy = templatefile("./policy.json", {
    state_machine_arn: data.terraform_remote_state.process_etl_run_group.outputs.process_etl_run_group_arn
  })
}

resource "aws_iam_role_policy_attachment" "test-attach-$$INSTANCE$$" {
    role    = aws_iam_role.bedrock-eventbridge-role-$$INSTANCE$$.name
    policy_arn  = aws_iam_policy.bedrock-eventbridge-policy-$$INSTANCE$$.arn
}

output "bedrock_eventbridge_role_arn" {
  value = "${aws_iam_role.bedrock-eventbridge-role-$$INSTANCE$$.arn}"
}

