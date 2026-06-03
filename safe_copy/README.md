# KMB Business Management - Next.js + Supabase

Quickstart:

1. Copy `.env.example` to `.env.local` and fill your keys.
2. Install dependencies:

```bash
npm install
```

3. Run dev server:

```bash
npm run dev
```

4. Apply DB schema to your Supabase project using `psql` or the Supabase SQL editor with `db/migrations/init.sql`.

Security:
- Do not commit `SUPABASE_SERVICE_ROLE_KEY`.

Files:
- `src/lib/supabaseClient.ts` - initializes Supabase client
- `db/migrations/init.sql` - initial PostgreSQL schema
- `src/lib/supabaseClient.ts` - initializes Supabase client
- `src/lib/supabaseServer.ts` - server-side Supabase client (service role key)
- `pages/api/*` - simple API routes that use the server client

Applying the database schema

- Via Supabase SQL Editor: open your project at app.supabase.com → SQL Editor → New query, paste the contents of `db/migrations/init.sql`, and run it.
- Or use the Supabase CLI: `supabase db connect` and run `psql` against your remote database, then execute `db/migrations/init.sql`.

Environment

- Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY`.
- The `SUPABASE_SERVICE_ROLE_KEY` is required for the server API routes; keep it secret and do not commit it.

Deployment

- Deploy to Vercel: create a new project, connect your repo, and add these environment variables in the Vercel dashboard:
	- `NEXT_PUBLIC_SUPABASE_URL`
	- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
	- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- The included `vercel.json` maps those environment variables and uses the Next.js builder.

Local run

```bash
cp .env.example .env.local
# fill in keys in .env.local
npm install
npm run dev
```

Preparing for deployment

1. Initialize a Git repository and push to your remote (GitHub/GitLab):

```bash
git init
git add .
git commit -m "Initial scaffold"
# create a remote and push to main (example for GitHub)
git branch -M main
git remote add origin <YOUR_REMOTE_URL>
git push -u origin main
```

2. CI / Deploy options

- Vercel: Connect your repo in the Vercel dashboard and add the following environment variables in the project settings:
	- `NEXT_PUBLIC_SUPABASE_URL`
	- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
	- `SUPABASE_SERVICE_ROLE_KEY` (server-only)

- GitHub Actions: a workflow was added at `.github/workflows/deploy.yml` using the Vercel Action. Add these repository secrets:
	- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
	- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

3. Docker: a `Dockerfile` is included for container-based deployment. Build and run with:

```bash
docker build -t kmb-app .
docker run -e NEXT_PUBLIC_SUPABASE_URL="$NEXT_PUBLIC_SUPABASE_URL" -e NEXT_PUBLIC_SUPABASE_ANON_KEY="$NEXT_PUBLIC_SUPABASE_ANON_KEY" -e SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" -p 3000:3000 kmb-app
```

Secrets and security

- The `SUPABASE_SERVICE_ROLE_KEY` is sensitive. Prefer adding it to your hosting provider's secret store (Vercel/GitHub Secrets) rather than pasting it in repo files.
- If you want me to deploy for you, I will need either a Vercel token and project identifiers or GitHub repo access plus secrets. You can paste tokens here (they will be visible in the conversation) or add them yourself to the provider and I can trigger the deployment steps.

Static DecSoft-ready UI

A static version is available in `static-app/` for DecSoft App Builder or any static host.

1. Copy `static-app/config.example.js` to `static-app/config.js`.
2. Add your Supabase project URL and anon key.
3. Open `static-app/index.html` in DecSoft or your browser.
4. Deploy the contents of `static-app/` as a static site.

The static app uses Supabase REST API calls and requires only the anon key. Do not commit `static-app/config.js`.
