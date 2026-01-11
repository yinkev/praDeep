---
title: Deployment Guide
description: Production deployment strategies for praDeep
---

# Deployment Guide

Deploy praDeep in production environments with Docker, Kubernetes, or traditional hosting.

## Prerequisites

- Docker 24+ and Docker Compose v2
- Domain name with SSL certificate
- PostgreSQL 14+ (or managed service)
- Redis 7+ (or managed service)
- Object storage (S3-compatible)

## Deployment Options

| Option | Complexity | Scalability | Best For |
|--------|------------|-------------|----------|
| Docker Compose | Low | Single server | Small teams |
| Kubernetes | High | Horizontal | Large scale |
| Managed Cloud | Low | Automatic | Quick start |

## Docker Deployment

### 1. Clone and Configure

```bash
git clone https://github.com/HKUDS/praDeep.git
cd praDeep

# Copy and edit environment
cp .env.example .env
nano .env
```

### 2. Production Environment

```bash
# .env
NODE_ENV=production
DEBUG=false
LOG_LEVEL=info

# API Configuration
API_HOST=0.0.0.0
API_PORT=8783
SECRET_KEY=your-secret-key-min-32-chars

# Database
DATABASE_URL=postgresql://user:pass@db:5432/deeptutor

# Redis
REDIS_URL=redis://redis:6379/0

# Object Storage
S3_ENDPOINT=https://s3.amazonaws.com
S3_BUCKET=deeptutor-documents
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# Models
OPENAI_API_KEY=sk-...
EMBEDDING_MODEL=text-embedding-3-large
```

### 3. Docker Compose (Production)

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    ports:
      - "8783:8783"
    depends_on:
      - db
      - redis
    restart: always
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8783/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  worker:
    build:
      context: .
      dockerfile: Dockerfile
    command: celery -A deeptutor.worker worker -l info
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
    depends_on:
      - db
      - redis
    restart: always

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3783:3783"
    environment:
      - API_URL=http://api:8783
    depends_on:
      - api
    restart: always

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_USER=deeptutor
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=deeptutor
    restart: always

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: always

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certs:/etc/nginx/certs
    depends_on:
      - api
      - frontend
    restart: always

volumes:
  postgres_data:
  redis_data:
```

### 4. Deploy

```bash
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps

# View logs
docker compose -f docker-compose.prod.yml logs -f api
```

### 5. Nginx Configuration

```nginx
# nginx.conf
upstream api {
    server api:8783;
}

upstream frontend {
    server frontend:3783;
}

server {
    listen 80;
    server_name deeptutor.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name deeptutor.example.com;

    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;

    location /api {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        proxy_pass http://frontend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## Kubernetes

### 1. Helm Chart

```bash
# Add praDeep Helm repo
helm repo add deeptutor https://charts.deeptutor.io
helm repo update

# Install
helm install deeptutor deeptutor/deeptutor \
  --namespace deeptutor \
  --create-namespace \
  --values values.yaml
```

### 2. values.yaml

```yaml
# values.yaml
replicaCount:
  api: 3
  worker: 2

image:
  repository: ghcr.io/hkuds/deeptutor
  tag: latest

ingress:
  enabled: true
  className: nginx
  hosts:
    - host: deeptutor.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: deeptutor-tls
      hosts:
        - deeptutor.example.com

postgresql:
  enabled: true
  auth:
    database: deeptutor
    postgresPassword: changeme

redis:
  enabled: true
  auth:
    enabled: true
    password: changeme

resources:
  api:
    limits:
      cpu: 2000m
      memory: 4Gi
    requests:
      cpu: 500m
      memory: 1Gi

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 70

env:
  OPENAI_API_KEY:
    secretKeyRef:
      name: deeptutor-secrets
      key: openai-api-key
```

### 3. Kubernetes Manifests

```yaml
# deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: deeptutor-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: deeptutor-api
  template:
    metadata:
      labels:
        app: deeptutor-api
    spec:
      containers:
        - name: api
          image: ghcr.io/hkuds/deeptutor:latest
          ports:
            - containerPort: 8783
          envFrom:
            - configMapRef:
                name: deeptutor-config
            - secretRef:
                name: deeptutor-secrets
          resources:
            limits:
              memory: 4Gi
              cpu: 2000m
            requests:
              memory: 1Gi
              cpu: 500m
          livenessProbe:
            httpGet:
              path: /health
              port: 8783
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 8783
            initialDelaySeconds: 5
            periodSeconds: 5
```

## Monitoring

### Prometheus Metrics

praDeep exposes Prometheus metrics at `/metrics`:

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'deeptutor'
    static_configs:
      - targets: ['api:8783']
    metrics_path: /metrics
```

### Key Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `http_requests_total` | Counter | Total HTTP requests |
| `http_request_duration_seconds` | Histogram | Request latency |
| `embedding_requests_total` | Counter | Embedding API calls |
| `llm_tokens_total` | Counter | LLM tokens used |
| `documents_processed_total` | Counter | Documents processed |

### Grafana Dashboard

Import the praDeep dashboard:

```bash
# Dashboard ID: 12345
# Or import from: https://grafana.com/dashboards/12345
```

### Alerting Rules

```yaml
# alerts.yaml
groups:
  - name: deeptutor
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: High error rate detected

      - alert: SlowResponses
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 5
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: Slow response times
```

## Logging

### Structured Logging

```python
# Log format (JSON Lines)
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "info",
  "message": "Request completed",
  "request_id": "abc123",
  "user_id": "user_456",
  "path": "/api/v1/chat",
  "duration_ms": 234
}
```

### Log Aggregation (ELK)

```yaml
# filebeat.yml
filebeat.inputs:
  - type: container
    paths:
      - /var/lib/docker/containers/*/*.log
    processors:
      - decode_json_fields:
          fields: ["message"]
          target: ""

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "deeptutor-%{+yyyy.MM.dd}"
```

## Backup and Recovery

### Database Backup

```bash
# Automated daily backup
0 2 * * * pg_dump $DATABASE_URL | gzip > /backups/db-$(date +%Y%m%d).sql.gz

# Restore
gunzip -c backup.sql.gz | psql $DATABASE_URL
```

### Vector Store Backup

```bash
# ChromaDB backup
tar -czf chroma-backup.tar.gz ./data/chroma/

# Restore
tar -xzf chroma-backup.tar.gz -C ./data/
```

## Security Checklist

- [ ] SSL/TLS enabled (HTTPS only)
- [ ] API keys stored in secrets manager
- [ ] Database credentials rotated
- [ ] Network policies configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers set
- [ ] Regular security updates
- [ ] Audit logging enabled
- [ ] Backup encryption enabled

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker compose logs api

# Common issues:
# - Database connection failed
# - Missing environment variables
# - Port already in use
```

### Performance Issues

```bash
# Check resource usage
docker stats

# Increase resources if needed
docker compose up -d --scale api=3
```

### Database Migrations

```bash
# Run migrations
docker compose exec api alembic upgrade head

# Check migration status
docker compose exec api alembic current
```
