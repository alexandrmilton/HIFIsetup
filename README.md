# HiFiSetup

Mobile-first Next.js application for sharing Hi‑Fi audio setups.

Production: https://hifisetup.vercel.app

## Local launch

1. Copy `.env.example` to `.env.local` and set the Supabase project URL and publishable key.
2. Run `pnpm dev` and open `http://localhost:3000`.

Without environment variables, the interface starts in demo mode. The catalogue preview remains usable; login and saving are deliberately disabled.

## Database

Migrations live in `supabase/migrations/` and have all been applied to the connected Supabase project.

- `components`, `setups`, `setup_components`, `profiles` — normalized catalogue, setups, and their ordered component chain.
- `categories`, `setup_categories` — genre/direction tags (Вініл, Джаз, Хай-енд, DIY…) shown as the marquee filters.
- `standard`, `handmade`, `custom_order` are a PostgreSQL enum. A member's own component stays a regular `components` row linked through `setup_components`, keeping the catalogue normalized while preserving its origin.

### Moderation

Every new or edited setup enters the queue as `moderation_status = 'pending'` and is invisible to everyone but its owner and staff. Admins (`profiles.is_admin`) and moderators (`profiles.is_moderator`) approve or reject at `/admin`; only `approved` setups appear on the homepage, in the stats, and in the public API.

That rule is enforced in RLS, not only in the application's queries — the anon key ships in the browser, so anything the policies allow is reachable directly through PostgREST regardless of what the app asks for.

### Roles

| | Moderator | Admin |
| --- | --- | --- |
| Approve / reject setups | ✅ | ✅ |
| Delete setups | ❌ | ✅ |
| Edit / delete member-added catalogue entries | ❌ | ✅ |
| Grant or revoke the moderator role | ❌ | ✅ |

Privileged columns (`profiles.is_admin`, `profiles.is_moderator`, `setups.moderation_status`) carry no `UPDATE` grant for `authenticated`. Every privileged change goes through a `SECURITY DEFINER` function that re-checks the caller's role, so a forged request cannot escalate. `anon` is read-only.

### Private setups

A setup is either public (listed on the homepage) or private. Private setups stay out of every listing query but remain reachable by direct link. That is served by the `get_setup_detail(slug)` SQL function, which is `SECURITY DEFINER` and returns exactly one row for an exact slug match — so RLS on the underlying tables stays strict instead of being opened to `using(true)`.

Slugs are transliterated to ASCII (`Супер басовий сетап` → `super-basovyi-setap-a1b2c3`) so links never need percent-encoding.

## Public API

Read-only, CORS-enabled, no auth — intended for the planned Telegram bot. Field names are stable; new fields may be added, existing ones will not be renamed.

| Endpoint | Description |
| --- | --- |
| `GET /api/public/setups` | Published setups. Query: `category` (name), `limit` (max 100, default 20), `offset`. Returns `{ total, limit, offset, setups[] }`. |
| `GET /api/public/setups/{slug}` | One setup with its ordered `chain[]`. Works for private setups given the slug. 404 if unknown. |
| `GET /api/public/categories` | All category `{ name, slug }` pairs. |

Only approved setups are served. A setup carries up to five photos: the cover plus a gallery. Any file size is accepted — the browser downscales and re-encodes to WebP before upload, and the storage bucket enforces its own 2 MB ceiling as the backstop.

```bash
curl https://hifisetup.vercel.app/api/public/setups?category=Вініл&limit=5
curl https://hifisetup.vercel.app/api/public/setups/super-basovyi-setap-b7742c
```

## Community

The project is run alongside the **Меломанія_UA** Telegram community: https://t.me/+ZMM9P_56MPw4Mzgy

## Deployment

The GitHub repository is connected to Vercel; pushes to `main` deploy automatically. `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` are set in Vercel → Settings → Environment Variables. In Supabase Auth → URL Configuration, both the production URL and `http://localhost:3000` are registered as redirect URLs.
