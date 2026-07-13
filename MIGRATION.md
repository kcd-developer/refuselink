# RefuseLink — Migration Guide: Vercel + Supabase + Cloudflare

This guide walks you through deploying RefuseLink independently on your own infrastructure.

**Target stack:**
- **Hosting:** Vercel
- **Database:** Supabase (PostgreSQL)
- **File Storage:** Supabase Storage
- **Domain:** refuselink.com via Cloudflare
- **Business Email:** Google Workspace

---

## Prerequisites

- A [Vercel](https://vercel.com) account (free tier works to start)
- A [Supabase](https://supabase.com) account (free tier works to start)
- A [GitHub](https://github.com) account
- Node.js 18+ and npm installed locally
- Your refuselink.com domain managed on Cloudflare

---

## Step 1: Create a GitHub Repository

```bash
# On your local machine:
mkdir refuselink && cd refuselink
git init
```

Copy ALL the files from the export bundle into this directory, then:

```bash
git add .
git commit -m "Initial commit: RefuseLink v1.0"
```

Create a new private repo on GitHub (https://github.com/new) named `refuselink`, then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/refuselink.git
git branch -M main
git push -u origin main
```

---

## Step 2: Set Up Supabase

### 2a. Create the Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Choose an organization (or create one)
4. Name it `refuselink`
5. Set a **strong database password** — save it somewhere safe
6. Choose the **region closest to your users** (e.g., East US if most clients are in the US)
7. Click **Create new project** and wait ~2 minutes for provisioning

### 2b. Get Your Database Connection Strings

1. Go to **Project Settings** (gear icon) → **Database**
2. Scroll to **Connection string** section
3. Copy the **URI** tab connection strings:
   - **Transaction (port 6543)** — this is your `DATABASE_URL` (for the app at runtime)
   - **Session (port 5432)** — this is your `DIRECT_URL` (for migrations and seeding)
4. Replace `[YOUR-PASSWORD]` in both with your database password

They will look something like:
```
# DATABASE_URL (Transaction / Pooler):
postgresql://postgres.abcdefg:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true

# DIRECT_URL (Session / Direct):
postgresql://postgres.abcdefg:YOUR_PASSWORD@aws-0-us-east-1.pooler.supabase.com:5432/postgres
```

### 2c. Get Your Supabase API Keys

1. Go to **Project Settings** → **API**
2. Copy:
   - **Project URL** → this is `NEXT_PUBLIC_SUPABASE_URL`
   - **service_role key** (under "Project API keys") → this is `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ The service_role key has FULL access to your database and storage. Never expose it in client-side code.

### 2d. Create a Storage Bucket

1. Go to **Storage** in the Supabase sidebar
2. Click **New bucket**
3. Name it `documents`
4. Toggle **Public bucket** = ON (so uploaded public files are directly accessible)
5. Click **Create bucket**
6. Click the bucket → **Policies** tab → **New policy**
7. Add these RLS policies:

**For uploads (INSERT):**
- Policy name: `Allow authenticated uploads`
- Allowed operation: INSERT
- Policy definition: `true` (our API route handles auth, the service role key bypasses RLS anyway)

**For downloads (SELECT):**
- Policy name: `Allow public reads`
- Allowed operation: SELECT
- Policy definition: `true`

> Since we use the service_role key server-side, these policies are a safety net. The actual auth is handled by our API routes.

### 2e. Push the Database Schema

```bash
# On your local machine, in the project directory:
npm install

# Create a .env.local file with your Supabase connection strings:
cp .env.example .env.local
# Edit .env.local and fill in DATABASE_URL, DIRECT_URL, and other values

# Push the schema to Supabase:
npx prisma db push

# Seed the demo data:
npm run db:seed
```

Verify the data is there: go to Supabase Dashboard → **Table Editor** and you should see all 19 tables populated.

---

## Step 3: Deploy to Vercel

### 3a. Import the Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository**
3. Select your `refuselink` repo
4. Vercel will auto-detect it as a Next.js project

### 3b. Configure Environment Variables

Before clicking **Deploy**, add these environment variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `DATABASE_URL` | `postgresql://postgres.xxx:PASSWORD@...pooler.supabase.com:6543/postgres?pgbouncer=true` | Transaction pooler URL |
| `DIRECT_URL` | `postgresql://postgres.xxx:PASSWORD@...pooler.supabase.com:5432/postgres` | Session URL |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` | From Supabase API settings |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | From Supabase API settings |
| `SUPABASE_STORAGE_BUCKET` | `documents` | Bucket name from Step 2d |
| `NEXTAUTH_SECRET` | *(generate one)* | Run `openssl rand -base64 32` |

> Note: `NEXTAUTH_URL` is automatically set by Vercel — you do NOT need to add it.

### 3c. Deploy

Click **Deploy** and wait for the build to complete (~2-3 minutes).

Vercel will give you a URL like `refuselink.vercel.app` — test it there first.

---

## Step 4: Connect Your Custom Domain

### 4a. Add Domain in Vercel

1. In Vercel, go to your project → **Settings** → **Domains**
2. Add `refuselink.com`
3. Vercel will show you the DNS records to add

### 4b. Configure DNS in Cloudflare

1. Go to your Cloudflare dashboard → `refuselink.com` → **DNS**
2. Add the following records:

| Type | Name | Value | Proxy |
|------|------|-------|-------|
| CNAME | `@` | `cname.vercel-dns.com` | DNS only (grey cloud) |
| CNAME | `www` | `cname.vercel-dns.com` | DNS only (grey cloud) |

> **Important:** Set Cloudflare proxy to **DNS only** (grey cloud icon, not orange). Vercel manages its own SSL and CDN — Cloudflare's proxy can cause SSL conflicts.

3. Wait for DNS propagation (usually 5-30 minutes)
4. Vercel will automatically provision an SSL certificate

### 4c. Verify

Visit `https://refuselink.com` — your app should be live!

---

## Step 5: Post-Deployment Verification

Test each login portal with the demo credentials:

### Platform Admin
| Email | Password | URL |
|-------|----------|-----|
| admin@refuselink.com | Platform@demo1 | /platform/sign-in |
| support@refuselink.com | Support@demo1 | /platform/sign-in |

### KC Disposal (Company)
| Role | Email | Password | URL |
|------|-------|----------|-----|
| Owner | sarah@kc-disposal.example.com | Employee@demo1 | /kc-disposal/sign-in |
| Admin | james@kc-disposal.example.com | Employee@demo2 | /kc-disposal/sign-in |
| CSR | emily@kc-disposal.example.com | CSR@demo1 | /kc-disposal/sign-in |
| Dispatcher | marcus@kc-disposal.example.com | Dispatch@demo1 | /kc-disposal/sign-in |
| Customer | david@example.com | Customer@demo1 | /kc-disposal/sign-in |
| Customer | bob@riverside.example.com | Customer@demo2 | /kc-disposal/sign-in |

### Mountain High Disposal (Company)
| Role | Email | Password | URL |
|------|-------|----------|-----|
| Owner | alex@mountainhigh.example.com | Owner@demo1 | /mountain-high-disposal/sign-in |
| Manager | jen@mountainhigh.example.com | Manager@demo1 | /mountain-high-disposal/sign-in |
| Customer | frank@example.com | Customer@demo3 | /mountain-high-disposal/sign-in |

---

## File Changes Summary

Here's exactly what was changed from the original codebase for portability:

| File | Change |
|------|--------|
| `package.json` | Standalone — added `@supabase/supabase-js`, removed `@aws-sdk/*`, added dev deps |
| `next.config.js` | Removed Abacus-specific settings (`outputFileTracingRoot`, `distDir`, `output`) |
| `prisma/schema.prisma` | Removed `binaryTargets`/`output`, added `directUrl` for Supabase pooler |
| `lib/supabase.ts` | **NEW** — Supabase Storage client (replaces AWS S3) |
| `lib/s3.ts` | Now re-exports from `supabase.ts` (keeps existing imports working) |
| `lib/aws-config.ts` | Emptied (no longer needed) |
| `app/api/upload/presigned/route.ts` | Updated import to use Supabase |
| `app/layout.tsx` | Removed Abacus chat widget script tag |
| `.env.example` | New file with all required environment variables |
| `.gitignore` | New file for a clean Git repo |

---

## Ongoing Development Workflow

```bash
# Start local dev server:
npm run dev

# After making changes, push to GitHub:
git add . && git commit -m "your changes" && git push
# Vercel auto-deploys on every push to main

# If you change the Prisma schema:
npx prisma db push    # for development
# or
npx prisma migrate dev --name your_migration_name  # for production-grade migrations
```

---

## Cost Breakdown (Monthly)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Hobby (free) → Pro ($20/mo) | $0–$20 |
| Supabase | Free → Pro ($25/mo) | $0–$25 |
| Google Workspace | Starter | ~$7/user |
| Cloudflare | Free | $0 |
| **Total** | | **$7–$52/mo** |

The free tiers of Vercel and Supabase are generous enough for development and early production. Upgrade to paid tiers when you have real traffic.

---

## Troubleshooting

### "Prepared statement already exists" / connection pool errors
This happens with Supabase + Prisma when not using the transaction pooler URL. Make sure:
- `DATABASE_URL` uses port **6543** with `?pgbouncer=true`
- `DIRECT_URL` uses port **5432** (no pgbouncer parameter)

### Build fails on Vercel
Make sure all environment variables are set in Vercel project settings. The `prisma generate` command runs during `postinstall` which happens before `next build`.

### CORS errors on file upload
Make sure the Supabase storage bucket exists and has the correct policies. The service role key bypasses RLS but the bucket must exist.

### NextAuth redirect issues
Vercel auto-sets `NEXTAUTH_URL` in production. For local dev, set it to `http://localhost:3000` in `.env.local`.
