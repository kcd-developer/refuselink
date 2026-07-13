-- ============================================================================
-- RefuseLink — Starter / Demo Seed Data for Supabase
-- ============================================================================
-- RUN THIS *AFTER* running supabase-migration.sql (which creates the tables).
--
-- HOW TO USE:
--   1. Supabase dashboard  ->  SQL Editor  ->  New query
--   2. Paste this ENTIRE file and click  Run
--
-- This inserts the subscription plans, demo companies, staff/employee logins,
-- customer logins, and sample content so you have a working environment.
--
-- LOGIN ACCOUNTS INCLUDED (password shown in plain text for your reference;
-- the stored values are securely hashed):
--   Platform staff:
--     admin@refuselink.com      / Platform@demo1
--     support@refuselink.com    / Support@demo1
--   Company & customer demo logins are documented in DEPLOYMENT / MIGRATION guides.
--
-- Records are ordered to satisfy foreign-key constraints without disabling
-- PostgreSQL system triggers, which is not permitted on hosted Supabase.
-- Run once on a freshly-migrated database.
-- ============================================================================

--
-- PostgreSQL database dump
--


-- Dumped from database version 17.9 (Ubuntu 17.9-1.pgdg24.04+1)
-- Dumped by pg_dump version 17.10 (Debian 17.10-1.pgdg12+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: Company; Type: TABLE DATA; Schema: public; Owner: -
--

SET SESSION AUTHORIZATION DEFAULT;


INSERT INTO public."Company" (id, name, slug, code, status, "createdAt", "updatedAt") VALUES ('cmrj6z8rt0006zx485oaumbfw', 'KC Disposal', 'kc-disposal', 'KCD001', 'active', '2026-07-13 12:21:52.553', '2026-07-13 12:21:52.553');
INSERT INTO public."Company" (id, name, slug, code, status, "createdAt", "updatedAt") VALUES ('cmrj6za3b001vzx48548q0nye', 'Mountain High Disposal', 'mountain-high-disposal', 'MHD001', 'active', '2026-07-13 12:21:54.263', '2026-07-13 12:21:54.263');
INSERT INTO public."Company" (id, name, slug, code, status, "createdAt", "updatedAt") VALUES ('cmrj9fko90000mv0777km0h4z', 'Curbside Waste', 'curbside-waste', 'CUR001', 'trial', '2026-07-13 13:30:33.705', '2026-07-13 13:30:33.705');



--
-- Data for Name: Announcement; Type: TABLE DATA; Schema: public; Owner: -
--


INSERT INTO public."Announcement" (id, "companyId", title, content, priority, "startDate", "endDate", "isPublished", "targetAll", "targetTypes", "targetCityIds", "targetCommunityIds", "createdById", "createdAt", "updatedAt") VALUES ('cmrj6za290016zx48a9esjret', 'cmrj6z8rt0006zx485oaumbfw', 'Holiday Schedule Changes - Thanksgiving Week', 'Please note that trash and recycling pickup will be delayed by one day during Thanksgiving week (November 25-29). Monday routes will be collected Tuesday, Tuesday routes on Wednesday, and so on. Thursday and Friday routes will be collected on Friday and Saturday respectively. Please have your bins out by 6 AM on your adjusted collection day.', 'high', '2024-11-18 00:00:00', '2024-11-30 00:00:00', true, true, '{}', '{}', '{}', 'cmrj6z8zz000kzx48zjtmaypg', '2026-07-13 12:21:54.226', '2026-07-13 12:21:54.226');
INSERT INTO public."Announcement" (id, "companyId", title, content, priority, "startDate", "endDate", "isPublished", "targetAll", "targetTypes", "targetCityIds", "targetCommunityIds", "createdById", "createdAt", "updatedAt") VALUES ('cmrj6za2d0018zx48a6avjwei', 'cmrj6z8rt0006zx485oaumbfw', 'New Recycling Guidelines Effective January 1', 'Starting January 1, 2025, we are updating our recycling program. Accepted materials now include cardboard, paper, plastic #1-#5, aluminum cans, and glass bottles. Please ensure all items are clean and dry. Plastic bags and styrofoam are NOT accepted in curbside recycling. Visit our website for the complete guide.', 'normal', '2024-12-15 00:00:00', NULL, true, true, '{}', '{}', '{}', 'cmrj6z8zz000kzx48zjtmaypg', '2026-07-13 12:21:54.229', '2026-07-13 12:21:54.229');
INSERT INTO public."Announcement" (id, "companyId", title, content, priority, "startDate", "endDate", "isPublished", "targetAll", "targetTypes", "targetCityIds", "targetCommunityIds", "createdById", "createdAt", "updatedAt") VALUES ('cmrj6za2g001azx48vyvaky0r', 'cmrj6z8rt0006zx485oaumbfw', 'Brookside HOA Special Pickup - December 28', 'A special bulk item pickup has been arranged for Brookside HOA residents on December 28. Please place large items (furniture, appliances, etc.) curbside by 7 AM. Maximum of 3 bulk items per household. Contact us to schedule if you have more items.', 'normal', '2024-12-20 00:00:00', '2024-12-28 00:00:00', true, false, '{}', '{}', '{cmrj6z8sh000gzx48u1l7yplt}', 'cmrj6z8zz000kzx48zjtmaypg', '2026-07-13 12:21:54.233', '2026-07-13 12:21:54.233');
INSERT INTO public."Announcement" (id, "companyId", title, content, priority, "startDate", "endDate", "isPublished", "targetAll", "targetTypes", "targetCityIds", "targetCommunityIds", "createdById", "createdAt", "updatedAt") VALUES ('cmrj6zaq6002kzx4805fo21pf', 'cmrj6za3b001vzx48548q0nye', 'Welcome to Mountain High Disposal Customer Portal!', 'Welcome to our new online customer service center! Here you can view your service schedule, check announcements, access important documents, and submit service requests. If you have any questions, please don''t hesitate to create a support ticket or call us at (303) 555-0200.', 'normal', '2024-03-01 00:00:00', NULL, true, true, '{}', '{}', '{}', 'cmrj6zab20027zx48s5omm5fs', '2026-07-13 12:21:55.086', '2026-07-13 12:21:55.086');



--
-- Data for Name: AuditLog; Type: TABLE DATA; Schema: public; Owner: -
--


INSERT INTO public."AuditLog" (id, "companyId", "actorId", "actorType", "actorName", action, "entityType", "entityId", metadata, "ipAddress", "createdAt") VALUES ('cmrj9fkog0004mv07gqsv5a6w', NULL, 'cmrj6z8cd0000zx48fw0doqe3', 'platform', 'RefuseLink Admin', 'create', 'company', 'cmrj9fko90000mv0777km0h4z', 'null', NULL, '2026-07-13 13:30:33.713');
INSERT INTO public."AuditLog" (id, "companyId", "actorId", "actorType", "actorName", action, "entityType", "entityId", metadata, "ipAddress", "createdAt") VALUES ('cmrj9jc6e0006mv073atfes40', 'cmrj6z8rt0006zx485oaumbfw', 'cmrj6z8zz000kzx48zjtmaypg', 'employee', 'Sarah Mitchell', 'ticket_update', 'Ticket', 'cmrj6za37001szx48crtuh7iv', '{"assignedToId": "cmrj6z8zz000kzx48zjtmaypg"}', NULL, '2026-07-13 13:33:29.319');



--
-- Data for Name: City; Type: TABLE DATA; Schema: public; Owner: -
--


INSERT INTO public."City" (id, "companyId", name, state, "createdAt", "updatedAt") VALUES ('cmrj6z8s8000czx487kscdtn2', 'cmrj6z8rt0006zx485oaumbfw', 'Kansas City', 'MO', '2026-07-13 12:21:52.568', '2026-07-13 12:21:52.568');
INSERT INTO public."City" (id, "companyId", name, state, "createdAt", "updatedAt") VALUES ('cmrj6z8sc000ezx48dk7fo7rx', 'cmrj6z8rt0006zx485oaumbfw', 'Lee''s Summit', 'MO', '2026-07-13 12:21:52.573', '2026-07-13 12:21:52.573');
INSERT INTO public."City" (id, "companyId", name, state, "createdAt", "updatedAt") VALUES ('cmrj6za3k0021zx4848x6v4h3', 'cmrj6za3b001vzx48548q0nye', 'Denver', 'CO', '2026-07-13 12:21:54.272', '2026-07-13 12:21:54.272');
INSERT INTO public."City" (id, "companyId", name, state, "createdAt", "updatedAt") VALUES ('cmrj6za3n0023zx48itg2sbgy', 'cmrj6za3b001vzx48548q0nye', 'Boulder', 'CO', '2026-07-13 12:21:54.276', '2026-07-13 12:21:54.276');



--
-- Data for Name: Community; Type: TABLE DATA; Schema: public; Owner: -
--


INSERT INTO public."Community" (id, "companyId", "cityId", name, "createdAt", "updatedAt") VALUES ('cmrj6z8sh000gzx48u1l7yplt', 'cmrj6z8rt0006zx485oaumbfw', 'cmrj6z8s8000czx487kscdtn2', 'Brookside HOA', '2026-07-13 12:21:52.577', '2026-07-13 12:21:52.577');
INSERT INTO public."Community" (id, "companyId", "cityId", name, "createdAt", "updatedAt") VALUES ('cmrj6z8sk000izx48mu3l44x1', 'cmrj6z8rt0006zx485oaumbfw', 'cmrj6z8sc000ezx48dk7fo7rx', 'Summit Ridge HOA', '2026-07-13 12:21:52.581', '2026-07-13 12:21:52.581');
INSERT INTO public."Community" (id, "companyId", "cityId", name, "createdAt", "updatedAt") VALUES ('cmrj6za3s0025zx48q8jdvr3n', 'cmrj6za3b001vzx48548q0nye', 'cmrj6za3k0021zx4848x6v4h3', 'Highlands Ranch HOA', '2026-07-13 12:21:54.281', '2026-07-13 12:21:54.281');



--
-- Data for Name: CompanyBranding; Type: TABLE DATA; Schema: public; Owner: -
--


INSERT INTO public."CompanyBranding" (id, "companyId", "logoUrl", "primaryColor", "secondaryColor", "supportPhone", "supportEmail", website, "updatedAt") VALUES ('cmrj6z8rx0008zx48qhf1g8nw', 'cmrj6z8rt0006zx485oaumbfw', NULL, '#1D4ED8', '#93C5FD', '(816) 555-0100', 'support@kcdisposal.example.com', NULL, '2026-07-13 12:21:52.558');
INSERT INTO public."CompanyBranding" (id, "companyId", "logoUrl", "primaryColor", "secondaryColor", "supportPhone", "supportEmail", website, "updatedAt") VALUES ('cmrj6za3e001xzx48z4tcfsxi', 'cmrj6za3b001vzx48548q0nye', NULL, '#047857', '#6EE7B7', '(303) 555-0200', 'support@mountainhigh.example.com', NULL, '2026-07-13 12:21:54.266');
INSERT INTO public."CompanyBranding" (id, "companyId", "logoUrl", "primaryColor", "secondaryColor", "supportPhone", "supportEmail", website, "updatedAt") VALUES ('cmrj9fkod0002mv07gk2ldlku', 'cmrj9fko90000mv0777km0h4z', NULL, '#0F172A', '#3B82F6', NULL, NULL, NULL, '2026-07-13 13:30:33.709');



--
-- Data for Name: CompanyUser; Type: TABLE DATA; Schema: public; Owner: -
--


INSERT INTO public."CompanyUser" (id, "companyId", email, password, name, role, "isActive", "createdAt", "updatedAt") VALUES ('cmrj6z8zz000kzx48zjtmaypg', 'cmrj6z8rt0006zx485oaumbfw', 'sarah@kc-disposal.example.com', '$2a$12$5xxgTu2HE4l6Rw0Ibf6d9eKucWm0b8MeUF5Hwmr3YdeUmqiG3Tjgy', 'Sarah Mitchell', 'company_owner', true, '2026-07-13 12:21:52.848', '2026-07-13 12:21:52.848');
INSERT INTO public."CompanyUser" (id, "companyId", email, password, name, role, "isActive", "createdAt", "updatedAt") VALUES ('cmrj6z97p000mzx48qpw11g3o', 'cmrj6z8rt0006zx485oaumbfw', 'james@kc-disposal.example.com', '$2a$12$plsqKkCcp8VdBthRyeG7WOEgZt.GPcpy3ZpQdeHm5rCNIuYB5QPRi', 'James Rodriguez', 'company_admin', true, '2026-07-13 12:21:53.126', '2026-07-13 12:21:53.126');
INSERT INTO public."CompanyUser" (id, "companyId", email, password, name, role, "isActive", "createdAt", "updatedAt") VALUES ('cmrj6z9f9000ozx48795mhaad', 'cmrj6z8rt0006zx485oaumbfw', 'emily@kc-disposal.example.com', '$2a$12$cH28u6TlDiAZ25RV9kzeUOgYiQG25lEQBgVwAcOyzOp0mo75uslT.', 'Emily Chen', 'csr', true, '2026-07-13 12:21:53.397', '2026-07-13 12:21:53.397');
INSERT INTO public."CompanyUser" (id, "companyId", email, password, name, role, "isActive", "createdAt", "updatedAt") VALUES ('cmrj6z9mm000qzx487nnfbjf6', 'cmrj6z8rt0006zx485oaumbfw', 'marcus@kc-disposal.example.com', '$2a$12$5yd5.oubI5B6CsSZgi8O2OyuV8iQHflSGKiu3EHa5SZkOX6/tHa/m', 'Marcus Johnson', 'dispatcher', true, '2026-07-13 12:21:53.663', '2026-07-13 12:21:53.663');
INSERT INTO public."CompanyUser" (id, "companyId", email, password, name, role, "isActive", "createdAt", "updatedAt") VALUES ('cmrj6zab20027zx48s5omm5fs', 'cmrj6za3b001vzx48548q0nye', 'alex@mountainhigh.example.com', '$2a$12$0HzXMtFS8/lFYlneBwaET.Ikb.RQSF/MTwDhZXLUAHlnZtXa/67k6', 'Alex Rivera', 'company_owner', true, '2026-07-13 12:21:54.543', '2026-07-13 12:21:54.543');
INSERT INTO public."CompanyUser" (id, "companyId", email, password, name, role, "isActive", "createdAt", "updatedAt") VALUES ('cmrj6zaie0029zx48ho63o23g', 'cmrj6za3b001vzx48548q0nye', 'jen@mountainhigh.example.com', '$2a$12$DyRNFZDajTJZBG16WwCb0.KhNcyZYduJnOPHjobzwgFpfEIyTDazm', 'Jen Walsh', 'company_manager', true, '2026-07-13 12:21:54.807', '2026-07-13 12:21:54.807');



--
-- Data for Name: Customer; Type: TABLE DATA; Schema: public; Owner: -
--


INSERT INTO public."Customer" (id, "companyId", type, "accountNumber", name, "contactName", email, phone, address, address2, city, state, "zipCode", "cityId", "communityId", notes, "isActive", "createdAt", "updatedAt") VALUES ('cmrj6z9ms000szx487x6dpeg4', 'cmrj6z8rt0006zx485oaumbfw', 'residential', 'KCD-R-001', 'David & Linda Thompson', NULL, 'thompson@example.com', NULL, '123 Oak Street', NULL, 'Kansas City', 'MO', '64113', 'cmrj6z8s8000czx487kscdtn2', 'cmrj6z8sh000gzx48u1l7yplt', NULL, true, '2026-07-13 12:21:53.669', '2026-07-13 12:21:53.669');
INSERT INTO public."Customer" (id, "companyId", type, "accountNumber", name, "contactName", email, phone, address, address2, city, state, "zipCode", "cityId", "communityId", notes, "isActive", "createdAt", "updatedAt") VALUES ('cmrj6z9mw000uzx48u9i3x7yj', 'cmrj6z8rt0006zx485oaumbfw', 'residential', 'KCD-R-002', 'Patricia Williams', NULL, 'patricia@example.com', NULL, '456 Elm Avenue', NULL, 'Kansas City', 'MO', '64114', 'cmrj6z8s8000czx487kscdtn2', NULL, NULL, true, '2026-07-13 12:21:53.673', '2026-07-13 12:21:53.673');
INSERT INTO public."Customer" (id, "companyId", type, "accountNumber", name, "contactName", email, phone, address, address2, city, state, "zipCode", "cityId", "communityId", notes, "isActive", "createdAt", "updatedAt") VALUES ('cmrj6z9n0000wzx48qi4tfct8', 'cmrj6z8rt0006zx485oaumbfw', 'commercial', 'KCD-C-001', 'Riverside Office Park', 'Bob Martinez', 'bob@riverside.example.com', NULL, '789 River Road', NULL, 'Kansas City', 'MO', '64116', NULL, NULL, NULL, true, '2026-07-13 12:21:53.677', '2026-07-13 12:21:53.677');
INSERT INTO public."Customer" (id, "companyId", type, "accountNumber", name, "contactName", email, phone, address, address2, city, state, "zipCode", "cityId", "communityId", notes, "isActive", "createdAt", "updatedAt") VALUES ('cmrj6z9n4000yzx48iqr3i88c', 'cmrj6z8rt0006zx485oaumbfw', 'roll_off', 'KCD-RO-001', 'Metro Construction LLC', 'Tony Nguyen', 'tony@metroconstruction.example.com', NULL, '101 Industrial Blvd', NULL, 'Kansas City', 'MO', '64120', NULL, NULL, NULL, true, '2026-07-13 12:21:53.68', '2026-07-13 12:21:53.68');
INSERT INTO public."Customer" (id, "companyId", type, "accountNumber", name, "contactName", email, phone, address, address2, city, state, "zipCode", "cityId", "communityId", notes, "isActive", "createdAt", "updatedAt") VALUES ('cmrj6zaij002bzx484j1w7hxx', 'cmrj6za3b001vzx48548q0nye', 'residential', 'MHD-R-001', 'Frank & Carol Davis', NULL, 'frank@example.com', NULL, '550 Mountain View Dr', NULL, 'Denver', 'CO', '80129', 'cmrj6za3k0021zx4848x6v4h3', 'cmrj6za3s0025zx48q8jdvr3n', NULL, true, '2026-07-13 12:21:54.811', '2026-07-13 12:21:54.811');
INSERT INTO public."Customer" (id, "companyId", type, "accountNumber", name, "contactName", email, phone, address, address2, city, state, "zipCode", "cityId", "communityId", notes, "isActive", "createdAt", "updatedAt") VALUES ('cmrj6zail002dzx48udvx6fbd', 'cmrj6za3b001vzx48548q0nye', 'commercial', 'MHD-C-001', 'Pearl Street Bistro', 'Maria Santos', 'maria@pearlstreet.example.com', NULL, '1200 Pearl Street', NULL, 'Boulder', 'CO', '80302', NULL, NULL, NULL, true, '2026-07-13 12:21:54.814', '2026-07-13 12:21:54.814');



--
-- Data for Name: CustomerUser; Type: TABLE DATA; Schema: public; Owner: -
--


INSERT INTO public."CustomerUser" (id, email, password, name, phone, "isActive", "createdAt", "updatedAt") VALUES ('cmrj6z9uf000zzx48ylcag7fw', 'david@example.com', '$2a$12$wMWCFe0P1TbZrY9VmdjLCOmx6EjlJEQGUsVCE3sffaX.19BPUfFMa', 'David Thompson', NULL, true, '2026-07-13 12:21:53.944', '2026-07-13 12:21:53.944');
INSERT INTO public."CustomerUser" (id, email, password, name, phone, "isActive", "createdAt", "updatedAt") VALUES ('cmrj6za200012zx48qhx4dz3k', 'bob@riverside.example.com', '$2a$12$U74Ly5r1Vxd6XH9KdHD/CeS4YXpLuEzit0hTSelUqqigdWwV3CNv.', 'Bob Martinez', NULL, true, '2026-07-13 12:21:54.216', '2026-07-13 12:21:54.216');
INSERT INTO public."CustomerUser" (id, email, password, name, phone, "isActive", "createdAt", "updatedAt") VALUES ('cmrj6zapv002ezx48pka08y0s', 'frank@example.com', '$2a$12$qzg54jQqpAwr4nd2vJ3utuM/IcfYbZEfalZSIymUE60w5XzFE0Rwq', 'Frank Davis', NULL, true, '2026-07-13 12:21:55.076', '2026-07-13 12:21:55.076');



--
-- Data for Name: CustomerUserAccess; Type: TABLE DATA; Schema: public; Owner: -
--


INSERT INTO public."CustomerUserAccess" (id, "customerUserId", "customerId", "isPrimary", "createdAt") VALUES ('cmrj6z9ul0011zx48etjvc3pu', 'cmrj6z9uf000zzx48ylcag7fw', 'cmrj6z9ms000szx487x6dpeg4', true, '2026-07-13 12:21:53.949');
INSERT INTO public."CustomerUserAccess" (id, "customerUserId", "customerId", "isPrimary", "createdAt") VALUES ('cmrj6za240014zx48fatgtsby', 'cmrj6za200012zx48qhx4dz3k', 'cmrj6z9n0000wzx48qi4tfct8', true, '2026-07-13 12:21:54.22');
INSERT INTO public."CustomerUserAccess" (id, "customerUserId", "customerId", "isPrimary", "createdAt") VALUES ('cmrj6zapz002gzx48fmpnurx1', 'cmrj6zapv002ezx48pka08y0s', 'cmrj6zaij002bzx484j1w7hxx', true, '2026-07-13 12:21:55.079');



--
-- Data for Name: Document; Type: TABLE DATA; Schema: public; Owner: -
--


INSERT INTO public."Document" (id, "companyId", title, description, "fileUrl", "fileName", "fileSize", "mimeType", "targetAll", "targetTypes", "targetCityIds", "targetCommunityIds", "isPublished", "createdById", "createdAt", "updatedAt") VALUES ('cmrj6za2j001czx48ldpaur1d', 'cmrj6z8rt0006zx485oaumbfw', '2024 Holiday Schedule', 'Complete holiday collection schedule for 2024', 'placeholder://holiday-schedule-2024.pdf', 'holiday-schedule-2024.pdf', 245000, 'application/pdf', true, '{}', '{}', '{}', true, 'cmrj6z8zz000kzx48zjtmaypg', '2026-07-13 12:21:54.236', '2026-07-13 12:21:54.236');
INSERT INTO public."Document" (id, "companyId", title, description, "fileUrl", "fileName", "fileSize", "mimeType", "targetAll", "targetTypes", "targetCityIds", "targetCommunityIds", "isPublished", "createdById", "createdAt", "updatedAt") VALUES ('cmrj6za2n001ezx48vntb4n84', 'cmrj6z8rt0006zx485oaumbfw', 'Recycling Accepted Items Guide', 'Guide to accepted recycling materials', 'placeholder://recycling-guide.pdf', 'recycling-guide.pdf', 512000, 'application/pdf', true, '{}', '{}', '{}', true, 'cmrj6z8zz000kzx48zjtmaypg', '2026-07-13 12:21:54.239', '2026-07-13 12:21:54.239');
INSERT INTO public."Document" (id, "companyId", title, description, "fileUrl", "fileName", "fileSize", "mimeType", "targetAll", "targetTypes", "targetCityIds", "targetCommunityIds", "isPublished", "createdById", "createdAt", "updatedAt") VALUES ('cmrj6za2q001gzx48b4lqiazn', 'cmrj6z8rt0006zx485oaumbfw', 'Commercial Service Agreement', 'Standard service agreement for commercial customers', 'placeholder://commercial-agreement.pdf', 'commercial-agreement.pdf', 380000, 'application/pdf', false, '{commercial}', '{}', '{}', true, 'cmrj6z8zz000kzx48zjtmaypg', '2026-07-13 12:21:54.242', '2026-07-13 12:21:54.242');



--
-- Data for Name: Plan; Type: TABLE DATA; Schema: public; Owner: -
--


INSERT INTO public."Plan" (id, name, slug, "monthlyPriceCents", "annualPriceCents", "maxCommunities", "maxCustomers", "maxStaffUsers", features, "isActive", "displayOrder", "createdAt", "updatedAt") VALUES ('cmrj6z8rh0003zx481y41zt61', 'Starter', 'starter', 49900, 479000, 15, 5000, 10, '{}', true, 1, '2026-07-13 12:21:52.541', '2026-07-13 12:21:52.541');
INSERT INTO public."Plan" (id, name, slug, "monthlyPriceCents", "annualPriceCents", "maxCommunities", "maxCustomers", "maxStaffUsers", features, "isActive", "displayOrder", "createdAt", "updatedAt") VALUES ('cmrj6z8rm0004zx48a94xatky', 'Professional', 'professional', 149900, 1439000, 75, 25000, 50, '{"smsReady": true, "analytics": true, "apiAccess": true, "customBranding": true}', true, 2, '2026-07-13 12:21:52.546', '2026-07-13 12:21:52.546');
INSERT INTO public."Plan" (id, name, slug, "monthlyPriceCents", "annualPriceCents", "maxCommunities", "maxCustomers", "maxStaffUsers", features, "isActive", "displayOrder", "createdAt", "updatedAt") VALUES ('cmrj6z8rp0005zx48y49d3t0n', 'Enterprise', 'enterprise', 399900, 3839000, NULL, NULL, NULL, '{"whiteLabel": true, "customDomain": true, "prioritySupport": true, "customIntegrations": true}', true, 3, '2026-07-13 12:21:52.55', '2026-07-13 12:21:52.55');



--
-- Data for Name: PlatformUser; Type: TABLE DATA; Schema: public; Owner: -
--


INSERT INTO public."PlatformUser" (id, email, password, name, role, "isActive", "createdAt", "updatedAt") VALUES ('cmrj6z8cd0000zx48fw0doqe3', 'admin@refuselink.com', '$2a$12$yK.5VGPG3ssWZRNxg/54buymBuUNLVXEB.ptwAn6ff1J1SnPIycNi', 'RefuseLink Admin', 'platform_owner', true, '2026-07-13 12:21:51.997', '2026-07-13 12:21:51.997');
INSERT INTO public."PlatformUser" (id, email, password, name, role, "isActive", "createdAt", "updatedAt") VALUES ('cmrj6z8jx0001zx48gnp8nupu', 'support@refuselink.com', '$2a$12$zqDYMncvfM2.Jcm5zFkpVu3OeoLJW/Cy9hNpDOhLTmcr7hezZQ5AO', 'Support Agent', 'platform_support', true, '2026-07-13 12:21:52.269', '2026-07-13 12:21:52.269');
INSERT INTO public."PlatformUser" (id, email, password, name, role, "isActive", "createdAt", "updatedAt") VALUES ('cmrj6z8rd0002zx48khf9yabk', 'john@doe.com', '$2a$12$EUVqlY6803TNyoqCGeVRWeGYp48mWPZcjhTtX2gvmTLx5aDm45Bze', 'John Doe', 'platform_owner', true, '2026-07-13 12:21:52.537', '2026-07-13 12:21:52.537');



--
-- Data for Name: ServiceSchedule; Type: TABLE DATA; Schema: public; Owner: -
--


INSERT INTO public."ServiceSchedule" (id, "companyId", name, description, type, frequency, "daysOfWeek", "cityId", "communityId", "isActive", "createdAt", "updatedAt") VALUES ('cmrj6za2t001izx48ofmxixy5', 'cmrj6z8rt0006zx485oaumbfw', 'Kansas City Residential - Monday/Thursday', 'Regular residential trash and recycling pickup for Kansas City', 'residential', 'weekly', '{1,4}', 'cmrj6z8s8000czx487kscdtn2', NULL, true, '2026-07-13 12:21:54.246', '2026-07-13 12:21:54.246');
INSERT INTO public."ServiceSchedule" (id, "companyId", name, description, type, frequency, "daysOfWeek", "cityId", "communityId", "isActive", "createdAt", "updatedAt") VALUES ('cmrj6za2w001kzx48vjxpmvty', 'cmrj6z8rt0006zx485oaumbfw', 'Commercial Weekly', 'Weekly commercial waste collection', 'commercial', 'weekly', '{2}', NULL, NULL, true, '2026-07-13 12:21:54.249', '2026-07-13 12:21:54.249');
INSERT INTO public."ServiceSchedule" (id, "companyId", name, description, type, frequency, "daysOfWeek", "cityId", "communityId", "isActive", "createdAt", "updatedAt") VALUES ('cmrj6zaq2002izx4879ud14dv', 'cmrj6za3b001vzx48548q0nye', 'Denver Residential - Tuesday/Friday', 'Regular residential collection for Denver area', 'residential', 'weekly', '{2,5}', 'cmrj6za3k0021zx4848x6v4h3', NULL, true, '2026-07-13 12:21:55.083', '2026-07-13 12:21:55.083');



--
-- Data for Name: ScheduleException; Type: TABLE DATA; Schema: public; Owner: -
--





--
-- Data for Name: Subscription; Type: TABLE DATA; Schema: public; Owner: -
--


INSERT INTO public."Subscription" (id, "companyId", "planId", "billingCycle", status, "startDate", "endDate", "createdAt", "updatedAt") VALUES ('cmrj6z8s3000azx48o8pb9sn5', 'cmrj6z8rt0006zx485oaumbfw', 'cmrj6z8rm0004zx48a94xatky', 'monthly', 'active', '2024-01-01 00:00:00', NULL, '2026-07-13 12:21:52.563', '2026-07-13 12:21:52.563');
INSERT INTO public."Subscription" (id, "companyId", "planId", "billingCycle", status, "startDate", "endDate", "createdAt", "updatedAt") VALUES ('cmrj6za3h001zzx48brofwady', 'cmrj6za3b001vzx48548q0nye', 'cmrj6z8rh0003zx481y41zt61', 'monthly', 'active', '2024-03-01 00:00:00', NULL, '2026-07-13 12:21:54.269', '2026-07-13 12:21:54.269');



--
-- Data for Name: Ticket; Type: TABLE DATA; Schema: public; Owner: -
--


INSERT INTO public."Ticket" (id, "companyId", "customerId", "ticketNumber", subject, status, priority, "assignedToId", "createdById", "createdByType", "createdAt", "updatedAt") VALUES ('cmrj6za30001mzx48i78mu2hm', 'cmrj6z8rt0006zx485oaumbfw', 'cmrj6z9ms000szx487x6dpeg4', 'TKT-00001', 'Missed pickup on Oak Street', 'in_progress', 'high', 'cmrj6z9f9000ozx48795mhaad', 'cmrj6z9uf000zzx48ylcag7fw', 'customer', '2026-07-13 12:21:54.252', '2026-07-13 12:21:54.252');
INSERT INTO public."Ticket" (id, "companyId", "customerId", "ticketNumber", subject, status, priority, "assignedToId", "createdById", "createdByType", "createdAt", "updatedAt") VALUES ('cmrj6za37001szx48crtuh7iv', 'cmrj6z8rt0006zx485oaumbfw', 'cmrj6z9n0000wzx48qi4tfct8', 'TKT-00002', 'Requesting additional dumpster', 'open', 'normal', 'cmrj6z8zz000kzx48zjtmaypg', 'cmrj6za200012zx48qhx4dz3k', 'customer', '2026-07-13 12:21:54.259', '2026-07-13 13:33:29.313');



--
-- Data for Name: TicketMessage; Type: TABLE DATA; Schema: public; Owner: -
--


INSERT INTO public."TicketMessage" (id, "ticketId", content, "authorId", "authorType", "authorName", "isInternal", "createdAt") VALUES ('cmrj6za32001ozx48hvy659rw', 'cmrj6za30001mzx48i78mu2hm', 'Our trash was not picked up today on Oak Street. The bin was out by 6 AM as required. This is the second time this month.', 'cmrj6z9uf000zzx48ylcag7fw', 'customer', 'David Thompson', false, '2026-07-13 12:21:54.255');
INSERT INTO public."TicketMessage" (id, "ticketId", content, "authorId", "authorType", "authorName", "isInternal", "createdAt") VALUES ('cmrj6za34001qzx48asp5kp5a', 'cmrj6za30001mzx48i78mu2hm', 'I apologize for the inconvenience, Mr. Thompson. I''ve dispatched a truck to your address for a same-day pickup. Our driver had a route issue this morning.', 'cmrj6z9f9000ozx48795mhaad', 'employee', 'Emily Chen', false, '2026-07-13 12:21:54.257');
INSERT INTO public."TicketMessage" (id, "ticketId", content, "authorId", "authorType", "authorName", "isInternal", "createdAt") VALUES ('cmrj6za39001uzx487ra0ve7m', 'cmrj6za37001szx48crtuh7iv', 'We need an additional 4-yard dumpster for our east parking lot. Our current single dumpster is overflowing by Thursday each week.', 'cmrj6za200012zx48qhx4dz3k', 'customer', 'Bob Martinez', false, '2026-07-13 12:21:54.261');
INSERT INTO public."TicketMessage" (id, "ticketId", content, "authorId", "authorType", "authorName", "isInternal", "createdAt") VALUES ('cmrj9ny8t0008mv077yitgk3a', 'cmrj6za30001mzx48i78mu2hm', 'About what time will the driver get here? I want to be here when the trash gets serviced.', 'cmrj6z9uf000zzx48ylcag7fw', 'customer', 'David Thompson', false, '2026-07-13 13:37:04.542');
INSERT INTO public."TicketMessage" (id, "ticketId", content, "authorId", "authorType", "authorName", "isInternal", "createdAt") VALUES ('cmrj9pzd9000amv0718xwrwsl', 'cmrj6za30001mzx48i78mu2hm', 'We sent the truck at 8am.', 'cmrj6z8zz000kzx48zjtmaypg', 'employee', 'Sarah Mitchell', true, '2026-07-13 13:38:39.31');
INSERT INTO public."TicketMessage" (id, "ticketId", content, "authorId", "authorType", "authorName", "isInternal", "createdAt") VALUES ('cmrj9qje6000cmv07t7kkjsrs', 'cmrj6za30001mzx48i78mu2hm', 'It should be there around 8:30am.', 'cmrj6z8zz000kzx48zjtmaypg', 'employee', 'Sarah Mitchell', false, '2026-07-13 13:39:05.262');



--
-- Data for Name: TicketAttachment; Type: TABLE DATA; Schema: public; Owner: -
--





--
-- PostgreSQL database dump complete
--

