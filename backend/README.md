# Deeksha Journey API

The API is a stateless Fastify service with PostgreSQL as the source of truth. It stores money in paise, uses idempotent/upsert-style daily-log writes, database constraints, audit records, and PostgreSQL row-level security for user and group isolation.

## Local start

1. Copy `.env.example` to `.env` and replace every secret.
2. Start the database and API with `docker compose up --build`.
3. Use a JWT with a UUID `sub` claim. The first `PUT /v1/me` provisions the profile.

## Production requirements

- Run migrations in CI/CD before deploying the API; do not rely on Docker's initialization mount after the first database boot.
- Use a managed PostgreSQL 16+ instance with encrypted storage, PITR, multi-AZ/high availability, connection pooling, and tested restore drills.
- Store `DATABASE_URL` and `JWT_SECRET` in a secrets manager. Rotate secrets and use an asymmetric OIDC issuer in place of the development HMAC JWT secret.
- Restrict CORS to deployed mobile/web origins, terminate TLS at the load balancer, add WAF/rate limiting, central logs, metrics, tracing, and alerting.
- Create separate migration and runtime database roles. The runtime role must not be a superuser, must have no DDL rights, and must use the RLS policies.
- Keep temple rules and operational notices source-attributed, effective-dated, and approved before publishing.

## Guru governance

`002_enterprise_identity_rbac_progression.sql` implements the platform hierarchy separately from traditional pilgrimage names. It records Journey, Mentorship and Seva independently; a `guru_credentials` record is only a reviewed platform credential.

- A Guide application needs at least 18 verified journeys, mentor training, and five unique accepted endorsements from active identity-verified individuals before a reviewer can approve it.
- Guru Levels 2–5 have increasing, data-backed requirements for group journeys, mentorship and endorsements in `guru_level_requirements`.
- Sadguru is a reviewed recognition state, not a calculated level. It requires a Level 5 candidate, nomination, evidence, and an authorized platform decision.
- Profile discovery only exposes a member's explicitly opted-in public profile fields. Search is backed by full-text and trigram indexes through `GET /v1/profiles/search`.
