provider "aws" {
  region	= var.region
}

# Resource: https://spacelift.io/blog/terraform-aws-vpc

/**************************/
/******* Variables ********/
/**************************/

variable "public_subnet_cidrs" {
 type        = list(string)
 description = "Public Subnet CIDR values"
 default     = ["10.99.0.0/26", "10.99.0.64/26"]
}

variable "private_subnet_cidrs" {
 type        = list(string)
 description = "Private Subnet CIDR values"
 default     = ["10.99.0.128/26", "10.99.0.192/26"]
}

variable "azs" {
 type        = list(string)
 description = "Availability Zones"
 default     = ["us-east-1a", "us-east-1b"]
}

/**********************************/
/******** Infrastructure **********/
/**********************************/

/** VPC and Subnets **/

resource "aws_vpc" "bd-main-$$INSTANCE$$" {
  cidr_block = "10.99.0.0/24"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = {
    Name = "Bedrock VPC"
  }
}

resource "aws_subnet" "bd-public-subnets-$$INSTANCE$$" {
 count      = length(var.public_subnet_cidrs)
 vpc_id     = aws_vpc.bd-main-$$INSTANCE$$.id
 cidr_block = element(var.public_subnet_cidrs, count.index)
 availability_zone = element(var.azs, count.index)
 
 tags = {
   Name = "Bedrock Public Subnet ${count.index + 1}"
 }
}
 
resource "aws_subnet" "bd-private-subnets-$$INSTANCE$$" {
 count      = length(var.private_subnet_cidrs)
 vpc_id     = aws_vpc.bd-main-$$INSTANCE$$.id
 cidr_block = element(var.private_subnet_cidrs, count.index)
 availability_zone = element(var.azs, count.index)

 tags = {
   Name = "Bedrock Private Subnet ${count.index + 1}"
 }
}
/** Internet Gateway and Route Tables **/

resource "aws_internet_gateway" "gw" {
 vpc_id = aws_vpc.bd-main-$$INSTANCE$$.id
 
 tags = {
   Name = "Project Bedrock VPC IG"
 }
}

resource "aws_route_table" "second_rt" {
 vpc_id = aws_vpc.bd-main-$$INSTANCE$$.id
 
 route {
   cidr_block = "0.0.0.0/0"
   gateway_id = aws_internet_gateway.gw.id
 }
 
 tags = {
   Name = "Bedrock 2nd Route Table"
 }
}

resource "aws_route_table_association" "public_subnet_asso" {
 count = length(var.public_subnet_cidrs)
 subnet_id      = element(aws_subnet.bd-public-subnets-$$INSTANCE$$[*].id, count.index)
 route_table_id = aws_route_table.second_rt.id
}

resource "aws_security_group" "bedrock-vpc-sg-$$INSTANCE$$" {
  name        = "bedrock-vpc-sg-$$INSTANCE$$"
  description = "Allow TLS inbound traffic,Postgres and all outbound traffic"
  vpc_id      = aws_vpc.bd-main-$$INSTANCE$$.id

  tags = {
    Name = "bedrock-vpc-sg-$$INSTANCE$$"
  }

  egress {
    from_port        = 0
    to_port          = 0
    protocol         = "-1"
    cidr_blocks      = ["0.0.0.0/0"]
    ipv6_cidr_blocks = ["::/0"]
  }
}

resource "aws_vpc_security_group_ingress_rule" "allow_tls_ipv4-$$INSTANCE$$" {
  security_group_id = aws_security_group.bedrock-vpc-sg-$$INSTANCE$$.id
  cidr_ipv4         = aws_vpc.bd-main-$$INSTANCE$$.cidr_block
  from_port         = 443
  ip_protocol       = "tcp"
  to_port           = 443
}

resource "aws_vpc_security_group_ingress_rule" "allow_pg_ipv4-$$INSTANCE$$" {
  security_group_id = aws_security_group.bedrock-vpc-sg-$$INSTANCE$$.id
  cidr_ipv4         = aws_vpc.bd-main-$$INSTANCE$$.cidr_block
  from_port         = 5432
  ip_protocol       = "tcp"
  to_port           = 5432
}

/** Database Subnet Group **/

resource "aws_db_subnet_group" "db_subnet_group_$$INSTANCE$$" {
  name       = "public-db-subnet-group-$$INSTANCE$$"
  subnet_ids = aws_subnet.bd-public-subnets-$$INSTANCE$$[*].id

  tags = {
    Name = "Bedrock DB subnet group"
  }
}

/***************************/
/******** Outputs **********/
/***************************/

output "BEDROCK_VPC_ID" {
  value = "${aws_vpc.bd-main-$$INSTANCE$$.id}"
}

output "BEDROCK_PRIVATE_SUBNETS" {
  value = aws_subnet.bd-public-subnets-$$INSTANCE$$[*].id
}

output BEDROCK_SECURITY_GROUP_IDS {
  value =  [aws_security_group.bedrock-vpc-sg-$$INSTANCE$$.id]
}

output "DB_SUBNET_GROUP_NAME" {
  value = aws_db_subnet_group.db_subnet_group_$$INSTANCE$$.name
}
