# RefuseLink — Deployment & Operations Guide

## Overview

RefuseLink is a multi-tenant SaaS customer engagement platform for waste management companies. Each subscribing company receives its own branded web application for employees and customers.

---

## Demo Credentials

### Platform (RefuseLink Internal)

| Role | Email | Password | URL |
|------|-------|----------|-----|
| Platform Owner | admin@refuselink.com | Platform@demo1 | /platform/sign-in |
| Platform Support | support@refuselink.com | Support@demo1 | /platform/sign-in |

### KC Disposal (Company)

| Role | Email | Password | URL |
|------|-------|----------|-----|
| Company Owner | sarah@kc-disposal.example.com | Employee@demo1 | /kc-disposal/sign-in |
| Company Admin | james@kc-disposal.example.com | Employee@demo2 | /kc-disposal/sign-in |
| CSR | emily@kc-disposal.example.com | CSR@demo1 | /kc-disposal/sign-in |
| Dispatcher | marcus@kc-disposal.example.com | Dispatch@demo1 | /kc-disposal/sign-in |
| Customer (Residential) | david@example.com | Customer@demo1 | /kc-disposal/sign-in |
| Customer (Commercial) | bob@riverside.example.com | Customer@demo2 | /kc-disposal/sign-in |

### Mountain High Disposal (Company)

| Role | Email | Password | URL |
|------|-------|----------|-----|
| Company Owner | alex@mountainhigh.example.com | Owner@demo1 | /mountain-high-disposal/sign-in |
| Company Manager | jen@mountainhigh.example.com | Manager@demo1 | /mountain-high-disposal/sign-in |
| Customer (Residential) | frank@example.com | Customer@demo3 | /mountain-high-disposal/sign-in |

---

## Route Map

### Public (Unauthenticated)

| Route | Description |
|-------|-------------|
| `/` | Marketing home page |
| `/features` | Feature overview |
| `/pricing` | Pricing plans |
| `/contact` | Contact form |

### Platform (RefuseLink Staff Only)

| Route | Description | Access |
|-------|-------------|--------|
| `/platform/sign-in` | Platform authentication | Public |
| `/platform` | Redirects to /platform/companies | Authenticated platform users |
| `/platform/companies` | Company management | platform_owner, platform_admin |
| `/platform/companies/[id]` | Company detail & status management | platform_owner, platform_admin |
| `/platform/plans` | Subscription plan management | platform_owner, platform_admin |
| `/platform/users` | Platform user management | platform_owner |
| `/platform/settings` | Platform settings | platform_owner, platform_admin |
| `/platform/audit-logs` | Audit log viewer | All platform roles |

### Company Employee Area

| Route | Description | Access |
|-------|-------------|--------|
| `/:companySlug/sign-in` | Company authentication (employees + customers) | Public |
| `/:companySlug/dashboard` | Employee dashboard | All company roles |
| `/:companySlug/customers` | Customer management | owner, admin, manager, csr, dispatcher |
| `/:companySlug/cities` | City management | owner, admin, manager |
| `/:companySlug/communities` | Community management | owner, admin, manager |
| `/:companySlug/announcements` | Announcement management | owner, admin, manager, csr (read) |
| `/:companySlug/documents` | Document management | owner, admin, manager, csr (read) |
| `/:companySlug/service-schedules` | Schedule management | owner, admin, manager, dispatcher |
| `/:companySlug/tickets` | Ticket management | All company roles |
| `/:companySlug/tickets/[id]` | Ticket detail with messaging | All company roles |
| `/:companySlug/employees` | Employee management | owner, admin |
| `/:companySlug/settings` | Company settings & branding | owner, admin |

### Customer Area

| Route | Description |
|-------|-------------|
| `/:companySlug/my` | Customer dashboard |
| `/:companySlug/my/profile` | Profile management & password change |
| `/:companySlug/my/announcements` | View published announcements |
| `/:companySlug/my/documents` | View & download documents |
| `/:companySlug/my/service-schedules` | View service schedules |
| `/:companySlug/my/tickets` | Create & view tickets |
| `/:companySlug/my/tickets/[id]` | Ticket detail & reply |

---

## Role & Permission Matrix

### Platform Roles

| Permission | Owner | Admin | Support | Sales |
|-----------|-------|-------|---------|-------|
| Manage companies | ✓ | ✓ | Read | Read |
| Manage plans | ✓ | ✓ | ✗ | ✗ |
| Manage platform users | ✓ | ✗ | ✗ | ✗ |
| View audit logs | ✓ | ✓ | ✓ | ✓ |
| Suspend/activate companies | ✓ | ✓ | ✗ | ✗ |

### Company Roles

| Permission | Owner | Admin | Manager | CSR | Dispatcher |
|-----------|-------|-------|---------|-----|------------|
| Dashboard | ✓ | ✓ | ✓ | ✓ | ✓ |
| Manage customers | ✓ | ✓ | ✓ | ✓ | Read |
| Manage cities | ✓ | ✓ | ✓ | ✗ | ✗ |
| Manage communities | ✓ | ✓ | ✓ | ✗ | ✗ |
| Manage announcements | ✓ | ✓ | ✓ | Read | ✗ |
| Manage documents | ✓ | ✓ | ✓ | Read | ✗ |
| Manage schedules | ✓ | ✓ | ✓ | ✗ | ✓ |
| Manage tickets | ✓ | ✓ | ✓ | ✓ | Status only |
| Manage employees | ✓ | ✓ | ✗ | ✗ | ✗ |
| Company settings | ✓ | ✓ | ✗ | ✗ | ✗ |

---

## Database Schema Summary

### Core Tables

| Table | Description |
|-------|-------------|
| PlatformUser | RefuseLink internal staff |
| Plan | Subscription plan definitions |
| Company | Subscribing waste management companies |
| CompanyBranding | Company visual identity & contact info |
| Subscription | Company plan subscriptions |
| CompanyUser | Company employees |
| City | Service area cities |
| Community | HOAs, subdivisions within cities |
| Customer | Service accounts (residential/commercial/roll-off) |
| CustomerUser | Customer login accounts |
| CustomerUserAccess | Links customer users to service accounts (M2M) |
| Announcement | Company announcements with targeting |
| Document | Uploaded files with targeting |
| ServiceSchedule | Pickup schedules |
| ScheduleException | Holiday/exception dates for schedules |
| Ticket | Support tickets |
| TicketMessage | Ticket conversation messages |
| TicketAttachment | File attachments on messages |
| AuditLog | Administrative action audit trail |

### Key Relationships

- Company → CompanyUser (1:N)
- Company → Customer (1:N)
- Customer → CustomerUserAccess ← CustomerUser (M:N)
- City → Community (1:N)
- Customer → City (optional FK, for residential)
- Customer → Community (optional FK, for residential)
- Ticket → TicketMessage → TicketAttachment (1:N:N)

---

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| DATABASE_URL | PostgreSQL connection string | Yes |
| NEXTAUTH_SECRET | JWT signing secret | Yes |
| NEXTAUTH_URL | Application base URL (auto-configured) | Auto |
| AWS_ACCESS_KEY_ID | S3 file storage | For uploads |
| AWS_SECRET_ACCESS_KEY | S3 file storage | For uploads |
| AWS_REGION | S3 region | For uploads |
| S3_BUCKET_NAME | S3 bucket name | For uploads |

---

## Security Implementation

- **Password hashing**: bcrypt with saltRounds: 12
- **Session**: JWT-based via NextAuth.js, 24-hour expiry
- **Tenant isolation**: Middleware validates company slug + session match before any page renders; all queries scoped to companyId
- **File validation**: Allowed types (PDF, JPG, PNG, WEBP, GIF), max 10MB
- **Input validation**: Zod schemas on all server actions
- **Authorization**: Server-side role checks on every mutation
- **Audit logging**: Key administrative actions logged asynchronously

---

## Known Limitations

1. **File storage**: MVP uses presigned S3 URLs; document upload requires S3 configuration. Seed documents use placeholder entries.
2. **No payment processing**: Plan structure exists but Stripe/payment integration is deferred.
3. **No email notifications**: Not yet implemented; planned for production.
4. **No SMS**: Feature flag exists in plan features but not implemented.
5. **No background jobs**: Deferred.
6. **No CI/CD pipeline**: Manual deployment via Abacus AI platform.
7. **Ticket attachments**: File upload UI for ticket photos not yet connected.
8. **Announcement/document targeting**: Stored in database but customer-side filtering by target audiences is approximate (all published items shown to all customers of the company).
9. **Logo upload**: Branding supports logo URL field but upload UI for logo images is deferred.
10. **No rate limiting**: Production should add rate limiting to auth endpoints.

---

## Deferred Features

- Stripe payment integration
- SMS notifications via Twilio
- Background job processing
- Email notification system
- Full-text search
- Advanced analytics dashboard
- API documentation & external API access
- White-label / custom domain support
- File attachment upload on ticket creation
- Logo image upload for company branding
- Customer-side announcement/document audience filtering
- Platform impersonation (explicitly excluded by design)
- CI/CD pipeline configuration
- Automated test suite (unit + integration)

---

## Architecture Decisions

1. **Three separate user tables** (PlatformUser, CompanyUser, CustomerUser) for hard privilege separation
2. **Middleware-first tenant isolation** — validates before any page renders
3. **Server Actions for mutations** — no separate REST API layer needed for MVP
4. **CustomerUser → Customer is M:N** via CustomerUserAccess for multi-account access
5. **Plan limits as nullable integers** — null means unlimited (Enterprise)
6. **Targeting via typed arrays** on announcement/document records
7. **Async audit logging** — fire-and-forget, never blocks mutations
8. **Ticket numbers as TKT-NNNNN** — company-scoped sequence
9. **Company slug as the only routing key** — internal code never exposed in URLs
10. **No cross-company redirects** — wrong-company credentials rejected with generic error
