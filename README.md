# Keith's Superstores — Shift Scheduling & Waste Tracking Platform

A production-ready scheduling + profit control engine for restaurant/grocery operations.

## Features

- **Role-Based Access Control** — Admin, Manager, Employee with server-enforced permissions
- **Shift Scheduling** — Create, assign, approve shifts with overlap prevention
- **Shift Claim Flow** — Employees claim open shifts; approval gate for managers
- **Clock In / Clock Out** — Real-time shift time tracking
- **Waste Tracking** — Per-shift waste logs with reason codes
- **Production Tracking** — Per-shift production logs with cost tracking
- **Performance Metrics** — Efficiency scores and leaderboards
- **Smart Alerts** — AI-assisted identification of high-waste employees
- **Shift Lock** — Admins lock completed shifts to prevent edits
- **Swap Requests** — Employee shift swap workflow with manager approval
- **In-App Notifications** — Real-time bell icon with unread count
- **Analytics Dashboard** — Daily trends, top wasters, bar/line charts (7/30/90 day)
- **Week Calendar View** — Color-coded shift dots per day
- **Executive Dashboard** — Waste $, savings projections, store scorecard, ROI report

## Tech Stack

| Layer      | Technology                   |
|------------|------------------------------|
| Frontend   | Next.js 14, React 18, Tailwind CSS |
| Backend    | Next.js API Routes (Edge-ready) |
| Database   | PostgreSQL (Supabase compatible) |
| Auth       | JWT (httpOnly cookies + localStorage) |
| Charts     | Recharts |
| Password   | bcryptjs |

## Quick Start

### 1. Clone and install

```bash
git clone <repo-url>
cd smarter-production-app
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
# Edit .env.local with your DATABASE_URL and JWT_SECRET
```

### 3. Set up PostgreSQL database

**Option A — Supabase (recommended for production)**
1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor and run the migration file:
   ```sql
   -- Copy and paste contents of migrations/001_initial.sql
   ```
3. Get your connection string from Project Settings → Database

**Option B — Local PostgreSQL**
```bash
psql -U postgres -c "CREATE DATABASE keiths_dev;"
psql -U postgres -d keiths_dev -f migrations/001_initial.sql
DATABASE_URL=postgresql://postgres:password@localhost:5432/keiths_dev
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000/login](http://localhost:3000/login)

### 5. Default seed accounts

| Email              | Password    | Role     |
|--------------------|-------------|----------|
| admin@keiths.com   | password123 | Admin    |
| manager@keiths.com | password123 | Manager  |
| john@keiths.com    | password123 | Employee |
| jane@keiths.com    | password123 | Employee |

## Project Structure

```
src/
├── app/
│   ├── api/                        # Backend API routes
│   │   ├── auth/login|logout|me/
│   │   ├── shifts/[id]/claim|approve|lock|clock/
│   │   ├── waste-logs/
│   │   ├── production-logs/
│   │   ├── users/[id]/
│   │   ├── notifications/
│   │   ├── swap-requests/
│   │   └── analytics/
│   ├── (scheduling)/               # Scheduling app pages
│   │   ├── login/
│   │   └── scheduling/
│   │       ├── dashboard/          # Admin analytics + employee today view
│   │       ├── schedule/           # Week calendar + shift cards
│   │       ├── shifts/[id]/        # Shift detail, waste/production logging
│   │       ├── users/              # Team management (admin/manager)
│   │       └── profile/            # Personal stats + password change
│   ├── executive/                  # Executive dashboard (10-feature analytics)
│   └── (existing app pages)/       # Legacy localStorage-based app
├── components/
│   ├── scheduling/
│   │   ├── SchedulingShell.tsx     # App shell with nav + auth guard
│   │   ├── ShiftCard.tsx           # Shift card with action buttons
│   │   ├── WeekCalendar.tsx        # 7-day calendar with shift dots
│   │   └── NotificationBell.tsx    # Real-time notification bell
│   └── (existing components)/
├── context/
│   ├── AuthContext.tsx             # JWT auth context
│   └── StoreContext.tsx            # Multi-store selector
├── lib/
│   ├── db.ts                       # PostgreSQL connection pool
│   ├── auth.ts                     # JWT sign/verify, bcrypt, cookies
│   ├── apiMiddleware.ts            # withAuth wrapper, apiOk/apiError helpers
│   └── apiClient.ts                # Typed fetch wrappers for all endpoints
├── types/
│   └── scheduling.ts               # All TypeScript interfaces
└── migrations/
    └── 001_initial.sql             # Complete DB schema + seed data
```

## Deployment — Vercel + Supabase

### Supabase
1. Create project at supabase.com
2. Run `migrations/001_initial.sql` in SQL Editor
3. Copy connection string (URI mode, port 5432)

### Vercel
```bash
npm i -g vercel
vercel
```

Set environment variables in Vercel dashboard:
- `DATABASE_URL` — your Supabase connection string
- `JWT_SECRET` — random 32+ char secret
- `NODE_ENV` — `production`

### Custom domain
Point your domain to Vercel and update `NEXTAUTH_URL`.

## Shift Status Flow

```
unassigned → (employee claims) → pending → (manager approves) → approved
                                         ↘ (manager denies)  → unassigned

approved → (employee clocks in)  → [clock_in recorded]
         → (employee clocks out) → completed
                                 → (admin locks) → locked
```

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/auth/login | Public | Login, returns JWT |
| POST | /api/auth/logout | Public | Clear auth cookie |
| GET | /api/auth/me | Any | Current user |
| GET | /api/shifts | Any | List shifts |
| POST | /api/shifts | Admin/Manager | Create shift |
| GET | /api/shifts/:id | Any | Shift detail + logs |
| PUT | /api/shifts/:id | Admin/Manager | Update shift |
| DELETE | /api/shifts/:id | Admin | Delete shift |
| POST | /api/shifts/:id/claim | Any | Claim shift |
| POST | /api/shifts/:id/approve | Admin/Manager | Approve/deny claim |
| POST | /api/shifts/:id/lock | Admin | Lock completed shift |
| POST | /api/shifts/:id/clock | Any | Clock in/out |
| GET/POST | /api/waste-logs | Any | Waste log CRUD |
| GET/POST | /api/production-logs | Any | Production log CRUD |
| GET/POST | /api/users | Admin/Manager | User management |
| PUT/DELETE | /api/users/:id | Admin | Update/deactivate user |
| GET/PATCH | /api/notifications | Any | Notifications |
| GET/POST/PATCH | /api/swap-requests | Any | Shift swap flow |
| GET | /api/analytics | Admin/Manager | Analytics summary |

## Security Notes

- All API routes validate JWT on every request
- Role enforcement is server-side only — client role is never trusted
- Locked shifts reject all write operations
- Overlap detection runs before any shift assignment
- Passwords hashed with bcrypt (cost factor 10)
- JWT expires in 8 hours
- httpOnly cookies used in production

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| DATABASE_URL | Yes | PostgreSQL connection string |
| JWT_SECRET | Yes | Secret for signing JWTs (32+ chars) |
| NODE_ENV | No | Set to `production` on deploy |
