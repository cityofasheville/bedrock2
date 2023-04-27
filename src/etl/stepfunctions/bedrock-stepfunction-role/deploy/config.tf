provider "aws" {
  region	= var.region
}

resource "aws_iam_role" "bedrock-stepfunction-role-$$INSTANCE$$" {
    name = "bedrock-stepfunction-role-$$INSTANCE$$"
    assume_role_policy = file("./role.json")
    tags = {
        Name          = "bedrock-stepfunction-role-$$INSTANCE$$"
      "coa:application" = "bedrock"
      "coa:department"  = "information-technology"
      "coa:owner"       = "jtwilson@ashevillenc.gov"
      "coa:owner-team"  = "dev"
        Description   = "Role used by Bedrock step functions."
    }
}

resource "aws_iam_policy" "bedrock-stepfunction-policy-$$INSTANCE$$" {
  name        = "bedrock-stepfunction-policy-$$INSTANCE$$"
  description = "Policy for Bedrock step functions"
  policy = templatefile("./policy.json", {
    account_num: $$account$$
  })
}

resource "aws_iam_role_policy_attachment" "test-attach-$$INSTANCE$$" {
    role    = aws_iam_role.bedrock-stepfunction-role-$$INSTANCE$$.name
    policy_arn  = aws_iam_policy.bedrock-stepfunction-policy-$$INSTANCE$$.arn
}

output "bedrock_stepfunction_role_arn" {
  value = "${aws_iam_role.bedrock-stepfunction-role-$$INSTANCE$$.arn}"
}

