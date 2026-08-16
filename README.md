# roomtone

Mobile-first Next.js application for sharing Hi‑Fi audio setups.

## Local launch

1. Copy `.env.example` to `.env.local` and set the Supabase project URL and publishable key.
2. Run `pnpm dev` and open `http://localhost:3000`.

Without environment variables, the interface starts in demo mode. The catalogue preview remains usable; login and saving are deliberately disabled.

## Database

`supabase/migrations/0001_initial_schema.sql` has been applied to the connected Supabase project. It creates normalized `components`, `setups`, and `setup_components` tables, profiles, RLS policies, and the public `setup-images` bucket. The seed rows make the initial search catalogue work.

`standard`, `handmade`, and `custom_order` are a PostgreSQL enum. A member’s own component remains a regular `components` row and is linked through `setup_components`, keeping the catalogue normalized while preserving its origin.

## Deployment

Import the GitHub repository in Vercel, select the Next.js preset, then add the same two environment variables in Vercel → Settings → Environment Variables. In Supabase Auth, add both the Vercel URL and `http://localhost:3000` as redirect URLs.
