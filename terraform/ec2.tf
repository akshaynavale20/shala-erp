# Latest Amazon Linux 2023 AMI (free tier eligible)
data "aws_ami" "amazon_linux" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

resource "aws_instance" "api" {
  ami                    = data.aws_ami.amazon_linux.id
  instance_type          = var.ec2_instance_type  # t2.micro free tier
  key_name               = var.ec2_key_pair_name
  subnet_id              = aws_subnet.public_a.id
  vpc_security_group_ids = [aws_security_group.ec2.id]
  iam_instance_profile   = aws_iam_instance_profile.ec2_profile.name

  root_block_device {
    volume_type = "gp2"
    volume_size = 30  # free tier allows 30GB
  }

  user_data = base64encode(templatefile("${path.module}/user_data.sh", {
    db_host     = aws_db_instance.postgres.address
    db_port     = "5432"
    db_name     = var.db_name
    db_username = var.db_username
    db_password = var.db_password
    jwt_secret  = var.jwt_secret
    s3_bucket   = aws_s3_bucket.uploads.bucket
    aws_region  = var.aws_region
  }))

  tags = { Name = "${var.app_name}-api" }
}

# Elastic IP — static public IP for EC2
resource "aws_eip" "api" {
  instance = aws_instance.api.id
  domain   = "vpc"
  tags     = { Name = "${var.app_name}-eip" }
}
