# Sweety – Blood Glucose Tracker

A full-stack blood glucose tracking web application designed for diabetes patients. Users can record up to 4 daily blood glucose measurements across predefined routine time slots and generate summary reports (Daily, Month-to-date, and Previous Month).

---

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (using the `pg` driver with parameterized queries, no ORM)
- **Frontend:** React 18, Vite, React Router v6, plain CSS (no heavy UI libraries)
- **Authentication:** JSON Web Tokens (JWT) & `bcryptjs` for password hashing
- **Testing:** Jest & Supertest for unit, integration, and API validation testing

---

## Key Features

1. **User Authentication & Privacy Isolation:**
   - Registration with name, email, and password.
   - Passwords hashed using `bcrypt` (never stored as plain text).
   - JWT-based authorization protecting all readings and reports endpoints.
   - Strict tenant isolation: every query scopes data to the authenticated `user_id`. Any attempt to view, edit, or delete another user's reading returns `404 Not Found`.

2. **Glucose Readings CRUD & Validation:**
   - Predefined time slots:
     - `morning` ("Morning (fasting)")
     - `after_breakfast` ("After breakfast")
     - `after_lunch` ("After lunch")
     - `after_dinner` ("After dinner")
   - Enforced server-side validation rules (with exact error responses):
     - Value missing &rarr; `"Please enter a glucose value."`
     - Value not a whole integer between 40 and 600 &rarr; `"Value must be between 40 and 600 mg/dl."`
     - 4 readings limit per day &rarr; `"You can add only 4 readings per day."` (checked first)
     - Duplicate slot on the same day &rarr; `"You already have an <Slot Label> reading for this date."` (checked second)
     - Date in future &rarr; `"Date cannot be in the future."`
   - Database safety nets: `CHECK (value BETWEEN 40 AND 600)` and `UNIQUE (user_id, reading_date, slot)`.

3. **Analytics & Reports:**
   - **Daily Report:** Selected date's highest, lowest, average (rounded to 1 decimal), count, and chronological list of readings ordered morning to dinner.
   - **Month-to-Date Report:** 1st of the selected date's month through the selected date (e.g. `1 Oct – 15 Oct 2026`).
   - **Previous Month Report:** The whole previous calendar month relative to the selected date (e.g. for `15 Oct 2026`, range is `1 Sep – 30 Sep 2026`). Correctly handles year rollovers (January &rarr; December of previous year) and leap years.
   - Friendly empty state when no readings exist (`"No readings for this period yet."`).

---

## Folder Structure

```text
sweety/
├── README.md
├── .gitignore
├── docker-compose.yml          # Optional PostgreSQL container (included, not tested)
├── server/
│   ├── package.json
│   ├── .env.example
│   ├── seed.js                 # Demo data seed script
│   ├── db/
│   │   ├── schema.sql          # DDL tables, constraints, and indexes
│   │   └── setup.js            # Database table creation script ("npm run db:setup")
│   ├── src/
│   │   ├── app.js              # Express app configuration & middleware
│   │   ├── server.js           # Server entry point (starts listener)
│   │   ├── config/
│   │   │   └── db.js           # pg connection pool & DATE parser config
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── readingController.js
│   │   │   └── reportController.js
│   │   ├── middleware/
│   │   │   └── auth.js         # JWT verification middleware
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── readingRoutes.js
│   │   │   └── reportRoutes.js
│   │   └── utils/
│   │       ├── dateRanges.js   # Pure date range calculation helpers
│   │       ├── slots.js        # Shared slot keys and labels
│   │       └── validateReading.js # Server validation business logic
│   └── tests/
│       ├── testHelper.js       # Test DB harness & cleanup helpers
│       ├── auth.test.js        # Password hashing & user isolation tests
│       ├── dateRanges.test.js  # Date range math & leap year tests
│       ├── readingsValidation.test.js # 5 API validation rule tests
│       └── reports.test.js     # Daily, MTD, and previous month report tests
└── client/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── .env.example
    └── src/
        ├── main.jsx            # React root mount
        ├── App.jsx             # React router & layout
        ├── api/
        │   └── api.js          # Centralized fetch wrapper (attaches JWT)
        ├── context/
        │   └── AuthContext.jsx # Global auth state & session recovery
        ├── constants/
        │   └── slots.js        # Shared slot keys and UI labels
        ├── components/
        │   ├── Navbar.jsx      # Navigation header with user info & logout
        │   ├── ProtectedRoute.jsx # Route authentication guard
        │   ├── ReadingForm.jsx # Add/edit reading form with server error display
        │   ├── ReadingList.jsx # Tabular reading history with edit/delete
        │   └── ReportCard.jsx  # Reusable metric card with stats & breakdown
        ├── pages/
        │   ├── LoginPage.jsx
        │   ├── SignupPage.jsx
        │   ├── ReadingsPage.jsx
        │   └── ReportsPage.jsx
        └── styles/
            └── app.css         # Plain CSS styling
```

---

## Prerequisites

- **Node.js:** v18.x or higher (tested on Node v24.18.0)
- **npm:** v9.x or higher
- **PostgreSQL:** v14 or higher running locally on port 5432 (or running via Docker; `docker-compose.yml` is included in the project root for convenience, but is not tested)

---

## Installation & Setup

### 1. Clone the repository
```bash
git clone <repository-url>
cd sweety
```

### 2. Configure Environment Variables

**Server Environment:**
Copy `server/.env.example` to `server/.env`:
```bash
cp server/.env.example server/.env
```
Update your credentials in `server/.env`:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/sweety
DATABASE_URL_TEST=postgresql://postgres:YOUR_PASSWORD@localhost:5432/sweety_test
JWT_SECRET=change_me
JWT_EXPIRES_IN=7d
```

**Client Environment:**
Copy `client/.env.example` to `client/.env`:
```bash
cp client/.env.example client/.env
```
Contents:
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Install Dependencies
```bash
# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
cd ..
```

---

## Database Setup

Make sure PostgreSQL is running.

### Step 1: Create the development and test databases
Run the following commands using `psql` (adjust `-U postgres` if using another PostgreSQL user):
```bash
psql -U postgres -c "CREATE DATABASE sweety;"
psql -U postgres -c "CREATE DATABASE sweety_test;"
```

### Step 2: Initialize schema tables
Apply the schema tables, safety net constraints, and indexes to the development database:
```bash
# In the server directory:
cd server
npm run db:setup
```

*(Note for the test database: The Jest test suite automatically checks and initializes the schema in `sweety_test` upon running `npm test`, so no manual schema command is needed for tests).*

---

## Seeding Demo Data

To populate the database with a ready-to-test user and realistic glucose readings across the current and previous month:

```bash
cd server
npm run seed
```

### Demo Login Credentials
- **Email:** `demo@sweety.com`
- **Password:** `Demo@123`

---

## Running the Application

Open two terminal windows (or PowerShell tabs):

**Terminal 1: Start Backend Server**
```bash
cd server
npm run dev
# Server starts on http://localhost:5000
```

**Terminal 2: Start Frontend Client**
```bash
cd client
npm run dev
# Frontend starts on http://localhost:5173
```

Visit **`http://localhost:5173`** in your browser.

---

## Running Backend Tests

The test suite runs against the test database (`sweety_test`) using Jest and Supertest. It automatically verifies that the tables exist in `sweety_test` before executing:

```bash
cd server
npm test
```

Test coverage includes:
- Pure date calculations (`dateRanges`): leap-year February, January &rarr; December rollback, daily, month-to-date.
- All 5 server validation rules via API (value required, 40-600 range, duplicate slot, 4 per day limit, future date).
- Authentication: bcrypt hash verification and cross-user data isolation.
- Reports calculations: highest, lowest, rounded 1-decimal average, count, and empty states.

---

## API Endpoints Reference

### Authentication (`/api/auth`)
- `POST /api/auth/register` - Create account `{ name, email, password }`
- `POST /api/auth/login` - Authenticate `{ email, password }`
- `GET /api/auth/me` - Get current authenticated user profile (Protected)

### Readings (`/api/readings`) *(All Protected)*
- `POST /api/readings` - Create reading `{ date, slot, value }`
- `GET /api/readings` - Get user's readings (supports `?date=YYYY-MM-DD` and optional `?page=1&limit=20`)
- `GET /api/readings/:id` - Get single reading
- `PUT /api/readings/:id` - Update reading `{ date, slot, value }`
- `DELETE /api/readings/:id` - Delete reading

### Reports (`/api/reports`) *(All Protected)*
- `GET /api/reports/daily?date=YYYY-MM-DD` - Daily statistics and readings breakdown
- `GET /api/reports/month-to-date?date=YYYY-MM-DD` - 1st of month to selected date
- `GET /api/reports/monthly?date=YYYY-MM-DD` - Whole previous calendar month

---

## Notes & Design Decisions

### Assumptions:
1. **Timezone-Neutral Dates:** Dates are strictly handled as `"YYYY-MM-DD"` strings across both database, API, and UI. PostgreSQL's DATE parser is explicitly overridden (`pg.types.setTypeParser(1082, v => v)`) to prevent automatic UTC / local time conversions that could shift days.
2. **Future Date Evaluation:** "Future" is judged against the server's local calendar date formatted as `"YYYY-MM-DD"`.
3. **Validation Rule Precedence:** On creating a reading, the 4-per-day limit is evaluated first; if within limit, the duplicate-slot check is evaluated second. On edit, the reading being updated is excluded from both checks.
4. **Realistic Seed Data:** Seed readings mimic clinical blood glucose patterns (fasting 85-105 mg/dl, post-prandial 120-160 mg/dl) spread across both months to showcase all 3 report cards immediately.
5. **Implementation Details:**
   - Used bcryptjs (pure JavaScript, same algorithm as bcrypt) to avoid native build issues on Windows.
   - Pagination is available on `GET /api/readings` (via `?page=1&limit=20`) but is not used in the UI.

### What I Would Improve With More Time:
- **Visual Data Charts:** Interactive line charts (e.g. using lightweight SVG or Chart.js) to display glucose trends over the month.
- **Exporting Options:** PDF or CSV export functionality for patients to share readings with their endocrinologist.
- **Hypo/Hyperglycemia Threshold Alerts:** Custom warning banners when readings fall outside patient-defined target ranges (< 70 mg/dl or > 180 mg/dl).
- **Password Reset Flow:** Email verification and time-limited reset tokens.

---

## Acknowledgments
AI tools were used to help scaffold this project; I reviewed, ran and tested the code myself.
