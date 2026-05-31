#!/bin/bash
# Deploy React frontend to S3 + invalidate CloudFront
set -e

BUCKET=$(terraform output -raw frontend_s3_bucket)
CF_ID=$(terraform show -json | jq -r '.values.root_module.resources[] | select(.type=="aws_cloudfront_distribution") | .values.id')

echo "📦 Building React..."
cd ../frontend
VITE_API_URL=/api npm run build

echo "🚀 Uploading to S3: $BUCKET"
aws s3 sync dist/ s3://$BUCKET --delete --region ap-south-1

echo "🔄 Invalidating CloudFront: $CF_ID"
aws cloudfront create-invalidation --distribution-id $CF_ID --paths "/*"

echo "✅ Frontend deployed!"
terraform -chdir=. output cloudfront_url
