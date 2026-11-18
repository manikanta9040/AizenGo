# AizenGo PHP API

This folder replaces the Express runtime while retaining its API contract:

- `GET /api/health`
- authentication at `/api/auth/*`
- users at `GET /api/users`
- content records at `/api/data/*`

## Requirements

PHP 8.2+ with the `pdo_mysql` extension and a MySQL/MariaDB database. No Composer packages are required.

## Configure and run

1. Keep database settings in `server/.env`. The PHP API reads the same `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, `DATABASE_NAME`, and `FRONTEND_ORIGIN` settings.
2. For a new database, import `schema.sql`. Do not import it over the database managed by the former Prisma backend, because the tables already exist.
3. Start the API from this folder:

   ```bash
   php -S 0.0.0.0:4000 -t public public/router.php
   ```

The React client defaults to `http://localhost:4000/api`. Set
`VITE_API_BASE_URL` when the API uses another host, then rebuild the frontend.

## Access control and password recovery

Public API reads are limited to public conference/content resources. Private
records and user listings require an authenticated administrator, except that
attendees can read their own records and submit abstracts, update their own
profile, and manage their own notifications. The frontend sends its stored
bearer token with API requests.

Password recovery endpoints return `501 Not Implemented` until a verified
email delivery flow and single-use reset tokens are configured. Do not remove
this safeguard by accepting an email address alone as proof of account
ownership.

## Development login accounts

After importing the schema, create the local demo accounts with:

```bash
php seed-demo.php
```

This creates (or resets) the following **development-only** accounts:

| Role | Email | Password |
| --- | --- | --- |
| User | `user@aizen.test` | `aizen123` |
| Admin | `admin@aizen.test` | `admin123` |
| Super admin | `superadmin@aizen.test` | `super123` |

Never run this script or use these passwords in production.

## Password migration note

The Node backend stored passwords using Node's scrypt format. PHP uses its native secure password hashes for accounts created or reset through this API. Existing Node-created accounts must reset their password once (or have their hashes migrated) before they can log in through PHP.
