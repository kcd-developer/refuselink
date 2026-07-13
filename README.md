# RefuseLink

RefuseLink is a multi-tenant SaaS platform for waste and recycling companies. It gives RefuseLink staff a platform administration portal, gives each waste company a branded employee portal, and gives customers a self-service portal for schedules, announcements, documents, and support tickets.

## Contents

- [Product overview](#product-overview)
- [Technology stack](#technology-stack)
- [Application portals and routes](#application-portals-and-routes)
- [Roles and access](#roles-and-access)
- [Local development](#local-development)
- [Environment variables](#environment-variables)
- [Supabase setup](#supabase-setup)
- [Database migrations and seed data](#database-migrations-and-seed-data)
- [Address management and CSV imports](#address-management-and-csv-imports)
- [Email delivery with Resend](#email-delivery-with-resend)
- [Document storage](#document-storage)
- [Deployment to Vercel](#deployment-to-vercel)
- [Production readiness checklist](#production-readiness-checklist)
- [Project commands](#project-commands)
- [Architecture](#architecture)
- [Troubleshooting](#troubleshooting)
- [Known limitations](#known-limitations)

## Product overview

RefuseLink currently includes three distinct application experiences.

### Platform administration

RefuseLink staff can:

- Manage waste companies and company status.
- Review company subscriptions and plans.
- Manage platform users.
- View platform and tenant audit activity.
- Copy the complete sign-in URL for each company portal.

### Waste company employee portal

Company employees can manage:

- Customers and customer service accounts.
- Service addresses, including CSV imports.
- Cities and communities such as HOAs or subdivisions.
- Announcements and targeted documents.
- Service schedules and schedule exceptions.
- Customer support tickets and ticket conversations.
- Employees, company branding, and contact information.

The features visible to an employee depend on their company role.

### Customer portal

Customers can:

- View their account dashboard.
- Read announcements.
- Access documents.
- View service schedules.
- Open support tickets and reply to messages.
- Manage their profile and password.

## Technology stack

| Layer | Technology |
| --- | --- |
| Application | Next.js 15 App Router |
| UI | React 18, TypeScript, Tailwind CSS, Radix UI, Lucide icons |
| Authentication | NextAuth.js v4 credentials provider with JWT sessions |
| Database ORM | Prisma 6 |
| Database | Supabase PostgreSQL |
| File storage | Supabase Storage |
| Transactional email | Resend |
| Validation | Zod |
| Password hashing | bcryptjs with 12 rounds |
| Hosting | Vercel |
| DNS | Cloudflare |
| Runtime | Node.js 22 |

## Application portals and routes

For local development, replace `https://refuselink.com` with `http://localhost:3000`.

### Public pages

| Route | Purpose |
| --- | --- |
| `/` | Marketing homepage |
| `/features` | Feature overview |
| `/pricing` | Pricing page |
| `/contact` | Sales contact form |

### Platform portal

| Route | Purpose |
| --- | --- |
| `/platform/sign-in` | RefuseLink staff sign-in |
| `/platform/companies` | Company management |
| `/platform/companies/[id]` | Company detail and portal URL |
| `/platform/plans` | Subscription plans |
| `/platform/users` | Platform users |
| `/platform/audit-logs` | Audit activity |
| `/platform/settings` | Platform settings |

### Company employee portal

Every company is addressed by its unique slug. For example, the KC Disposal portal is:

```text
https://refuselink.com/kc-disposal/sign-in
```

| Route | Purpose |
| --- | --- |
| `/[companySlug]/sign-in` | Shared employee/customer sign-in |
| `/[companySlug]/dashboard` | Employee dashboard |
| `/[companySlug]/customers` | Customer accounts |
| `/[companySlug]/addresses` | Service addresses and CSV import |
| `/[companySlug]/cities` | Service cities |
| `/[companySlug]/communities` | Communities and HOAs |
| `/[companySlug]/announcements` | Announcements |
| `/[companySlug]/documents` | Documents |
| `/[companySlug]/service-schedules` | Service schedules |
| `/[companySlug]/tickets` | Support tickets |
| `/[companySlug]/employees` | Company employees |
| `/[companySlug]/settings` | Branding and company settings |

### Customer portal

| Route | Purpose |
| --- | --- |
| `/[companySlug]/my` | Customer dashboard |
| `/[companySlug]/my/announcements` | Published announcements |
| `/[companySlug]/my/documents` | Published documents |
| `/[companySlug]/my/service-schedules` | Service schedules |
| `/[companySlug]/my/tickets` | Customer tickets |
| `/[companySlug]/my/profile` | Customer profile |

The sign-in page detects whether the supplied credentials belong to an employee or customer and redirects to the correct portal.

## Roles and access

### Platform roles

- `platform_owner`
- `platform_admin`
- `platform_support`
- `platform_sales`

### Company roles

- `company_owner`
- `company_admin`
- `company_manager`
- `csr`
- `dispatcher`

Owners, admins, and managers can manage addresses, cities, and communities. Employee navigation and every server-side mutation also perform role checks. Customer users cannot access employee pages, company employees cannot enter the customer area, and platform users are kept in the platform portal.

## Local development

### Requirements

- Node.js `22.x`
- npm
- A Supabase project
- A Resend account if contact-form delivery is needed locally

The repository includes an `.nvmrc` file. With `nvm` installed:

```bash
nvm install
nvm use
node --version
```

The reported Node version should begin with `v22`.

### Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Before the application can query data, create `.env.local` and initialize the Supabase database as described below. Environment files are ignored by Git and must never be committed.

## Environment variables

Create `.env.local` in the project root:

```dotenv
# Supabase PostgreSQL
DATABASE_URL="postgresql://...transaction-pooler..."
DIRECT_URL="postgresql://...direct-or-session-connection..."

# Supabase API and Storage
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"
SUPABASE_STORAGE_BUCKET="documents"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="GENERATE_A_LONG_RANDOM_SECRET"

# Resend contact-form email
RESEND_API_KEY="re_..."
CONTACT_FROM_EMAIL="RefuseLink Website <website@send.refuselink.com>"
CONTACT_TO_EMAIL="sales@refuselink.com"
```

### Variable reference

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Yes | Supabase transaction-pooler PostgreSQL URL used by the running application. |
| `DIRECT_URL` | Yes | Direct/session PostgreSQL URL used by Prisma schema operations. |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL. This value is safe to expose to the browser. |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Server-only Supabase service key used for Storage. Never prefix it with `NEXT_PUBLIC_`. |
| `SUPABASE_STORAGE_BUCKET` | Yes | Storage bucket name. The expected value is `documents`. |
| `NEXTAUTH_URL` | Yes | Full canonical application URL. Use localhost locally and the production URL on Vercel. |
| `NEXTAUTH_SECRET` | Yes | Secret used to sign and encrypt authentication tokens. |
| `RESEND_API_KEY` | For contact email | Server-only Resend API key. |
| `CONTACT_FROM_EMAIL` | For contact email | Sender on the verified Resend domain. |
| `CONTACT_TO_EMAIL` | For contact email | Mailbox or alias that receives sales inquiries. |

Generate a NextAuth secret with:

```bash
openssl rand -base64 32
```

Do not expose `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXTAUTH_SECRET`, or `RESEND_API_KEY` in client-side code, screenshots, logs, or Git commits.

## Supabase setup

### 1. Create the project

Create a Supabase project and save the database password in a password manager.

### 2. Copy the database connection strings

Use the Supabase **Connect** dialog or database settings to obtain:

- A transaction-pooler connection string for `DATABASE_URL`.
- A direct or session connection string for `DIRECT_URL`.

If Supabase includes a password placeholder, replace it with the actual database password. URL-encode special characters in the password.

### 3. Copy the project API settings

From the Supabase project settings, copy:

- Project URL → `NEXT_PUBLIC_SUPABASE_URL`
- Service role key → `SUPABASE_SERVICE_ROLE_KEY`

The service role key is intentionally used only in server code.

### 4. Create the Storage bucket

In **Storage**, create a bucket named `documents`.

- Keep the bucket private.
- The application creates signed upload and download URLs server-side.
- The service role key bypasses Storage RLS, while application routes enforce authentication.

## Database migrations and seed data

The SQL files are designed to be pasted into the Supabase SQL Editor. They are not idempotent unless explicitly stated, so do not rerun them after a successful execution.

### Fresh Supabase database

For a brand-new database:

1. Open **Supabase → SQL Editor → New query**.
2. Paste and run the entire `prisma/supabase-migration.sql` file.
3. If Supabase displays its table-security warning, choose **Run and enable RLS**.
4. Open another new query.
5. Paste and run the entire `prisma/supabase-seed.sql` file if demo data is wanted.

The current base migration already includes the `Address` table. Do **not** run `supabase-addresses-migration.sql` on a fresh database after using the current base migration.

### Existing database created before address management

If `supabase-migration.sql` was run before the Address feature was added:

1. Open **Supabase → SQL Editor → New query**.
2. Paste and run the entire `prisma/supabase-addresses-migration.sql` file once.

That incremental migration creates the `Address` table, indexes, foreign keys, and enables RLS for the new table.

### Seed data options

There are two supported seed paths:

- `prisma/supabase-seed.sql` can be pasted into the Supabase SQL Editor on a freshly migrated database.
- `npm run db:seed` executes `scripts/seed.ts` using Prisma and is designed around upserts and existence checks.

Do not combine seed methods on the same database unless you have reviewed the resulting records. The SQL seed is intended to run once on a fresh schema.

### Demo credentials

The bundled seed data contains development accounts. These credentials are public to anyone who can read the repository and must be changed or removed before production launch.

#### Platform

| Role | Email | Password | Path |
| --- | --- | --- | --- |
| Owner | `admin@refuselink.com` | `Platform@demo1` | `/platform/sign-in` |
| Support | `support@refuselink.com` | `Support@demo1` | `/platform/sign-in` |

#### KC Disposal

| Role | Email | Password | Path |
| --- | --- | --- | --- |
| Company owner | `sarah@kc-disposal.example.com` | `Employee@demo1` | `/kc-disposal/sign-in` |
| Company admin | `james@kc-disposal.example.com` | `Employee@demo2` | `/kc-disposal/sign-in` |
| CSR | `emily@kc-disposal.example.com` | `CSR@demo1` | `/kc-disposal/sign-in` |
| Dispatcher | `marcus@kc-disposal.example.com` | `Dispatch@demo1` | `/kc-disposal/sign-in` |
| Customer | `david@example.com` | `Customer@demo1` | `/kc-disposal/sign-in` |
| Customer | `bob@riverside.example.com` | `Customer@demo2` | `/kc-disposal/sign-in` |

#### Mountain High Disposal

| Role | Email | Password | Path |
| --- | --- | --- | --- |
| Company owner | `alex@mountainhigh.example.com` | `Owner@demo1` | `/mountain-high-disposal/sign-in` |
| Company manager | `jen@mountainhigh.example.com` | `Manager@demo1` | `/mountain-high-disposal/sign-in` |
| Customer | `frank@example.com` | `Customer@demo3` | `/mountain-high-disposal/sign-in` |

## Address management and CSV imports

Company owners, admins, and managers can open `/<companySlug>/addresses` to add addresses individually or import a CSV file.

### Single-address entry

Each address contains:

- Street address
- Optional address line 2
- City
- State
- Optional ZIP code
- Optional existing community

If the city/state combination does not already exist for the company, it is created automatically. A community can only be assigned when it belongs to the same city.

### CSV format

Use the downloadable template on the Addresses page or create a UTF-8 CSV with these columns:

```csv
address,address2,city,state,zipCode,community
123 Main St,,Kansas City,KS,66101,
456 Oak Ave,Apt 2,Kansas City,KS,66102,Example HOA
```

Required columns:

- `address`
- `city`
- `state`

Optional columns:

- `address2`
- `zipCode`
- `community`

The importer also recognizes common headings such as `street`, `address1`, `unit`, `suite`, `zip`, and `postalCode`.

Import behavior:

- Up to 1,000 rows can be imported at once.
- Missing cities are created automatically.
- A community named in the CSV must already exist in the same city.
- The import form can assign every imported row to one existing community instead.
- The selected community must match each row's city.
- Duplicate addresses are skipped.
- Invalid or skipped rows are reported with their CSV row number.

## Email delivery with Resend

The public contact form sends sales inquiries through Resend.

The expected setup is:

- Verified sending domain: `send.refuselink.com`
- Sender: `website@send.refuselink.com`
- Recipient: `sales@refuselink.com`

The sender does not need to be a mailbox. It must belong to a domain verified in Resend. The recipient can be a real mailbox or an email alias.

After changing Resend environment variables, restart the local development server or redeploy Vercel. Test delivery by submitting `/contact`, then confirm the message appears in both Resend logs and the destination inbox.

The contact form includes server-side Zod validation, HTML escaping, a honeypot field, and `Reply-To` set to the visitor's email address. It does not currently include IP-based rate limiting.

## Document storage

Document uploads use Supabase Storage through server-generated signed URLs.

- Default bucket: `documents`
- Supported types: PDF, JPEG, PNG, WebP, and GIF
- The Supabase service role key remains on the server.
- Private files receive time-limited signed download URLs.

Seeded document records use placeholder URLs and are not real uploaded files.

## Deployment to Vercel

### 1. Push the repository

Push the current project to a private GitHub repository. Confirm `.env.local` is not staged:

```bash
git status
git ls-files .env.local
```

The second command should return no output.

### 2. Import into Vercel

Create a Vercel project from the GitHub repository. Vercel should detect Next.js automatically.

Recommended settings:

| Setting | Value |
| --- | --- |
| Framework preset | Next.js |
| Install command | `npm install` |
| Build command | `npm run build` |
| Node.js version | 22.x |

### 3. Add production environment variables

Add every variable listed in [Environment variables](#environment-variables) to the Vercel project. Production-specific values should include:

```dotenv
NEXTAUTH_URL="https://refuselink.com"
CONTACT_FROM_EMAIL="RefuseLink Website <website@send.refuselink.com>"
CONTACT_TO_EMAIL="sales@refuselink.com"
```

Use production values for Production and appropriate isolated values for Preview and Development environments. Avoid connecting untrusted preview deployments to production data.

### 4. Deploy and attach the domain

Deploy once using the Vercel-generated domain. Then add:

- `refuselink.com`
- `www.refuselink.com`, if wanted

Follow the exact DNS records shown by Vercel in Cloudflare. Choose one canonical domain and configure the other to redirect to it.

The company portal URL shown in platform administration uses `window.location.origin`; therefore it automatically displays localhost locally and the active Vercel/custom domain in production.

### 5. Verify production

Test at minimum:

1. Marketing pages and contact email delivery.
2. Platform sign-in and company management.
3. One employee sign-in for every company role.
4. One customer sign-in.
5. Tenant separation by attempting to use a valid account with the wrong company slug.
6. Address creation, automatic city creation, community assignment, and CSV import.
7. Announcement, schedule, document, and ticket workflows.
8. Sign-out and session expiration.

## Production readiness checklist

Complete these items before allowing real customers to use the application:

- [ ] Remove or rotate every demo account and password.
- [ ] Use a unique production `NEXTAUTH_SECRET`.
- [ ] Confirm `.env.local` and all secrets are excluded from Git.
- [ ] Restrict access to the Supabase service role key.
- [ ] Confirm the production database connection uses the intended Supabase pooler.
- [ ] Enable Supabase backups and point-in-time recovery appropriate to the service tier.
- [ ] Keep the `documents` bucket private unless a deliberate public-file feature is introduced.
- [ ] Confirm the Resend domain remains verified and SPF/DKIM records are healthy.
- [ ] Add rate limiting to authentication, contact, ticket-message, and upload endpoints.
- [ ] Add monitoring and alerting for Vercel, Supabase, and Resend failures.
- [ ] Add automated tests and a CI workflow.
- [ ] Review data retention, privacy, terms of service, and breach-response requirements.
- [ ] Establish a repeatable migration and rollback process before future schema changes.
- [ ] Test database restoration rather than assuming backups are usable.

## Project commands

| Command | Purpose |
| --- | --- |
| `npm install` | Install dependencies and generate Prisma Client. |
| `npm run dev` | Start the local development server. |
| `npm run lint` | Run ESLint across the repository. |
| `npm run build` | Generate Prisma Client and create a production Next.js build. |
| `npm start` | Start an already-built production server. |
| `npm run db:push` | Synchronize the Prisma schema directly to the configured database. Use with care. |
| `npm run db:migrate` | Apply committed Prisma migrations, if migration files are introduced. |
| `npm run db:seed` | Run the TypeScript demo seed. Never run casually against production. |
| `npm run db:studio` | Open Prisma Studio for the configured database. |

Before committing significant changes:

```bash
npm run lint
npm run build
git diff --check
```

## Architecture

### Multi-tenancy

Every tenant-owned record is scoped by `companyId`. Company routes include the company slug, and middleware verifies that the authenticated session belongs to that slug. Server actions repeat authorization and tenant checks before mutations.

Three separate user tables provide privilege separation:

- `PlatformUser` for RefuseLink staff.
- `CompanyUser` for waste company employees.
- `CustomerUser` for customer login identities.

`CustomerUserAccess` links customer identities to one or more customer service accounts.

### Authentication

Authentication uses the NextAuth credentials provider.

- Passwords are stored as bcrypt hashes.
- Sessions use signed JWTs.
- Sessions expire after 24 hours.
- The JWT stores user type, role, company ID, and company slug.
- Company status is checked during company authentication.

### Data model overview

Important models include:

- Platform: `PlatformUser`, `Plan`, `Company`, `Subscription`, `AuditLog`
- Company identity: `CompanyBranding`, `CompanyUser`
- Service area: `City`, `Community`, `Address`
- Customers: `Customer`, `CustomerUser`, `CustomerUserAccess`
- Communication: `Announcement`, `Document`
- Operations: `ServiceSchedule`, `ScheduleException`
- Support: `Ticket`, `TicketMessage`, `TicketAttachment`

The canonical schema is `prisma/schema.prisma`.

### Application structure

```text
app/
  [companySlug]/              Tenant employee and customer portals
  api/                        Authentication, contact, upload, and ticket APIs
  platform/                   RefuseLink platform portal
components/
  layouts/                    Platform, company, and customer navigation
  ui/                         Shared UI primitives
lib/
  actions/                    Authenticated server actions
  auth.ts                     NextAuth configuration
  db.ts                       Prisma client
  supabase.ts                 Supabase Storage integration
prisma/
  schema.prisma               Canonical Prisma schema
  supabase-migration.sql      Fresh-database SQL migration
  supabase-seed.sql           Fresh-database demo seed
  supabase-addresses-migration.sql  Incremental Address migration
scripts/
  seed.ts                     Prisma demo seed
```

## Troubleshooting

### `The table public.Address does not exist`

The application code has been updated but the existing database has not. Run the entire `prisma/supabase-addresses-migration.sql` file once in the Supabase SQL Editor.

### Prisma cannot connect to Supabase

Check that:

- `DATABASE_URL` is the transaction-pooler URL.
- `DIRECT_URL` is the direct/session URL.
- The database password is correct and URL-encoded.
- The Supabase project is running and the current network supports its connection mode.

Restart the development server after changing database variables.

### Sign-in loops or redirects to the wrong host

Verify:

- `NEXTAUTH_URL` exactly matches the active origin.
- `NEXTAUTH_SECRET` exists and is consistent across deployments.
- Cookies from a previous local or preview environment have been cleared.
- The user belongs to the company slug in the URL.

### Contact form says email delivery is unavailable

Confirm all three Resend variables are present, the API key is active, and `CONTACT_FROM_EMAIL` uses the verified `send.refuselink.com` domain. Restart or redeploy after changing variables.

### Supabase SQL Editor reports a system-trigger permission error

Do not disable or re-enable all triggers in hosted Supabase. Use the current `prisma/supabase-seed.sql`, which orders records to satisfy foreign keys without modifying system triggers.

### SQL migration says an object already exists

The migration was probably already applied. Do not repeatedly rerun one-time migration files. Inspect the Supabase Table Editor or migration history before making changes.

### Node or dependency warnings

Use Node 22:

```bash
nvm use
npm install
```

Do not use `npm audit fix --force` without reviewing the proposed major-version changes and verifying the application afterward.

## Known limitations

- Subscription plans exist, but payment processing and Stripe integration are not implemented.
- The contact form sends sales inquiries; broader operational email notifications are not implemented.
- SMS notifications and background jobs are not implemented.
- Account provisioning is administrator-managed; there is no public self-service signup.
- Password reset and email-verification workflows are not implemented.
- Rate limiting is not yet implemented.
- There is no automated test suite or CI pipeline in the repository.
- Seeded document entries are placeholders rather than real files.
- Advanced reporting, analytics, external API access, and custom tenant domains remain future work.

## Additional documentation

- `DEPLOYMENT.md` contains earlier product and route notes.
- `MIGRATION.md` records the original Vercel/Supabase migration process.

Where those older documents conflict with this README or the source code, treat this README and the current source code as authoritative.

## License

No open-source license is currently included. Unless a license is added, this project should be treated as proprietary software.
