# AizenGo Project Documentation

AizenGo is a conference-management web application. Its frontend is a React and
TypeScript single-page application built with Vite. Its HTTP API is implemented
in PHP and stores users, sessions, and application records in MySQL or MariaDB.

## 1. Technology stack

### Frontend

- React 19 and TypeScript
- Vite
- React Router
- Redux Toolkit and TanStack React Query
- Axios
- React Hook Form and Zod
- Recharts and Framer Motion

### API and database

- PHP 8.2 or newer
- MySQL or MariaDB, with the PHP `pdo_mysql` extension
- No Composer dependencies
- JSON API under `/api`

The current API implementation is in `server/php/public/index.php`. The older
Node/Express and Prisma backend is not part of the current application runtime.

## 2. Repository layout

```text
public/                  Static files copied by Vite
src/
  api/                   Axios client and API request modules
  components/            Shared UI and feature components
  constants/             Application constants and route paths
  context/                Auth, theme, and backend-data providers
  data/                   Backend snapshot loading
  hooks/                  Reusable React hooks
  layouts/                Public, attendee, and admin layouts
  pages/                  Public, auth, attendee, and admin screens
  routes/                 React Router configuration
  services/               Domain-level API services
  store/                  Redux store and slices
  types/                  TypeScript domain types
  utils/                  Formatting and validation helpers
server/
  .env.example             PHP API configuration template
  php/
    public/
      index.php            PHP API implementation
      router.php           Local PHP development-server router
    schema.sql             MySQL/MariaDB table definitions
    seed-demo.php          Development-only demo account setup
    README.md              PHP API setup notes
```

## 3. Requirements

For frontend development and production builds:

- Node.js and npm

For the API:

- PHP 8.2 or newer
- PHP `pdo_mysql` extension
- MySQL 8+ or MariaDB 10.5+

The API uses a database named `aizengo` by default in the sample configuration.
The database and database user must exist before starting the API.

## 4. Environment configuration

Copy `server/.env.example` to `server/.env`, then set the database credentials
for your environment:

```env
DATABASE_HOST=localhost
DATABASE_PORT=3306
DATABASE_USER=your_database_user
DATABASE_PASSWORD=your_database_password
DATABASE_NAME=aizengo
FRONTEND_ORIGIN=http://localhost:5173
```

`FRONTEND_ORIGIN` must match the browser origin serving the frontend. The PHP
API reads these values from environment variables or `server/.env`. Keep
`server/.env` private and outside any publicly served directory.

The frontend API base URL defaults to `http://localhost:4000/api`. To set it
explicitly for local or production builds, define `VITE_API_BASE_URL` in a
root-level Vite environment file, for example:

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

Vite embeds this value at build time. Rebuild the frontend after changing it.

## 5. Database setup

Create a database and user in MySQL/MariaDB, then grant the user access to the
database. For a new, empty database, import `server/php/schema.sql` using
phpMyAdmin or the MySQL command line.

The schema creates three tables:

| Table | Purpose |
| --- | --- |
| `User` | Account profile, role, and password hash |
| `Session` | Hashed bearer-token sessions and expiry times |
| `DataRecord` | JSON application records, uniquely keyed by resource and record key |

Do not import `schema.sql` over a database that already contains these tables.
In particular, it is not a migration script for a database managed by the
previous Prisma backend.

The schema creates empty tables. `seed-demo.php` adds only the three
development accounts; it does not populate conferences or other application
content. Existing content must be retained from an existing database or added
through the application.

## 6. Run locally

### Start the PHP API

From the project root:

```bash
php -S 0.0.0.0:4000 -t server/php/public server/php/public/router.php
```

The API should be available at `http://localhost:4000`. Verify the API and
database connection at:

```text
http://localhost:4000/api/health
```

Expected response:

```json
{"status":"ok","database":"connected"}
```

### Start the frontend

In another terminal:

```bash
npm install
npm run dev
```

Vite prints the local frontend URL, normally `http://localhost:5173`.

Useful frontend commands:

```bash
npm run lint
npm run build
npm run preview
```

The frontend loads the backend snapshot during startup. If the API is
unavailable, the application displays a connection error instead of loading
content from frontend fixtures.

## 7. Data flow

```text
Browser
  -> React Router and AppProviders
  -> GET /api/data/snapshot
  -> PHP API
  -> MySQL DataRecord table
  -> BackendDataContext
  -> Public, attendee, and admin pages
```

Authentication requests go through `src/api/authApi.ts` to the PHP
`/api/auth/*` endpoints. The API hashes passwords using PHP's
`password_hash()` and stores only a hash of each bearer token in `Session`.
The browser stores the returned token and public user under
`aizengo.api.session` in local storage.

## 8. HTTP API

The API is implemented in `server/php/public/index.php`.

### Health and authentication

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Checks the database connection |
| `POST` | `/api/auth/register` | Creates a regular user and session |
| `POST` | `/api/auth/login` | Verifies credentials and creates a session |
| `GET` | `/api/auth/me` | Returns the user for a valid bearer token |
| `POST` | `/api/auth/logout` | Revokes the supplied bearer token |
| `POST` | `/api/auth/forgot-password` | Returns `501` until verified reset delivery is configured |
| `POST` | `/api/auth/reset-password` | Returns `501` until verified reset tokens are implemented |
| `GET` | `/api/users` | Lists public user fields to administrators |

Registration requires a name, valid email address, and password of at least
eight characters. Protected identity lookup uses the `Authorization: Bearer
<token>` header.

### Application data

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/data/snapshot` | Returns all records grouped by resource |
| `GET` | `/api/data/:resource` | Lists records in one resource |
| `POST` | `/api/data/:resource` | Creates or upserts a record |
| `PUT` | `/api/data/:resource/:recordKey` | Replaces a record payload |
| `DELETE` | `/api/data/:resource/:recordKey` | Deletes a record |

The frontend's `src/api/dataApi.ts` wraps these endpoints. It sends the saved
bearer token when one is present. Data records are JSON payloads stored in
`DataRecord`; a record key is derived from the payload's `id`, `slug`, `month`,
or `name` when available.

Public requests can read only the `conferences`, `categories`, `faqs`,
`gallery`, `statistics`, and `testimonials` resources. An authenticated user
can read their own records in attendee resources; administrators can read all
resources. Data writes require an authenticated user: administrators can
manage all records, while attendees can submit their own abstracts, update
their own profile, and manage the `read` flag or deletion of their own
notifications.

## 9. Frontend routes

The active route tree is in `src/routes/AppRoutes.tsx`.

### Public and authentication routes

```text
/
/about
/conferences
/conferences/:slug
/contact
/faq
/gallery
/privacy-policy
/terms
/sitemap
/login
/register
/forgot-password
/reset-password
/admin/login
```

### Attendee routes

All routes below `/dashboard` require an authenticated user:

```text
/dashboard
/dashboard/profile
/dashboard/profile/edit
/dashboard/conferences
/dashboard/registrations
/dashboard/registrations/:id
/dashboard/abstracts
/dashboard/abstracts/new
/dashboard/abstracts/:id
/dashboard/certificates
/dashboard/notifications
/dashboard/settings
```

### Admin routes

Admin routes require an `ADMIN` or `SUPER_ADMIN` role:

```text
/admin/dashboard
/admin/conferences
/admin/conferences/new
/admin/conferences/:id/edit
/admin/speakers
/admin/speakers/new
/admin/speakers/:id/edit
/admin/users
/admin/registrations
/admin/abstracts
/admin/abstracts/:id
/admin/blogs
/admin/blogs/new
/admin/blogs/:id/edit
/admin/faqs
/admin/gallery
/admin/payments
/admin/reports
/admin/settings
```

## 10. Development accounts

To create local demo accounts, run the following from the API directory after
configuring the database and importing the schema:

```bash
cd server/php
php seed-demo.php
```

| Role | Email | Password |
| --- | --- | --- |
| User | `user@aizen.test` | `aizen123` |
| Admin | `admin@aizen.test` | `admin123` |
| Super admin | `superadmin@aizen.test` | `super123` |

These are development-only credentials. `seed-demo.php` creates or resets
these accounts' passwords; never run it against production or use these
credentials on a live site.

## 11. Deploy to MilesWeb cPanel

This deployment layout serves the built frontend from the main domain and the
PHP API from an API subdomain. Confirm that your MilesWeb plan supports PHP
8.2+, `pdo_mysql`, and MySQL/MariaDB.

1. **Create the database.** In cPanel, create a database and database user,
   grant the user access, and import `server/php/schema.sql` into the empty
   database.
2. **Configure the API subdomain.** Create `api.yourdomain.com` and set its
   document root to the API's `server/php/public` directory. Upload
   `server/php/public/index.php` and `router.php` into that document root.
3. **Configure PHP and the API environment.** Select PHP 8.2 or newer and
   enable/check `pdo_mysql`. Place `server/.env` outside the public document
   root, with the production database values and:

   ```env
   FRONTEND_ORIGIN=https://yourdomain.com
   ```

   The PHP API looks for this file at the `server/.env` location relative to
   the uploaded project layout. If your cPanel document-root layout differs,
   place the file where the API's `dirname(__DIR__, 2)` lookup resolves.
4. **Route API requests to PHP.** Add this `.htaccess` in the API document
   root if Apache does not route non-file requests to `index.php`:

   ```apache
   RewriteEngine On
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule ^ index.php [QSA,L]
   ```

5. **Build the frontend with its production API URL.** In the project root,
   create `.env.production`:

   ```env
   VITE_API_BASE_URL=https://api.yourdomain.com/api
   ```

   Then run:

   ```bash
   npm install
   npm run build
   ```

6. **Publish the frontend.** Upload the contents of `dist/` to the main
   domain's `public_html/` directory. Add this `.htaccess` there so direct
   navigation to React Router routes serves the SPA:

   ```apache
   RewriteEngine On
   RewriteBase /
   RewriteRule ^index\.html$ - [L]
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule . /index.html [L]
   ```

7. **Verify the deployment.** Open `https://api.yourdomain.com/api/health`,
   then load the frontend and check the browser console/network panel for API
   or CORS errors. Rebuild `dist/` whenever `VITE_API_BASE_URL` changes.

Do not upload `.env` files, source-control metadata, `node_modules`, or local
development credentials to a public document root. Keep the API's database
configuration outside the web root.

## 12. Security and production limitations

The PHP API enforces server-side access policies for user listings and
application data. Public data is restricted to an allowlist; private records
are limited to their owner or administrators. Keep these API checks in place:
frontend route protection alone is not authorization.

Password recovery is deliberately disabled: both recovery endpoints return
`501` rather than allowing a password change based only on an email address.
Implement verified email delivery and single-use, time-limited reset tokens
before enabling account recovery. Authentication routes also need rate
limiting before production use.

Before using the application with real users or sensitive records, test the
authorization rules for every role and resource, implement a secure
email-based password-reset flow and rate limiting, add input validation
appropriate to each resource, use HTTPS, store secrets securely, and configure
database backups. Restrict `FRONTEND_ORIGIN` to the production frontend
origin.

The PHP API hashes newly created passwords using PHP's native password
hashing. Password hashes created by the former Node backend may not be
compatible; existing accounts may need a password reset or a deliberate hash
migration.

## 13. Troubleshooting

### Frontend cannot connect to the API

- Confirm the API responds at `/api/health`.
- Check `VITE_API_BASE_URL`; it must end in `/api`.
- On production, confirm the frontend was rebuilt after changing the API URL.
- Check that `FRONTEND_ORIGIN` exactly matches the frontend's scheme, host,
  and port.

### API reports a database error

- Confirm the database name, user, password, and host in `server/.env`.
- Confirm the user has privileges on the database.
- Confirm PHP's `pdo_mysql` extension is enabled.
- Confirm the tables in `schema.sql` exist in the selected database.

### A route works through site navigation but not when refreshed

Configure the frontend Apache rewrite rule so unknown paths resolve to
`index.html`.

### API endpoints return 404 on cPanel

Confirm the API subdomain points to `server/php/public` and that the API
document root has the PHP rewrite rule shown above.

### A user password is forgotten

Passwords are stored as hashes and cannot be recovered. The current reset
flow is not suitable for production until a verified reset-token and email
workflow is implemented.
