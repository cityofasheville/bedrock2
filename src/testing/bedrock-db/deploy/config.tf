provider "aws" {
  region	= var.region
}

resource "aws_db_instance" "bedrock-db-$$INSTANCE$$" {
  allocated_storage    = 10
  db_name              = "bedrock_db_$$INSTANCE$$"
  identifier           = "bedrock-db-$$INSTANCE$$"
  engine               = "postgres"
  engine_version       = "13.7"
  instance_class       = "db.t3.micro"
  username             = "bedrock"
  password             = "test-bedrock"
  parameter_group_name = "default.postgres13"
  skip_final_snapshot  = true
  db_subnet_group_name = "bpt-db-subnet-group"
}
