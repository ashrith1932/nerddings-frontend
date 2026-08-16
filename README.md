# Nerdding frontend

Standalone Next.js frontend for Nerdding.

## Local development

```bash
npm install
copy .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_API_URL` to the deployed backend API, for example:

```env
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api/v1
```

## Deploy to Vercel

Import this repository as a Vercel project. Set the project root to the repository root and add `NEXT_PUBLIC_API_URL` in Vercel environment variables.

Build command: `npm run build`

The frontend is guest-readable. Authenticated writes use the backend API.
