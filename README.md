# BuildTrack: Construction Project Intelligence Platform

Next.js 16 (App Router) + TypeScript + Prisma + PostgreSQL (Supabase) + Better Auth + Tailwind + shadcn/ui + Recharts.

## Features

- 5 roles: Admin, Project Manager, Site Engineer, Finance Manager, Contractor
- Projects, milestones, contractor assignment
- Tasks: Kanban board, dependencies (blocked and circular checks), overdue detection, comments, history
- Budget and expenses: budget vs actual, overrun alerts, CSV export
- Materials: stock in/out in DB transactions, low-stock alerts, requests and approval
- Progress reports with photo upload (Supabase Storage)
- Reports and charts, notifications, activity log, profile settings, dark mode

## Setup

```bash
npm install
cp .env.example .env      # fill the values
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

### Environment variables

| Name                      | Purpose                                            |
| ------------------------- | -------------------------------------------------- |
| DATABASE_URL              | Supabase pooler URL (port 6543, `?pgbouncer=true`) |
| DIRECT_URL                | Direct/session URL (port 5432), used by migrations |
| BETTER_AUTH_SECRET        | 32+ character random string                        |
| BETTER_AUTH_URL           | App base URL                                       |
| SUPABASE_URL              | Supabase project URL                               |
| SUPABASE_SERVICE_ROLE_KEY | Server-only key (never expose)                     |

Create a public Storage bucket named `progress-photos`.

## Demo credentials (password for all: `Password123!`)

| Role            | Email                     |
| --------------- | ------------------------- |
| Admin           | admin@buildtrack.com      |
| Project Manager | pm@buildtrack.com         |
| Site Engineer   | engineer@buildtrack.com   |
| Finance Manager | finance@buildtrack.com    |
| Contractor      | contractor@buildtrack.com |

## Security and business rules (enforced on the server)

- Every page and action calls `requireRole(...)`; data is filtered by scope helpers (`projectScope`, `taskScope`)
- Public registration always creates a Contractor; a client can never set its own role
- Budget and utilization are calculated on the server
- Material usage can never exceed available stock (guarded atomic update)
- Contractors see only their projects and tasks; engineers only their tasks
- Expenses must reference a valid project; completed tasks keep their history
- Finance cannot change users or system settings

## Seed data

10 projects, 100 tasks, 20 contractors, 60 expenses, 30 materials.

Docs: [Database design](docs/DATABASE.md), [API](docs/API.md)
