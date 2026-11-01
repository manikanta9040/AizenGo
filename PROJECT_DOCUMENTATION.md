# AizenGo Project Documentation

AizenGo is a conference-management platform with a React/Vite frontend, an Express/TypeScript backend, and a MySQL database accessed through Prisma.

The backend is the source of truth for application content and user records. The frontend requests data from the backend and keeps the response in memory while the application is open.

## 1. Technology stack

### Frontend

- React 19 and TypeScript
- Vite
- React Router
- Redux Toolkit
- TanStack React Query
- Axios
- Recharts
- Framer Motion
- React Hook Form and Zod

### Backend

- Node.js and TypeScript
- Express
- Prisma Client
- MySQL/MariaDB adapter
- bcrypt-based password hashing
- Token-based sessions

## 2. Repository structure

```text
src/
  api/                 Axios API clients
  components/          Reusable UI and page components
  constants/           Routes, roles, and application constants
  context/             Authentication, theme, and backend-data providers
  hooks/               Reusable React hooks
  layouts/             Public, user, and admin layouts
  pages/               Public, authentication, user, and admin pages
  routes/              Application route definitions
  services/            Backend-backed domain services
  store/               Redux slices and store configuration
  types/               TypeScript domain types
  data/backendHydration.ts  Backend snapshot loader

server/
  src/index.ts         Express API and route handlers
  src/lib/             Prisma, password, and session helpers
  src/seed.ts          Database seed runner
  src/seed-data/       Server-only initial seed records
  prisma/schema.prisma Database schema
  .env                 Local database configuration (not committed)
```

The old frontend fixture directory no longer contains content records. Seed records live under `server/src/seed-data` so they are not bundled into the frontend.

## 3. Prerequisites

Install the following before running the project:

- Node.js with npm
- MySQL or MariaDB running on port `3306`
- A database named `aizengo`

Create a database user if needed:

```sql
CREATE DATABASE aizengo;
CREATE USER 'aizengo_user'@'localhost' IDENTIFIED BY 'choose-a-password';
GRANT ALL PRIVILEGES ON aizengo.* TO 'aizengo_user'@'localhost';
FLUSH PRIVILEGES;
```

## 4. Environment configuration

Create `server/.env` from `server/.env.example`:

```env
DATABASE_URL="mysql://DATABASE_USER:DATABASE_PASSWORD@localhost:3306/aizengo"
DATABASE_HOST="localhost"
DATABASE_PORT=3306
DATABASE_USER="DATABASE_USER" //aizengo_user
DATABASE_PASSWORD="DATABASE_PASSWORD" //AizenGo@123
DATABASE_NAME="aizengo"
PORT=4000
```

The server runtime uses `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_USER`, `DATABASE_PASSWORD`, and `DATABASE_NAME`. Prisma CLI commands use `DATABASE_URL`.

If the database password contains special URL characters such as `@`, encode them in `DATABASE_URL`. For example, `@` becomes `%40`. The separate `DATABASE_PASSWORD` value remains the actual password.

The frontend defaults to:

```text
http://localhost:4000/api
```

To override it, create a root `.env` file:

```env
VITE_API_BASE_URL=http://localhost:4000/api
```

## 5. Installation and database setup

Install frontend dependencies:

```bash
cd /Users/manikanta/AizenGo
npm install
```

Install backend dependencies:

```bash
cd /Users/manikanta/AizenGo/server
npm install
```

Generate the Prisma client and apply the schema to MySQL:

```bash
npx prisma generate
npx prisma db push
```

Populate development users and content:

```bash
npm run seed
```

The seed command reads server-only records from `server/src/seed-data` and writes them to the `User` and `DataRecord` tables. It does not update the TypeScript files when users edit data through the website.

## 6. Run frontend and backend

Use two terminal windows.

### Terminal 1: backend

```bash
cd /Users/manikanta/AizenGo/server
npm run dev
```

The API runs at `http://localhost:4000`.

### Terminal 2: frontend

```bash
cd /Users/manikanta/AizenGo
npm run dev
```

The frontend normally runs at `http://localhost:5173`.

Verify the backend:

```text
http://localhost:4000/api/health
```

Expected response:

```json
{"status":"ok","database":"connected"}
```

## 7. Application startup and data flow

```text
Browser
  -> AppProviders
  -> GET /api/data/snapshot
  -> Express API
  -> Prisma
  -> MySQL DataRecord table
  -> BackendDataProvider
  -> Public/user/admin pages
```

The main files involved are:

- [src/context/AppProviders.tsx](src/context/AppProviders.tsx)
- [src/data/backendHydration.ts](src/data/backendHydration.ts)
- [src/context/BackendDataContext.tsx](src/context/BackendDataContext.tsx)
- [src/hooks/useBackendData.ts](src/hooks/useBackendData.ts)
- [src/api/dataApi.ts](src/api/dataApi.ts)
- [server/src/index.ts](server/src/index.ts)

If the backend cannot be reached, the frontend displays a connection error instead of using frontend mock content.

## 8. Database schema

The schema is defined in `server/prisma/schema.prisma`.

### `User`

Stores registered accounts:

- `id`
- `name`
- `email`
- `passwordHash`
- `role`
- `avatar`
- `createdAt`
- `updatedAt`

Plain-text passwords are never stored.

### `Session`

Stores hashed login session tokens and their expiration dates.

### `DataRecord`

Stores flexible JSON application data:

- `resource`: collection name such as `conferences` or `faqs`
- `recordKey`: record identifier
- `payload`: JSON record
- `updatedAt`: last update time

Current seeded resources include:

```text
abstracts
adminStats
blogs
categories
categoryStats
certificates
conferences
faqs
gallery
monthlyRevenue
notifications
payments
registrationGrowth
registrations
reports
speakers
statistics
testimonials
userProfile
users
settings
abstractReviewDistribution
```

## 9. Authentication

### Register

```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Example User",
  "email": "example@example.com",
  "password": "at-least-8-characters"
}
```

The backend validates the request, hashes the password, creates a `User` row, creates a session, and returns a token and public user object.

### Login

```http
POST /api/auth/login
```

The frontend stores the returned session token in browser storage under `aizengo.api.session`. This is session state, not application content.

### Other authentication endpoints

```text
GET  /api/auth/me
POST /api/auth/logout
POST /api/auth/forgot-password
POST /api/auth/reset-password
```

## 10. Data API

The generic data API is implemented in `server/src/index.ts` and wrapped by `src/api/dataApi.ts`.

```text
GET    /api/data/snapshot
GET    /api/data/:resource
POST   /api/data/:resource
PUT    /api/data/:resource/:recordKey
DELETE /api/data/:resource/:recordKey
```

Examples:

```http
GET http://localhost:4000/api/data/conferences
GET http://localhost:4000/api/data/faqs
GET http://localhost:4000/api/data/snapshot
```

Frontend domain services use these endpoints through [src/services/backendDataService.ts](src/services/backendDataService.ts). Examples include:

- `adminConferenceService`
- `adminAbstractService`
- `adminBlogService`
- `adminFaqService`
- `adminGalleryService`
- `adminPaymentService`
- `adminRegistrationService`
- `adminReportService`
- `adminSettingsService`
- `adminSpeakerService`
- `adminUserService`

## 11. MySQL queries for inspecting data

Registered users:

```sql
USE aizengo;

SELECT id, name, email, role, createdAt, updatedAt
FROM `User`
ORDER BY createdAt DESC;
```

Application records:

```sql
SELECT resource, recordKey, JSON_PRETTY(payload) AS data, updatedAt
FROM `DataRecord`
ORDER BY updatedAt DESC;
```

Conferences only:

```sql
SELECT recordKey, JSON_PRETTY(payload) AS conference
FROM `DataRecord`
WHERE resource = 'conferences'
ORDER BY recordKey;
```

Profiles only:

```sql
SELECT recordKey, JSON_PRETTY(payload) AS profile
FROM `DataRecord`
WHERE resource = 'userProfile';
```

Password hashes can be inspected for troubleshooting, but the original passwords cannot be recovered:

```sql
SELECT name, email, passwordHash
FROM `User`;
```

## 12. Development accounts

These accounts are created by the development seed script:

```text
Attendee    user@aizen.test       aizen123
Admin       admin@aizen.test      admin123
Super admin superadmin@aizen.test super123
```

Do not use these credentials in production.

## 13. Frontend routes

### Public routes

```text
/                    Home
/about               About
/conferences         Conference directory
/conferences/:slug   Conference details
/contact             Contact
/faq                 Frequently asked questions
/gallery             Photo gallery
/privacy-policy      Privacy policy
/terms               Terms of use
/sitemap             Sitemap
```

### Authentication routes

```text
/login
/register
/forgot-password
/reset-password
/admin/login
```

### User routes

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

## 14. Route protection

- Public pages are available without authentication.
- `/dashboard/*` is protected by `ProtectedRoute`.
- `/admin/*` is protected by `AdminRoute`.
- Admin access is granted to `ADMIN` and `SUPER_ADMIN` roles.

Route definitions are in [src/routes/AppRoutes.tsx](src/routes/AppRoutes.tsx).

## 15. Useful commands

Frontend:

```bash
npm run dev
npm run build
npm run lint
npm run preview
```

Backend:

```bash
cd server
npm run dev
npm run seed
./node_modules/.bin/tsc --noEmit -p tsconfig.json
```

Database/schema:

```bash
cd server
npx prisma generate
npx prisma db push
```

## 16. Troubleshooting

### Frontend says it cannot connect to the backend

Check that the backend is running on port `4000` and that this URL works:

```text
http://localhost:4000/api/health
```

Check `VITE_API_BASE_URL` if the backend uses another host or port.

### Database connection fails

Check:

1. MySQL is running.
2. Database `aizengo` exists.
3. The username and password in `server/.env` are correct.
4. The database user has privileges on `aizengo`.
5. Port `3306` is available.

### The database has no content

Run:

```bash
cd server
npx prisma db push
npm run seed
```

### A new website user is not visible in `server/src/seed-data/users.ts`

That is expected. Seed files are source fixtures only. Website registrations are stored in the MySQL `User` table.

### Password cannot be displayed

Passwords are hashed before storage. Use the password-reset flow to set a new password instead of attempting to retrieve the original password.

### Admin content changes are not visible on an already-open public page

The frontend loads one backend snapshot during startup. Reload the page to request a fresh snapshot after changing data from the admin area.

## 17. Production considerations

Before production deployment:

- Replace development credentials.
- Store secrets in a secure environment manager.
- Restrict CORS to the production frontend origin.
- Add authentication and authorization checks to `/api/data/*` routes.
- Validate and sanitize all incoming JSON payloads.
- Add rate limiting to authentication routes.
- Use HTTPS.
- Add database migrations and backups.
- Do not expose password hashes through administrative APIs.
- Add automated API and end-to-end tests.

## 18. Folder and file reference

This section explains the role of the project folders and source files.

### Root files

| File | Purpose |
| --- | --- |
| `index.html` | Vite HTML entry point. Contains the root element where React mounts. |
| `package.json` | Frontend scripts and dependencies. |
| `package-lock.json` | Locked frontend dependency versions. |
| `vite.config.ts` | Vite configuration and React plugin setup. |
| `tsconfig.json` | Base TypeScript project configuration. |
| `tsconfig.app.json` | TypeScript settings for frontend application code. |
| `tsconfig.node.json` | TypeScript settings for Node/Vite configuration files. |
| `eslint.config.js` | ESLint rules for TypeScript and React. |
| `.env.example` | Template for frontend environment variables. |
| `.gitignore` | Files excluded from Git, including dependencies, builds, and secrets. |
| `README.md` | Original project overview and Vite notes. |
| `END_TO_END.md` | Manual setup and application smoke-test guide. |
| `PROJECT_DOCUMENTATION.md` | Main project documentation. |

### `public/`

Static files copied directly to the built application:

| File | Purpose |
| --- | --- |
| `aizengo-logo.svg` | Main AizenGo logo. |
| `favicon.svg` | Browser tab icon. |
| `icons.svg` | Shared SVG icon definitions. |

### `src/`

The frontend application source code.

#### `src/main.tsx`, `src/App.tsx`, and styles

| File | Purpose |
| --- | --- |
| `main.tsx` | React entry point. Mounts `App` inside `AppProviders`. |
| `App.tsx` | Small application root that renders `AppRoutes`. |
| `index.css` | Global styles, design tokens, layout, responsive rules, and utility classes. |
| `App.css` | App-level stylesheet retained for application-specific styling. |

#### `src/api/`

API definitions and the shared Axios client. These files describe HTTP calls; they do not store application data.

| File | Purpose |
| --- | --- |
| `axios.ts` | Creates the Axios client and sets the backend base URL. |
| `authApi.ts` | Register, login, current-user, logout, and password-reset requests. |
| `dataApi.ts` | Generic snapshot, list, create, update, and delete requests for backend resources. |
| `conferenceApi.ts` | Conference list API wrapper. |
| `speakerApi.ts` | Speaker list API wrapper. |
| `abstractApi.ts` | Abstract list API wrapper. |
| `registrationApi.ts` | Registration list API wrapper. |
| `paymentApi.ts` | Payment list API wrapper. |
| `adminApi.ts` | Admin overview API wrapper. |
| `userApi.ts` | Current-user API wrapper. |

The generic `dataApi.ts` is the primary content API used by the current backend-backed services.

#### `src/components/`

Reusable React UI components. Pages compose these components instead of implementing every visual element themselves.

##### `components/common/`

Shared building blocks used throughout the site:

- `Button.tsx` — buttons and button variants.
- `Badge.tsx` — status and category badges.
- `Card.tsx` — card container and card content.
- `Input.tsx` — labeled input control.
- `Textarea.tsx` — labeled multiline input.
- `Select.tsx` — labeled select control.
- `FormControls.tsx` — shared form-control helpers.
- `Search.tsx` — search input UI.
- `Modal.tsx` — generic modal dialog.
- `Pagination.tsx` — generic pagination controls.
- `EmptyState.tsx` — empty-result display.
- `ErrorState.tsx` — error display.
- `Loader.tsx` — loading indicators and page loader.

##### `components/auth/`

- `AuthLayout.tsx` — layout for login and account forms.
- `LoginForm.tsx` — login form and API call.
- `RegisterForm.tsx` — account registration form.
- `ForgotPasswordForm.tsx` — starts password reset.
- `ResetPasswordForm.tsx` — sets a new password.
- `ProtectedRoute.tsx` — requires an authenticated user.
- `AdminRoute.tsx` — requires an admin or super-admin user.

##### `components/conference/`

Conference directory, search, filtering, cards, status, and pagination components:

- `ConferenceCard.tsx` — displays a conference summary.
- `ConferenceGrid.tsx` — lays out conference cards.
- `ConferenceFilters.tsx` and `ConferenceFilter.tsx` — filtering controls.
- `ConferenceSearch.tsx` — conference search field.
- `ConferenceSort.tsx` — sort selection.
- `ActiveFilters.tsx` — active filter chips.
- `ConferencePagination.tsx` — directory pagination.
- `ConferencePageHeader.tsx` — directory heading and breadcrumbs.
- `ConferenceEmptyState.tsx` — no-conferences result.
- `ConferenceStatusBadge.tsx` — conference status display.
- `ConferenceCardSkeleton.tsx` — loading placeholder.

The `components/conference/details/` folder contains the sections used on a conference detail page, including venue, program, committee, sponsors, gallery, FAQ, objectives, topics, dates, registration types, and related conferences.

The detail files are:

| File | Purpose |
| --- | --- |
| `AboutConference.tsx` | Conference description. |
| `AccommodationSection.tsx` | Accommodation information. |
| `ConferenceCTA.tsx` | Registration call to action. |
| `ConferenceCommittee.tsx` | Organizing and program committee. |
| `ConferenceFAQ.tsx` | Conference-specific questions. |
| `ConferenceGallery.tsx` | Conference photos. |
| `ConferenceHero.tsx` | Hero image and title. |
| `ConferenceInfo.tsx` | Quick facts such as dates, format, and location. |
| `ConferenceNotFound.tsx` | Missing conference state. |
| `ConferenceObjectives.tsx` | Conference objectives. |
| `ConferenceProgram.tsx` | Schedule and sessions. |
| `ConferenceSponsors.tsx` | Sponsors and partners. |
| `ConferenceTopics.tsx` | Topics and tracks. |
| `ConferenceVenue.tsx` | Venue and location. |
| `ImportantDates.tsx` | Submission, registration, and event dates. |
| `RegistrationCard.tsx` | Registration summary and action. |
| `RegistrationTypes.tsx` | Available registration tiers. |
| `RelatedConferences.tsx` | Similar backend conferences. |
| `index.ts` | Re-exports the detail components. |

##### `components/home/`

Homepage sections:

- `HeroSection.tsx` — homepage hero.
- `ConferenceSearchSection.tsx` — homepage conference search form.
- `ConferenceCategories.tsx` — backend-backed category cards.
- `FeaturedConferences.tsx` — featured backend conferences.
- `UpcomingConferences.tsx` — upcoming conference cards.
- `StatisticsSection.tsx` — platform statistics.
- `Testimonials.tsx` — participant testimonials.
- `HowItWorks.tsx` — platform workflow explanation.
- `WhyAizenGo.tsx` — value proposition section.
- `CTASection.tsx` — call-to-action banner.
- `NewsletterSection.tsx` — newsletter signup presentation.

##### `components/admin/`

Admin-specific UI:

- `AdminBreadcrumbs.tsx` — admin page breadcrumbs.
- `AdminFilters.tsx` and `AdminSearch.tsx` — admin list filtering and search.
- `AdminPagination.tsx` — admin list pagination.
- `AdminTable.tsx` — reusable admin table.
- `AdminModal.tsx` — admin confirmation/edit modal.
- `AdminStatCard.tsx` — dashboard KPI card.
- `DashboardCharts.tsx` — admin registration, category, and revenue charts.
- `AdminToast.tsx` — admin success/error notifications.

##### `components/layout/`

- `Header.tsx` — public desktop header.
- `MobileMenu.tsx` — mobile navigation.
- `Footer.tsx` — public footer.
- `AdminNavbar.tsx` and `AdminSidebar.tsx` — admin navigation shell.
- `UserNavbar.tsx` and `UserSidebar.tsx` — authenticated user navigation shell.

##### `components/about/`, `contact/`, `faq/`, `gallery/`, and `user/`

- `about/` — mission, vision, values, overview, and what-AizenGo-does sections.
- `contact/` — contact information and contact form.
- `faq/` — FAQ accordion.
- `gallery/` — backend-backed gallery grid and lightbox.
- `user/` — dashboard cards for registrations, abstracts, and upcoming conferences.

#### `src/constants/`

| File | Purpose |
| --- | --- |
| `app.ts` | Application-wide branding and app constants. |
| `conference.ts` | Conference-related option values and constants. |
| `roles.ts` | User role definitions. |
| `routes.ts` | Central route path constants. |

#### `src/context/`

React context providers:

- `AppProviders.tsx` — composes Redux, React Query, theme, authentication, and backend-data providers.
- `AuthContext.tsx` — manages login, registration, logout, reset flow, and the current authenticated user.
- `authContextValue.ts` — context object used by the authentication provider.
- `ThemeContext.tsx` and `themeContextValue.ts` — theme state and context value.
- `BackendDataContext.tsx` — provides the backend snapshot to the rendered application.
- `backendDataValue.ts` — context object used by the backend-data provider.

#### `src/hooks/`

Reusable behavior hooks:

- `useAuth.ts` — reads authentication context.
- `useBackendData.ts` — reads a typed resource from the backend snapshot.
- `useTheme.ts` — reads theme context.
- `useConferenceFilters.ts` — filters, sorts, and paginates conferences.
- `usePagination.ts` — generic pagination state.
- `useDebounce.ts` — delays rapidly changing input values.
- `useAdminToast.ts` — displays admin toast messages.

#### `src/layouts/`

- `PublicLayout.tsx` — public header, footer, and outlet.
- `UserLayout.tsx` — authenticated user navigation and outlet.
- `AdminLayout.tsx` — admin navigation and outlet.

#### `src/pages/`

Page-level route components.

##### `pages/public/`

Public website pages: `Home`, `About`, `Conferences`, `ConferenceDetails`, `Contact`, `FAQ`, `Gallery`, `PrivacyPolicy`, `TermsOfUse`, and `Sitemap`.

##### `pages/auth/`

Authentication pages: `Login`, `Register`, `ForgotPassword`, `ResetPassword`, and `VerifyOTP`.

##### `pages/user/`

Authenticated attendee pages:

- `Dashboard.tsx` — registration, abstract, certificate, and upcoming-event summary.
- `Profile.tsx` and `EditProfile.tsx` — view and update backend profile data.
- `MyConferences.tsx` — conferences associated with the user’s registrations.
- `Registrations.tsx` and `RegistrationDetails.tsx` — registration list and detail view.
- `Abstracts.tsx`, `SubmitAbstract.tsx`, and `AbstractDetails.tsx` — abstract workflow.
- `Certificates.tsx` — certificate records.
- `Notifications.tsx` — backend notification records and read/delete actions.
- `Payments.tsx` and `Invoices.tsx` — user payment and invoice pages.
- `Settings.tsx` — user settings page.

##### `pages/admin/`

Admin authentication and management pages:

- `AdminLogin.tsx` — administrator login.
- `Dashboard.tsx` — KPIs, charts, recent registrations, and abstracts.
- `conferences/` — conference list, create, and edit screens.
- `speakers/` — speaker list, create, and edit screens.
- `users/` — administrative user management.
- `registrations/` — registration management.
- `abstracts/` — abstract list and review screens.
- `blogs/` — blog list, create, and edit screens.
- `faqs/` — FAQ management.
- `gallery/` — gallery management.
- `payments/` — payment management.
- `reports/` — summary, revenue, abstract, and geography reports.
- `settings/` — website, conference, notification, and security settings.

Additional admin page files currently present in the source tree are:

| Folder | Files and purpose |
| --- | --- |
| `categories/` | `CategoryList.tsx` — category administration. |
| `cities/` | `CityList.tsx` — city administration. |
| `countries/` | `CountryList.tsx` — country administration. |
| `committee/` | `CommitteeList.tsx`, `CreateCommittee.tsx`, `EditCommittee.tsx` — committee management. |
| `conferences/` | `ConferenceList.tsx`, `ConferenceView.tsx`, `CreateConference.tsx`, `EditConference.tsx` — conference management and view. |
| `schedules/` | `ScheduleList.tsx` — schedule administration. |
| `sponsors/` | `SponsorList.tsx` — sponsor administration. |
| `users/` | `UserList.tsx`, `UserDetails.tsx` — user administration and detail view. |
| `venues/` | `VenueList.tsx` — venue administration. |

The active route tree in `src/routes/AppRoutes.tsx` currently registers the main conference, speaker, user, registration, abstract, blog, FAQ, gallery, payment, report, settings, and user-management pages. A source file existing under `pages/admin` does not automatically make it reachable; it must also be added to `AppRoutes.tsx`.

#### `src/routes/`

- `AppRoutes.tsx` — active route tree for public, auth, user, and admin areas.
- `ProtectedRoute.tsx` — authenticated-route guard helper.
- `RoleRoute.tsx` — role-specific route guard helper.
- `PublicRoutes.tsx`, `UserRoutes.tsx`, and `AdminRoutes.tsx` — route aliases retained for route organization and compatibility.

#### `src/services/`

Service modules provide domain-specific operations above the raw API layer:

- `backendDataService.ts` — generic backend list/create/update/delete helpers.
- `authService.ts` — authentication service alias.
- `conferenceService.ts` and `speakerService.ts` — API service aliases.
- `adminConferenceService.ts` — backend conference CRUD and publish/featured actions.
- `adminAbstractService.ts` — backend abstract review and reviewer assignment.
- `adminBlogService.ts` — backend blog CRUD and publish actions.
- `adminFaqService.ts` — backend FAQ CRUD and publish actions.
- `adminGalleryService.ts` — backend gallery CRUD and featured actions.
- `adminPaymentService.ts` — backend payment status updates.
- `adminRegistrationService.ts` — backend registration creation and status updates.
- `adminReportService.ts` — backend report and chart data retrieval.
- `adminSettingsService.ts` — backend system settings retrieval and updates.
- `adminSpeakerService.ts` — backend speaker CRUD and featured actions.
- `adminUserService.ts` — backend administrative user record operations.

#### `src/store/`

Redux configuration and slices:

- `index.ts` — configures and exports the Redux store.
- `authSlice.ts` — authentication-related Redux state placeholder.
- `userSlice.ts` — user-related Redux state placeholder.
- `conferenceSlice.ts` — conference-related Redux state placeholder.
- `notificationSlice.ts` — notification-related Redux state placeholder.

Most current server-backed content is read through `BackendDataContext` or domain services rather than Redux.

#### `src/types/`

TypeScript domain models:

- `auth.ts` — user roles, authentication state, login, registration, and reset types.
- `user.ts` — user and user-profile types.
- `conference.ts` — conference, schedule, venue, committee, sponsor, and registration types.
- `abstract.ts` — abstract submission, author, and review status types.
- `registration.ts` — registration and payment status types.
- `payment.ts` — payment methods and payment records.
- `certificate.ts` — certificate records.
- `notification.ts` — notification records.
- `speaker.ts` — speaker records.
- `admin.ts` — admin statistics, settings, report, and chart types.
- `content.ts` — blog, category, FAQ, gallery, statistics, and testimonial types/constants.
- `common.ts` — shared generic types.

#### `src/utils/`

Small pure helper functions:

- `formatCurrency.ts` — formats monetary values.
- `formatDate.ts` — formats dates for display.
- `helpers.ts` — shared general-purpose helpers.
- `validation.ts` — validation utilities.

#### `src/assets/`

Bundled image and SVG assets used by frontend components. These are processed by Vite rather than copied unchanged like files in `public/`.

## 19. Backend file reference

### `server/src/index.ts`

Main Express server. It configures CORS and JSON parsing, exposes health/auth/user/data routes, and starts the API on port `4000`.

### `server/src/lib/`

- `prisma.ts` — creates Prisma Client with the MariaDB adapter and database environment variables.
- `password.ts` — hashes and verifies passwords.
- `session.ts` — creates sessions, hashes tokens, checks expiration, and resolves the current user.

### `server/src/seed.ts`

Reads server seed data, creates or updates development accounts, and upserts JSON resources into `DataRecord`.

### `server/src/seed-data/`

Server-only initial data grouped by resource:

| File | Resource |
| --- | --- |
| `abstracts.ts` | Abstract submissions |
| `adminStats.ts` | Admin dashboard statistics and chart data |
| `blogs.ts` | Blog posts |
| `categories.ts` | Conference categories |
| `certificates.ts` | Certificates |
| `conferences.ts` | Conferences and detailed conference content |
| `faqs.ts` | Frequently asked questions |
| `gallery.ts` | Gallery records |
| `notifications.ts` | User notifications |
| `payments.ts` | Payment records |
| `registrations.ts` | Conference registrations |
| `reports.ts` | Report summaries and chart data |
| `settings.ts` | System settings |
| `speakers.ts` | Speaker records |
| `statistics.ts` | Public statistics |
| `testimonials.ts` | Participant testimonials |
| `userProfile.ts` | Initial profile record |
| `users.ts` | Development accounts and initial admin user records |

These files are seed input, not the live database. Website changes are stored in MySQL.

### `server/prisma/`

- `schema.prisma` — Prisma data model for `User`, `Session`, and `DataRecord`.

### `server/prisma7.config.ts`

Prisma CLI configuration. It points Prisma to `prisma/schema.prisma`, the migrations directory, and `DATABASE_URL`.

### `server/package.json`

Backend scripts:

- `npm run dev` — starts the API with `tsx watch`.
- `npm run seed` — seeds development data.
- `npm test` — currently a placeholder test command.

### `server/generated/prisma/`

Generated Prisma client files. Do not edit these files manually. Regenerate them with:

```bash
cd server
npx prisma generate
```

## 20. How to trace a feature

For a frontend feature, follow this order:

```text
Route -> Page -> Component -> Hook/Service -> API client -> Express route -> Prisma -> MySQL
```

For example, registration follows:

```text
Register page
  -> RegisterForm.tsx
  -> AuthContext.tsx
  -> authApi.ts
  -> POST /api/auth/register
  -> prisma.user.create()
  -> MySQL User table
```

For conference content:

```text
AppProviders.tsx
  -> backendHydration.ts
  -> GET /api/data/snapshot
  -> DataRecord table
  -> BackendDataContext
  -> Conference page/component
```

## 21. Special folders inside `server/`

The server contains a few folders that are not normal application source folders.

| Folder | What it is used for | Edit it? |
| --- | --- | --- |
| `server/.agents/` | Local agent/tool skill instructions. The Prisma skill folders contain guidance for development tools, not backend runtime code. | Normally no. |
| `server/.claude/` | Claude-related local tool configuration or skill files. It is not imported by the Express server. | Normally no. |
| `server/.windsurf/` | Windsurf-related local tool configuration or skill files. It is not imported by the Express server. | Normally no. |
| `server/generated/` | Generated Prisma Client TypeScript code produced from `prisma/schema.prisma`. | No; regenerate it. |
| `server/node_modules/` | Installed backend npm dependencies. | No; recreate with `npm install`. |
| `server/prisma/` | Prisma schema and database migration location. | Edit `schema.prisma` when changing the database model. |
| `server/src/` | Actual backend source code. | Yes; this is the main backend code. |

### `server/generated/prisma/`

This folder is generated when Prisma runs:

```bash
cd server
npx prisma generate
```

The backend imports the generated client from `server/src/lib/prisma.ts`:

```text
server/src/lib/prisma.ts
  -> server/generated/prisma/client.ts
  -> MySQL database
```

Important generated files include:

- `client.ts` — generated Prisma Client entry point.
- `models.ts` — generated model types for `User`, `Session`, and `DataRecord`.
- `enums.ts` — generated enum definitions.
- `commonInputTypes.ts` — generated query input types.
- `browser.ts` — generated browser-compatible client exports.
- `internal/` — Prisma internal runtime implementation.

Do not manually modify files under `server/generated/prisma`. If the schema changes or generated files are missing, run `npx prisma generate` again.

### `server/.agents/`, `server/.claude/`, and `server/.windsurf/`

These are development-assistant/tooling folders. They help coding tools understand Prisma or store local workflow metadata. They are not loaded by:

- Express
- Prisma Client
- the frontend
- the MySQL database

Deleting them normally does not change application behavior, but the associated development tool may recreate them or lose its local instructions.

### Other server files

- `.env` — local database credentials and server port. Keep private and do not commit it.
- `.env.example` — safe configuration template.
- `.gitignore` — excludes server dependencies, environment files, and generated/local files as configured.
- `package.json` — backend dependencies and scripts.
- `package-lock.json` — locked backend dependency versions.
- `prisma7.config.ts` — Prisma CLI configuration.
- `skills-lock.json` — local tooling/skill dependency lock information; it is not application data.
