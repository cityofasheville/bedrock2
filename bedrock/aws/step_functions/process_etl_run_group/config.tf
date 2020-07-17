terraform {
  backend "s3" {
    bucket = "cad-tfstate-store"
    key    = "terraform/bedrock/step_functions/process_etl_run_group/terraform_dev.tfstate"
    region = "us-east-1"
  }
}

provider "aws" {
  profile	= "default"
  region	= "us-east-1"
}

resource "aws_iam_role" "process_etl_run_group_role" {
    name = "process_etl_run_group_role"
    assume_role_policy = <<EOF
{
"Version": "2012-10-17",
"Statement": [
    {
    "Effect": "Allow",
    "Principal": {
        "Service": "states.amazonaws.com"
    },
    "Action": "sts:AssumeRole"
    }
]
}
EOF
    tags = {
        tag-key = "tag-value"
    }
}

resource "aws_iam_policy" "policy" {
  name        = "test-policy"
  description = "A test policy"

  policy = <<EOF
{
"Version": "2012-10-17",
"Statement": [
    {
        "Action": [
            "lambda:InvokeFunction*"
        ],
        "Effect": "Allow",
        "Resource": "*"
    },
    {
        "Effect": "Allow",
        "Action": [
            "xray:PutTraceSegments",
            "xray:PutTelemetryRecords",
            "xray:GetSamplingRules",
            "xray:GetSamplingTargets"
        ],
        "Resource": [
            "*"
        ]
    }
]
}
EOF
}

resource "aws_iam_role_policy_attachment" "test-attach" {
    role    = aws_iam_role.process_etl_run_group_role.name
    policy_arn  = aws_iam_policy.policy.arn
}

resource "aws_sfn_state_machine" "sfn_state_machine" {
  name     = "process_etl_run_group"
  role_arn = aws_iam_role.process_etl_run_group_role.arn

  definition = file("./states.json")
}