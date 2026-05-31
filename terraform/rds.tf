resource "aws_db_instance" "postgres" {
  identifier        = "${var.app_name}-db"
  engine            = "postgres"
  engine_version    = "15"
  instance_class    = "db.t3.micro"  # free tier eligible
  allocated_storage = 20             # free tier: up to 20GB

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]

  # Free tier settings
  multi_az                  = false
  publicly_accessible       = false
  skip_final_snapshot       = true
  deletion_protection       = false
  backup_retention_period   = 7       # 7 days backup free
  auto_minor_version_upgrade = true
  storage_encrypted         = false   # encryption costs extra

  tags = { Name = "${var.app_name}-postgres" }
}
