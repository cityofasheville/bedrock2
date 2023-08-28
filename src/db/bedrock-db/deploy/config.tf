provider "aws" {
  region	= var.region
}

resource "aws_db_instance" "bedrock-db-$$INSTANCE$$" {
  allocated_storage    = 10
  db_name              = "bedrock"
  identifier           = "bedrock-db-$$INSTANCE$$"
  engine               = "postgres"
  engine_version       = "13.7"
  instance_class       = "db.t3.micro"
  username             = "bedrock"
  password             = "test-bedrock"
  parameter_group_name = "default.postgres13"
  skip_final_snapshot  = true
  publicly_accessible  = true
  db_subnet_group_name = "public-db-subnet-group"
  vpc_security_group_ids = [aws_security_group.bedrock-pg-sg-$$INSTANCE$$.id]
}

resource "aws_security_group" "bedrock-pg-sg-$$INSTANCE$$" {
  name        = "bedrock-pg-sg-$$INSTANCE$$"
  description = "Allow public access to postgres"
  vpc_id      = "vpc-0340a3823e5b5f0d2"

  ingress {
    description      = "Inbound access to postgres"
    from_port        = 5432
    to_port          = 5432
    protocol         = "tcp"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }

  tags = {
    Name = "bedrock-pg-sg-$$INSTANCE$$"
  }
}

output "BEDROCK_DB_HOST_ENDPOINT" {
  value = "${aws_db_instance.bedrock-db-$$INSTANCE$$.endpoint}"
}
