variable "aws_region" {
  default = "ap-south-1"
}

variable "app_name" {
  default = "shala-erp"
}

variable "env" {
  default = "prod"
}

# EC2
variable "ec2_instance_type" {
  default = "t2.micro" # free tier
}

variable "ec2_key_pair_name" {
  description = "Name of existing AWS key pair for SSH access"
  type        = string
}

# RDS
variable "db_name" {
  default = "shalaerp"
}

variable "db_username" {
  default = "shalaadmin"
}

variable "db_password" {
  description = "RDS PostgreSQL password"
  type        = string
  sensitive   = true
}

# App secrets
variable "jwt_secret" {
  description = "JWT secret key for NestJS"
  type        = string
  sensitive   = true
}
