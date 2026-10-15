# Deeksha Journey 🚀

An enterprise-grade, production-ready full-stack platform featuring a **Fastify 5 REST & Realtime API** powered by **PostgreSQL 16**, paired with a cross-platform **Expo React Native** mobile client.

---

## 🏛️ Architecture Overview

```
+-------------------------------------------------------+
|                    Client Layer                       |
|   Expo (React Native) / iOS / Android / Web App        |
+-------------------------------------------------------+
                           |
                     HTTPS / WSS
                           |
+-------------------------------------------------------+
|                 Backend API Layer                     |
|  Fastify 5 Framework | Socket.io WebSocket Server    |
|  JWT Auth | Zod Validation | Helmet Security Headers |
+-------------------------------------------------------+
                           |
                      PostgreSQL
                           |
+-------------------------------------------------------+
|                Persistence Layer                      |
| PostgreSQL 16 Database with Row-Level Security Context |
+-------------------------------------------------------+
```

---

## 🛠️ Tech Stack & Technologies

### Backend Services
- **Runtime**: Node.js (v20+ ESM) / TypeScript 5
- **Web Framework**: [Fastify 5](https://fastify.dev/) with high-performance JSON serialization
- **Database**: PostgreSQL 16 using parameterized `pg` connection pool with RLS context
- **Realtime Engine**: [Socket.IO](https://socket.io/) with JWT handshake validation
- **Security & Hardening**: `@fastify/helmet` (Security headers), `@fastify/cors` (Configurable multi-origin validation), `@fastify/jwt` (Token authentication), `@fastify/rate-limit` (DDoS & brute-force mitigation)
- **Validation**: [Zod](https://zod.dev/) schemas for request body & environment variable enforcement
- **Email Service**: [Nodemailer](https://nodemailer.com/) with customizable SMTP transport
- **Testing**: Native Node.js test runner with TypeScript execution (`tsx --test`)

### Mobile & Frontend Client
- **Framework**: [Expo 57](https://expo.dev/) with React Native 0.86 & React 19
- **Navigation**: Expo Router (File-based navigation)
- **State Management**: Zustand with persistent hydration
- **Maps & Geolocation**: `react-native-maps` & `expo-location`
- **Linting & Code Quality**: ESLint 9 with `eslint-config-expo` flat configuration

### Infrastructure & Operations
- **Containerization**: Multi-stage Docker build targeting lightweight `node:22-alpine` with healthcheck probe
- **Orchestration**: Docker Compose with isolated network and container health checks
- **Health Probes**: `/health` (Liveness) & `/ready` (Readiness DB check with connection pool metrics)
- **CI/CD**: GitHub Actions automated pipeline covering linting, typechecks, testing, and Docker builds

---

## 🚀 Quickstart Guide

### Prerequisites
- **Node.js**: `v20.x` or higher
- **npm**: `v10.x` or higher
- **Docker**: Docker Desktop or Docker Engine with Docker Compose

---

### Step 1: Environment Configuration

Copy the example environment configuration file to `.env`:

```bash
cp .env.example .env
```

Configure your secrets in `.env`:
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://deeksha_app:change-me-before-production@localhost:5432/deeksha
JWT_SECRET=replace-with-a-secure-32-character-minimum-secret-key
CORS_ORIGIN=http://localhost:8081
```

---

### Step 2: Run with Docker Compose (Recommended)

Start the PostgreSQL database and Backend API services together:

```bash
docker compose up --build -d
```

Check service status and health:
```bash
docker compose ps
```

View application logs:
```bash
docker compose logs -f api
```

---

### Step 3: Local Development (Without Docker API)

#### 1. Install Dependencies
```bash
# Install mobile client dependencies
npm install

# Install API dependencies
npm install --prefix backend
```

#### 2. Run Database Migrations
```bash
npm run migrate --prefix backend
```

#### 3. Start Backend Server
```bash
npm run dev --prefix backend
```
The API server will listen on `http://localhost:3000`.

#### 4. Start Expo Mobile Client
```bash
# Start Expo development server
npm start

# Run on Web platform
npm run web
```

---

## 🔍 Health Checks & Monitoring

The API provides enterprise readiness and liveness probes suitable for Kubernetes, Docker, and Cloud Load Balancers:

- **Liveness Probe**: `GET /health`
  - Returns `200 OK` with system uptime and timestamp.
- **Readiness Probe**: `GET /ready`
  - Performs active PostgreSQL connection check. Returns `200 OK` when healthy or `503 Service Unavailable` on database connection failure.

Example response from `/ready`:
```json
{
  "status": "ready",
  "database": "connected",
  "timestamp": "2026-09-30T08:30:00.000Z"
}
```

---

## 🔒 Security & Enterprise Practices

1. **Header Redaction**: Sensitive headers (Authorization, Cookie) are automatically redacted in application logs.
2. **Request Tracing**: Every HTTP request is assigned a unique `x-request-id` header (UUIDv4) for distributed tracing.
3. **CORS Hardening**: Strict origin matching in production with dynamic validation for development environments.
4. **Graceful Shutdown**: Intercepts `SIGINT` and `SIGTERM` signals to cleanly terminate active HTTP requests and close PostgreSQL database pools without dropping client requests.
5. **Row Context Isolation**: `withUser` helper sets transactional RLS session variables (`app.user_id`) for every database connection.

---

## 📂 Project Directory Structure

```
deeksha/
├── app/                        # Expo Router screens & route handlers
├── src/                        # Shared mobile components, hooks, & stores
├── backend/                    # Fastify API Node.js project
│   ├── db/                     # SQL Schema & Database Migrations
│   ├── src/
│   │   ├── routes/             # REST endpoints (auth, me, enrollments, groups, community)
│   │   ├── config.ts           # Enforced environment configuration (Zod)
│   │   ├── db.ts               # PostgreSQL Pool & user-scoped transactions
│   │   ├── emailService.ts     # SMTP Email delivery engine
│   │   └── server.ts           # Server initialization, Socket.io, & Security plugins
│   ├── Dockerfile              # Multi-stage production container definition
│   └── package.json            # API dependencies & scripts
├── docker-compose.yml          # Infrastructure composition (API + Postgres)
├── .env.example                # Template environment parameters
├── DEPLOYMENT.md               # Production deployment guide
└── README.md                   # Enterprise documentation
```

---

## 📋 Quality Assurance & Commands

| Task | Command | Description |
| :--- | :--- | :--- |
| **Full Pipeline Test** | `cmd /c "npm run typecheck && npm run lint && npm run test && npm run typecheck --prefix backend && npm run build --prefix backend && npm run test --prefix backend"` | Executes complete enterprise CI pipeline locally |
| **Backend Tests** | `npm run test --prefix backend` | Executes Fastify API automated integration & unit tests |
| **Client Tests** | `npm run test` | Executes client i18n & API network resilience tests |
| **Mobile Typecheck** | `npm run typecheck` | Runs TypeScript static type checking on client codebase |
| **Mobile Lint** | `npm run lint` | Runs ESLint check across client codebase |
| **Backend Typecheck** | `npm run typecheck --prefix backend` | Runs TypeScript static type verification on backend |
| **Backend Build** | `npm run build --prefix backend` | Compiles TypeScript source files into `dist/` |
| **Backend Dev** | `npm run dev --prefix backend` | Starts dev server with `tsx` file watcher |
| **Database Migrations** | `npm run migrate --prefix backend` | Applies SQL migrations with schema tracking |
| **Production Migrations** | `npm run migrate:prod --prefix backend` | Runs migrations inside compiled Docker container |

---

## 📄 License

Internal Enterprise Application - All Rights Reserved.
