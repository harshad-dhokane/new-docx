Docx Craft

A modern full-stack document management and PDF conversion platform, leveraging React, Express, TypeScript, Drizzle ORM, and Supabase for authentication and storage.

---

## Table of Contents

- [Docx Craft](#docx-craft)
  - [Table of Contents](#table-of-contents)
  - [Project Overview](#project-overview)
  - [Architecture](#architecture)
  - [Key Packages \& Why They Are Used](#key-packages--why-they-are-used)
    - [Frontend](#frontend)
    - [Backend](#backend)
    - [Shared](#shared)
    - [Dev \& Tooling](#dev--tooling)
    - [Docker](#docker)
  - [Supabase Integration](#supabase-integration)
  - [Setup \& Running the Project](#setup--running-the-project)
    - [1. Prerequisites](#1-prerequisites)
    - [2. Clone the Repository](#2-clone-the-repository)
    - [3. Install Dependencies](#3-install-dependencies)
    - [4. Configure Supabase](#4-configure-supabase)
    - [5. Configure Environment Variables](#5-configure-environment-variables)
    - [6. Database Migrations](#6-database-migrations)
    - [7. Start the Development Servers](#7-start-the-development-servers)
    - [8. Using Docker (Optional)](#8-using-docker-optional)
  - [Scripts](#scripts)
  - [Testing](#testing)
  - [License](#license)

---

## Project Overview

**Docx Craft** is a full-stack application for managing, converting, and analyzing documents. It features:

- User authentication and file storage via Supabase
- Document upload, conversion to PDF, and management
- Modern React frontend with TailwindCSS
- Type-safe Express API with Drizzle ORM and PostgreSQL
- End-to-end and unit testing
- Docker support for deployment

---

## Architecture

```
client/         # React frontend (Vite, TailwindCSS, Supabase client)
server/         # Express backend (TypeScript, Drizzle ORM, Supabase admin)
shared/         # Shared types and schema
drizzle/        # Database migrations
```

- **Frontend**: React (Vite), TypeScript, TailwindCSS, Supabase JS client
- **Backend**: Express, TypeScript, Drizzle ORM, Supabase Admin SDK
- **Database**: PostgreSQL (managed by Supabase)
- **Storage**: Supabase Storage Buckets
- **Authentication**: Supabase Auth

---

## Key Packages & Why They Are Used

### Frontend

- **react** / **react-dom**: Core UI library for building the SPA.
- **vite**: Fast build tool for modern React apps.
- **typescript**: Type safety across the codebase.
- **@supabase/supabase-js**: Connects the frontend to Supabase for auth, storage, and database.
- **tailwindcss**: Utility-first CSS framework for rapid UI development.
- **recharts**: For rendering charts and analytics.
- **axios**: HTTP client for API calls.
- **react-router-dom**: Routing in the SPA.

### Backend

- **express**: Web server for API endpoints.
- **@supabase/supabase-js**: Used for server-side Supabase operations (auth, storage).
- **drizzle-orm**: Type-safe ORM for PostgreSQL, used for migrations and queries.
- **pg**: PostgreSQL driver for Node.js.
- **dotenv**: Loads environment variables.
- **cors**: Enables CORS for API.
- **morgan**: HTTP request logging.
- **zod**: Schema validation for API inputs.
- **multer**: Handles file uploads (if not using direct Supabase upload).
- **jsonwebtoken**: For JWT validation (if custom auth logic is needed).

### Shared

- **zod**: Shared schema validation between client and server.
- **typescript**: Shared types for API and DB.

### Dev & Tooling

- **eslint** / **prettier**: Linting and formatting.
- **jest** / **vitest**: Unit testing.
- **ts-node**: Run TypeScript scripts (e.g., migrations).
- **nodemon**: Hot-reloading for backend dev.

### Docker

- **Dockerfile**: For containerized deployment.

---

## Supabase Integration

- **Authentication**: User sign-up, login, and session management via Supabase Auth.
- **Database**: PostgreSQL database managed by Supabase, accessed via Drizzle ORM and Supabase client.
- **Storage**: File uploads (documents, PDFs) stored in Supabase Storage Buckets.
- **API Security**: Backend validates Supabase JWTs for protected endpoints.

---

## Setup & Running the Project

### 1. Prerequisites

- Node.js (v18+)
- [pnpm](https://pnpm.io/) or npm
- [Supabase account](https://supabase.com/) and project

### 2. Clone the Repository

```sh
git clone <repo-url>
cd Docx-craft-testing
```

### 3. Install Dependencies

```sh
npm install
```

### 4. Configure Supabase

1. **Create a Supabase project** at https://app.supabase.com/
2. **Get your Supabase URL and anon/public key** from the project settings.
3. **Create a storage bucket** (e.g., `documents`).
4. **Set up authentication providers** as needed (email, OAuth, etc.).
5. **Get your service role key** (for backend/admin operations).

### 5. Configure Environment Variables

Create a `.env` file in the root:

```
DATABASE_URL=postgresql://postgres:<password>@db.<your-project>.supabase.co:5432/postgres
VITE_SUPABASE_URL=https://<your-project>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
SUPABASE_BUCKET=documents
PORT=5000
NODE_ENV=development
VITE_SENTRY_DSN=your-sentry-dsn

```

- The DATABASE_URL can be found in the Connect button under Direct Connection.
- The `VITE_` prefix is required for Vite to expose env vars to the frontend.

### 6. Database Migrations

If using Drizzle ORM for custom tables:

```sh
npm run db:migrate
```

Supabase also provides its own migration tools for SQL changes.

### 7. Start the Development Servers

**Start the backend:**

```sh
npm run dev:server
```

**Start the frontend:**

```sh
npm run dev:client
```

- Frontend: http://localhost:5173
- API: http://localhost:5000

### 8. Using Docker (Optional)

```sh
docker build -t docx-craft .
docker run -p 5000:5000 --env-file .env docx-craft
```

---

## Scripts

- `npm run dev:client` — Start React frontend
- `npm run dev:server` — Start Express backend
- `npm run build` — Build client and server
- `npm start` — Start production server
- `npm run db:migrate` — Run Drizzle ORM migrations
- `npm run test` — Run unit tests

---

## Testing

- **Unit tests:** `npm run test`

## Error Monitoring with Sentry

1. **Get a Sentry DSN:**

   - Sign up at [sentry.io](vscode-file://vscode-app/c:/Users/harsh/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-sandbox/workbench/workbench.html) and create a project (choose React).
   - Copy your DSN (Data Source Name).

2. Add DSN to [.env](vscode-file://vscode-app/c:/Users/harsh/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-sandbox/workbench/workbench.html):
   `VITE_SENTRY_DSN=your_sentry_dsn_here`
3. **Sentry is initialized in [main.tsx](vscode-file://vscode-app/c:/Users/harsh/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-sandbox/workbench/workbench.html):**
   No further action needed unless you want to change the DSN.
4. **Test Sentry:**

   - Run the app.
   - Click the “Break the world” button (if present) to trigger a test error.
   - Check your Sentry dashboard for the error.

## End-to-End Testing with Playwright

1. **Install dependencies:**

   `npm install`

2. **Run Playwright tests:**

   `npx playwright test`

3. **Run Playwright in headed (UI) mode:**

   `npx playwright test --headed`

4. **Open Playwright Test UI:**

   `npx playwright test --ui`

5. **View HTML test report:**

   After running tests, open the report:

   `npx playwright show-report`

6. **Add new tests:**

   - Place new test files in the [tests](vscode-file://vscode-app/c:/Users/harsh/AppData/Local/Programs/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-sandbox/workbench/workbench.html) directory.
   - See existing tests for examples.
