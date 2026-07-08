# Interview Panel Scheduler

A full-stack conflict-free interview scheduling system for placement drives —
built to solve the real scheduling chaos of campus placements: multiple
interviewers, multiple candidates, limited rooms, zero double-bookings.

## Why this project stands out

Most student projects default to MongoDB for everything because it's easier,
even when the data is clearly relational. This project deliberately uses
**MySQL** because the domain genuinely calls for it: interviewers, candidates,
rooms, and time slots have real referential constraints (foreign keys) and a
real invariant that must never be violated — **no room, interviewer, or
candidate can be double-booked for an overlapping time**. The database itself
enforces part of this (a `UNIQUE(room_id, slot_id)` constraint), and the
application layer enforces the rest with an **interval-overlap conflict
detection algorithm**, wrapped in a SQL transaction with row-level locking
(`SELECT ... FOR UPDATE`) to prevent race conditions when two admins try to
book at the same moment.

It also deliberately mixes two rendering approaches for two different
audiences:
- **EJS (server-rendered)** for the admin/placement-cell panel — an internal
  tool with low traffic where a SPA would be overkill.
- **React** for the public-facing schedule lookup page — candidates and
  interviewers just need to check their slot, so it's a lightweight,
  fast, client-rendered experience.

## Tech stack

- **Backend:** Node.js, Express, MySQL (`mysql2`), EJS, express-session
- **Frontend:** React 18, Vite, Bootstrap 5
- **Auth:** bcrypt-hashed passwords, session-based auth for the admin panel

## Core features

- Admin registration/login (session-based)
- Create interview drives (company + date)
- Bulk-add rooms, interviewers, and candidates (paste a list)
- Auto-generate time slots for a day (e.g. "9 AM–5 PM, 20-minute slots")
- Assign candidate + interviewer + room + slot, with **live conflict
  detection** — the UI shows exactly why a booking failed (room conflict,
  interviewer conflict, or candidate conflict) rather than a generic error
- Cancel bookings
- Public React page where any candidate (by roll number) or interviewer (by
  email) can look up their assigned schedule for a drive — no login needed

## Project structure

```
interview-scheduler/
├── backend/
│   ├── config/db.js              # MySQL connection pool
│   ├── controllers/
│   │   ├── adminAuthController.js
│   │   ├── driveController.js    # drive/room/slot/interviewer/candidate CRUD
│   │   ├── bookingController.js  # the conflict-checked booking transaction
│   │   └── publicController.js   # public schedule lookup API (used by React)
│   ├── middleware/auth.js
│   ├── routes/
│   │   ├── adminRoutes.js        # EJS admin panel routes
│   │   └── apiRoutes.js          # JSON API (bookings + public lookup)
│   ├── utils/
│   │   ├── conflictDetection.js  # the core overlap-checking algorithm
│   │   └── generateSlots.js
│   ├── views/                    # EJS templates for the admin panel
│   ├── db/schema.sql             # full MySQL schema with constraints
│   └── server.js
└── frontend/
    ├── src/
    │   ├── api/axios.js
    │   ├── components/ScheduleCard.jsx
    │   └── App.jsx                # the public schedule lookup page
    └── vercel.json
```

## Local setup

### 1. Database

You need a MySQL server (local install, or a free-tier hosted one like
[Railway](https://railway.app) or [Aiven](https://aiven.io)).

```bash
mysql -u root -p -e "CREATE DATABASE interview_scheduler;"
mysql -u root -p interview_scheduler < backend/db/schema.sql
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env`:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=interview_scheduler
PORT=5000
SESSION_SECRET=any_long_random_string
```

```bash
npm run dev
```

Visit `http://localhost:5000/admin/register` to create your first admin
account, then log in and create a drive.

### 3. Frontend (public schedule lookup)

```bash
cd frontend
npm install
cp .env.example .env
```

`.env`:
```
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev
```

Visit `http://localhost:5173` — pick a drive, enter a roll number or email,
and see the assigned schedule.

## Deployment

### Backend → Render / Railway

The admin panel is server-rendered (EJS) and uses sessions, so it needs a
persistent Node process — Render or Railway work well (Vercel's serverless
functions aren't a great fit for session-based apps).

1. Push to GitHub.
2. Render → New → Web Service → connect your repo, root directory `backend`.
3. Build command: `npm install`. Start command: `npm start`.
4. Add environment variables: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`,
   `SESSION_SECRET`.
5. For the database, use a hosted MySQL add-on (Railway's MySQL plugin,
   PlanetScale, or Aiven's free tier all work).
6. Run `schema.sql` against your hosted database once, using the connection
   details it gives you.

### Frontend → Vercel

1. Vercel → New Project → import repo, root directory `frontend`.
2. Framework preset: Vite.
3. Environment variable: `VITE_API_URL` = your Render backend URL + `/api`.
4. Deploy.

### GitHub

```bash
cd interview-scheduler
git init
git add .
git commit -m "Initial commit: interview scheduler with conflict-free booking"
git branch -M main
git remote add origin https://github.com/<your-username>/interview-scheduler.git
git push -u origin main
```

`.env` files are already gitignored in both `backend/` and `frontend/`.

## Talking about this project in interviews


