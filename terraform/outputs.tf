output "cloudfront_url" {
  description = "Frontend URL — open this in browser"
  value       = "https://${aws_cloudfront_distribution.frontend.domain_name}"
}

output "api_public_ip" {
  description = "EC2 public IP for SSH"
  value       = aws_eip.api.public_ip
}

output "api_url" {
  description = "Direct API URL"
  value       = "http://${aws_eip.api.public_ip}:3000"
}

output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = aws_db_instance.postgres.address
  sensitive   = true
}

output "frontend_s3_bucket" {
  description = "Upload React build here"
  value       = aws_s3_bucket.frontend.bucket
}

output "uploads_s3_bucket" {
  description = "File uploads bucket"
  value       = aws_s3_bucket.uploads.bucket
}

output "ssh_command" {
  description = "SSH into EC2"
  value       = "ssh -i ~/.ssh/${var.ec2_key_pair_name}.pem ec2-user@${aws_eip.api.public_ip}"
}
