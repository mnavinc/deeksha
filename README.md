# Deeksha Journey

Deeksha Journey consists of an Expo mobile client and a PostgreSQL-backed API.

## Architecture

- `app/`, `src/`: Expo React Native client
- `backend/`: Fastify API, PostgreSQL migrations and production container image
- `docker-compose.yml`: local development stack

## Run locally

1. Copy `.env.example` to `.env` and use unique development secrets.
2. Install the mobile dependencies with `npm install`.
3. Install the API dependencies with `npm install --prefix backend`.
4. Start the stack with `docker compose up --build`.
5. Set `EXPO_PUBLIC_API_URL` to the reachable API URL before launching Expo.

Never use the sample secrets in a deployed environment. The backend deployment and data-safety requirements are documented in [backend/README.md](backend/README.md).
