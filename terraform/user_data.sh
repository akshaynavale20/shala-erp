#!/bin/bash
set -e

# ── Install Docker ─────────────────────────────────────────────
yum update -y
yum install -y docker git
systemctl enable docker
systemctl start docker

# Docker Compose v2
curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64" \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Add ec2-user to docker group
usermod -aG docker ec2-user

# ── Clone repo ─────────────────────────────────────────────────
cd /home/ec2-user
git clone https://github.com/akshaynavale20/shala-erp.git app
cd app

# ── Write .env ─────────────────────────────────────────────────
cat > backend/.env << 'ENVEOF'
NODE_ENV=production
PORT=3000

DB_HOST=${db_host}
DB_PORT=${db_port}
DB_NAME=${db_name}
DB_USER=${db_username}
DB_PASS=${db_password}
DB_SYNCHRONIZE=false

JWT_SECRET=${jwt_secret}
JWT_EXPIRES_IN=7d

AWS_REGION=${aws_region}
AWS_S3_BUCKET=${s3_bucket}
UPLOAD_DEST=s3

CORS_ORIGINS=*
ENVEOF

# ── Start API with Docker ──────────────────────────────────────
cat > docker-compose.prod.yml << 'DCEOF'
version: '3.8'
services:
  api:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    env_file:
      - ./backend/.env
    restart: unless-stopped
DCEOF

docker-compose -f docker-compose.prod.yml up -d --build

# ── Wait for API then run migrations ──────────────────────────
sleep 30
docker-compose -f docker-compose.prod.yml exec -T api \
  npx typeorm migration:run -d dist/datasource.config.js || true

echo "✅ ShalaERP API started on :3000"
