# Origin Access Control for S3
resource "aws_cloudfront_origin_access_control" "frontend" {
  name                              = "${var.app_name}-oac"
  origin_access_control_origin_type = "s3"
  signing_behavior                  = "always"
  signing_protocol                  = "sigv4"
}

resource "aws_cloudfront_distribution" "frontend" {
  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  price_class         = "PriceClass_100"  # US, EU, Asia — cheapest

  comment = "${var.app_name} frontend"

  # ── Origin 1: S3 (React static files) ──────────────────────
  origin {
    domain_name              = aws_s3_bucket.frontend.bucket_regional_domain_name
    origin_id                = "S3-frontend"
    origin_access_control_id = aws_cloudfront_origin_access_control.frontend.id
  }

  # ── Origin 2: EC2 API ───────────────────────────────────────
  origin {
    domain_name = aws_eip.api.public_dns
    origin_id   = "EC2-API"

    custom_origin_config {
      http_port              = 3000
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }

  # ── Default: serve React from S3 ───────────────────────────
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3-frontend"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = false
      cookies { forward = "none" }
    }

    min_ttl     = 0
    default_ttl = 86400   # 1 day
    max_ttl     = 31536000 # 1 year
  }

  # ── /api/* → EC2 NestJS API ─────────────────────────────────
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "EC2-API"
    viewer_protocol_policy = "redirect-to-https"
    compress               = true

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Content-Type", "Origin"]
      cookies { forward = "all" }
    }

    min_ttl     = 0
    default_ttl = 0
    max_ttl     = 0  # never cache API responses
  }

  # SPA fallback — return index.html for all 404s
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  custom_error_response {
    error_code            = 404
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 0
  }

  restrictions {
    geo_restriction { restriction_type = "none" }
  }

  viewer_certificate {
    cloudfront_default_certificate = true  # free *.cloudfront.net cert
  }

  tags = { Name = "${var.app_name}-cf" }
}
