# Enterprise Deployment & Operations Guide 🚀

This document outlines deployment configurations, cloud environment setup, and operational runbooks for deploying **Deeksha Journey** in enterprise production environments.

---

## 🏗️ Architecture Stack Summary

| Component | Technology | Recommended Production Hosting |
| :--- | :--- | :--- |
| **Backend API** | Fastify 5 + Socket.IO (TypeScript) | AWS ECS / GCP Cloud Run / Kubernetes / Render |
| **Database** | PostgreSQL 16 with RLS Context | AWS RDS PostgreSQL / Supabase Enterprise / Managed DB |
| **Mobile Client** | Expo 57 (React Native 0.86) | Apple App Store & Google Play Console |
| **Web Client** | Expo Web Static Export | Vercel / Cloudflare Pages / AWS CloudFront + S3 |

---

## 🔒 Mandatory Production Security Checklist

Before launching to production, verify that:

- [ ] `NODE_ENV` is set to `production`.
- [ ] `JWT_SECRET` is set to a cryptographically strong string (minimum 32 characters, e.g., generated with `openssl rand -base64 32`).
- [ ] `DATABASE_URL` uses SSL (`sslmode=require` or `DATABASE_SSL=true`).
- [ ] `DATABASE_SSL_REJECT_UNAUTHORIZED` is set according to your cloud provider's CA certificate policy (`false` for AWS RDS/Supabase unless custom CA is loaded).
- [ ] `CORS_ORIGIN` is explicitly set to production client domains (supports comma-separated URLs).
- [ ] Rate limiting is enabled (`RATE_LIMIT_MAX` defaults to 120 reqs/min per IP, with strict per-route limits on auth/OTP endpoints).
- [ ] Sensitive headers (`Authorization`, `Cookie`) are automatically redacted in Fastify logs.
- [ ] Container runs as non-root user (`USER node` in Dockerfile).
- [ ] All database migrations are applied and tracked via `schema_migrations`.

---

## 📦 Container Deployment (Docker / Kubernetes)

### 1. Multi-Stage Docker Image
The repository includes an optimized multi-stage Dockerfile located at `backend/Dockerfile`:
```bash
# Build production Docker image
docker build -t deeksha-api:latest ./backend
```

Features:
- Multi-stage build targeting lightweight `node:22-alpine`
- Stripped development dependencies (`npm ci --omit=dev`)
- Packaged database migrations (`/app/db`) for runtime migration execution
- Non-root execution (`USER node`)
- Native container `HEALTHCHECK` probe

### 2. Container Health Probes
Configure container orchestrators (Kubernetes, AWS ECS, Docker Swarm) with the following probe configurations:

- **Liveness Probe**: `GET /health` on port `3000` (Initial delay: 5s, Period: 10s)
  - Returns: `200 OK` with system uptime, service name, and timestamp.
- **Readiness Probe**: `GET /ready` on port `3000` (Initial delay: 5s, Period: 10s)
  - Returns: `200 OK` with PostgreSQL active connection status and pool statistics (`total`, `idle`, `waiting`), or `503 Service Unavailable` on database outage.

### 3. Kubernetes Deployment Example
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: deeksha-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: deeksha-api
  template:
    metadata:
      labels:
        app: deeksha-api
    spec:
      containers:
        - name: api
          image: your-registry.com/deeksha-api:latest
          ports:
            - containerPort: 3000
          envFrom:
            - secretRef:
                name: deeksha-secrets
          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
```

---

## 🌐 Deploying to Render & Vercel

### Step 1: Managed Database Setup
Create a managed PostgreSQL database (AWS RDS, Supabase, or Render PostgreSQL). Run migrations:
```bash
# Run migrations using tsx locally or node in production
npm run migrate --prefix backend
# In compiled production containers:
npm run migrate:prod --prefix backend
```

### Step 2: Deploy Fastify API (Render)
1. Link this repository to Render and use `render.yaml`.
2. Configure environment variables in Render Dashboard:
   - `NODE_ENV`: `production`
   - `PORT`: `3000`
   - `DATABASE_URL`: `<Your Managed Postgres Connection String>`
   - `DATABASE_SSL`: `true`
   - `DATABASE_SSL_REJECT_UNAUTHORIZED`: `false`
   - `JWT_SECRET`: `<32+ char cryptographically random secret>`
   - `CORS_ORIGIN`: `https://your-app.vercel.app`
   - `RATE_LIMIT_MAX`: `120`

### Step 3: Deploy Web Client (Vercel)
1. Import the repository into Vercel.
2. Vercel uses `vercel.json` to execute `npm run export:web` and host the output `dist/` folder.
3. Configure environment variable in Vercel:
   - `EXPO_PUBLIC_API_URL`: `https://your-api.onrender.com`

---

## 📈 Monitoring, Tracing & Log Management

1. **Distributed Tracing**:
   - Every request is tagged with a unique UUIDv4 `x-request-id` header.
   - The header is automatically propagated in API replies and error payloads for cross-service log correlation.

2. **Structured JSON Logging**:
   - Application logs are written in structured JSON format via Pino.
   - Logs automatically redact sensitive headers (`Authorization`, `Cookie`).
   - Forward stdout/stderr to AWS CloudWatch, Datadog, or Grafana Loki.

3. **Database Pool Metrics**:
   - The `/ready` endpoint exposes real-time connection pool metrics (`total`, `idle`, `waiting`) to detect pool starvation before performance degrades.
