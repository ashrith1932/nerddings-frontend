# Nerdding frontend

Standalone Next.js frontend for Nerdding.

## Local development

```bash
npm install
copy .env.example .env.local
npm run dev
```

Set the public production variables from `.env.production.example`:

```env
NEXT_PUBLIC_APP_URL=https://thepeoplesrepellentparty.in
NEXT_PUBLIC_API_URL=https://api.thepeoplesrepellentparty.in/api/v1
```

## Deploy to Vercel

Import this repository as a Vercel project. Set the project root to the repository root and add `NEXT_PUBLIC_API_URL` in Vercel environment variables.

Build command: `npm run build`

The frontend is guest-readable. Authenticated writes use the backend API.

## Legal pages

The application includes full-page legal routes linked from authentication and the footer:

- `/privacy`
- `/terms`
- `/community-guidelines`
- `/cookies`

These are launch-ready product templates, not jurisdiction-specific legal advice. Update the contact addresses and have counsel review them before launch.
