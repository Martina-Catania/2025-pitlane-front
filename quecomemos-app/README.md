# QueComemos App

Frontend for the QueComemos application, built with Next.js, Supabase, and Tailwind CSS.

## Setup

1. Install dependencies with `npm install`.
2. Create a `.env.local` file with the required environment variables.
3. Start the app with `npm run dev`.

## Required Environment Variables

Set these values before running the app:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=
NEXT_PUBLIC_API_URL=
BACKEND_URL=
```

`BACKEND_URL` is optional. If omitted, server routes fall back to `NEXT_PUBLIC_API_URL`.

## Local Development

- `npm run dev` - start the development server
- `npm run build` - build the app for production
- `npm run start` - start the production server
- `npm run lint` - run linting
- `npm test` - run the Jest test suite

## Notes

- The app expects a running backend API for profile, meal, voting, and badge flows.
- Supabase auth is used for session and profile-aware routes.
