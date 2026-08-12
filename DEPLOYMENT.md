# Deployment

## Recommended MVP stack

- **Supabase**: managed PostgreSQL, email/Google authentication, Storage, and Realtime.
- **Vercel**: Expo web export hosted as a static site.
- **Render**: Fastify API and Socket.IO service. A persistent service is required for Socket.IO; Vercel serverless functions are not suitable for a stateful Socket.IO server.

## Deploy order

1. Create a Supabase project and apply database migrations `001` through `004` in SQL Editor. Store the pooled PostgreSQL connection string as `DATABASE_URL` in Render.
2. Create a Render web service from this repository using `render.yaml`. Set `CORS_ORIGIN` to the Vercel URL after the frontend is deployed.
3. Import this repository into Vercel. It uses `vercel.json` to run `npm run export:web` and publish `dist`.
4. Set `EXPO_PUBLIC_API_URL` in Vercel and in local Expo sessions to the Render API URL. Use the same URL for Socket.IO.
5. Configure Supabase Auth redirect URLs for the Vercel domain and `deekshajourney://` mobile deep link before enabling Google sign-in.

Free plans are suitable for a demo/MVP only. Supabase free projects pause after inactivity, and Render free web services may sleep; neither is appropriate for a production service with realtime notifications.
