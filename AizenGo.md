# AizenGo End-to-End Guide

This document describes the current AizenGo application flow, local setup, route structure, authentication behavior, and the manual end-to-end checks for the conference platform.

## 1. Application overview

AizenGo is a React + TypeScript conference management application built with Vite. It has three areas:

- Public conference discovery and informational pages.
- Authenticated attendee pages under `/dashboard`.
- Protected administration pages under `/admin`.

The project uses the MySQL backend as the source of truth for authentication, conference content, registrations, abstracts, reports, settings, and admin-managed records. The frontend only keeps the backend response in memory for rendering.

## 2. Local setup

Requirements:

- Node.js with npm
- A modern browser

Install and run the application:

```bash
npm install
npm run dev
```

The Vite development server prints the local URL, normally `http://localhost:5173`.

Useful verification commands:

```bash
npm run lint
npm run build
npm run preview
```

There is currently no automated E2E test runner configured in `package.json`; the workflow below is a browser-based smoke test.

## 3. Application entry points

1. `src/main.tsx` mounts the React application.
2. `src/context/AppProviders.tsx` registers Redux, React Query, theme, and authentication providers.
3. `src/App.tsx` renders the application routes.
4. `src/routes/AppRoutes.tsx` defines public, auth, user, and admin routes.
5. `src/layouts/PublicLayout.tsx`, `UserLayout.tsx`, and `AdminLayout.tsx` provide area-specific shells.

## 4. Public routes

| Route | Purpose |
| --- | --- |
| `/` | Home page |
| `/about` | About AizenGo |
| `/conferences` | Conference directory, search, filters, and pagination |
| `/conferences/:slug` | Conference details and registration CTA |
| `/contact` | Contact page |
| `/faq` | Frequently asked questions |
| `/gallery` | Conference photo gallery |
| `/privacy-policy` | Privacy policy |
| `/terms` | Terms of use |
| `/sitemap` | Public website sitemap |

The public Speakers and Blogs pages have been removed. Their routes, navigation entries, public detail pages, and public-facing CTA links are no longer part of the website. Speaker and blog management remains available to administrators under `/admin`.

## 5. Authentication routes

| Route | Purpose |
| --- | --- |
| `/login` | Attendee login |
| `/register` | Create an attendee account |
| `/forgot-password` | Start password reset |
| `/reset-password` | Complete password reset |
| `/admin/login` | Administrator login |

Development accounts are seeded into MySQL by `server/src/seed.ts`:

| Role | Email | Password |
| --- | --- | --- |
| Attendee | `user@aizen.test` | `aizen123` |
| Admin | `admin@aizen.test` | `admin123` |
| Super admin | `superadmin@aizen.test` | `super123` |

## 6. Attendee flow

1. Open `/conferences`.
2. Search for a conference, apply a filter, change sorting, and move between pages.
3. Open a conference and verify its details, dates, venue, program, gallery, FAQ, and registration card.
4. Select `Register Now` and create an account or sign in.
5. Confirm that a regular `USER` is redirected to `/dashboard` after authentication.
6. Open `/dashboard/registrations`, `/dashboard/abstracts`, `/dashboard/certificates`, `/dashboard/notifications`, and `/dashboard/settings`.
7. Open `/dashboard/abstracts/new`, complete the required fields, and submit an abstract.
8. Verify that invalid abstract input shows an error and valid input returns to the abstracts page.
9. Log out and verify that protected dashboard routes redirect to `/login`.

## 7. Administrator flow

1. Open `/admin/login`.
2. Sign in with either the admin or super-admin development account.
3. Verify redirection to `/admin/dashboard`.
4. Visit the conference, speaker, user, registration, abstract, blog, FAQ, gallery, payments, reports, and settings sections.
5. Create, edit, filter, publish/unpublish, or delete records where the section supports the action.
6. Verify that admin-only routes reject a regular attendee and redirect them to `/dashboard`.
7. Log out and verify that admin routes redirect to `/admin/login`.

## 8. Authentication and storage behavior

The frontend stores only the backend session token and temporary reset email in browser storage:

- `aizengo.api.session` — current backend session token and user.
- `aizengo.api.reset-email` — temporary password-reset email.

The backend runs from `server/` on port `4000` and exposes `/api/health`, `/api/auth/*`, `/api/users`, and `/api/data/*`. Its MySQL schema is defined in `server/prisma/schema.prisma`. Development seed fixtures live under `server/src/seed-data`; no content fixtures remain in the frontend source tree.

To reset the local demo state, clear the site data for the Vite origin in the browser and reload the app.

## 9. Regression checklist

- Public navigation contains only live public routes.
- `http://localhost:4000/api/health` reports `{ "status": "ok", "database": "connected" }` when MySQL is available.
- Login and registration use the MySQL-backed API instead of `src/data/users.ts` at runtime.
- The sitemap contains no links to removed public Speakers or Blogs pages.
- Conference details contain no dead public speaker links.
- Admin pages do not expose “view public” actions for removed public pages.
- Direct navigation to `/speakers`, `/speakers/:slug`, `/blogs`, and `/blogs/:slug` no longer resolves to a public page.
- `npm run lint` passes.
- `npm run build` passes.
