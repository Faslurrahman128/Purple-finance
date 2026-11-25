# Personal Expense Tracker — ICT2308

Full-stack individual mini project starter using:
- Frontend: React + Vite
- Backend: Node.js + Express
- Database: PostgreSQL

## Folder structure
Frontend/
Backend/
Database/

## Run
1. Start PostgreSQL.
2. Create the database and import `Database/schema-postgresql.sql`.
3. In Backend, copy `.env.example` to `.env` and adjust credentials if needed.
4. In Backend: `npm install` then `npm run dev`
5. In Frontend: `npm install` then `npm run dev`

If the API reports `Database login failed`, update `DB_USER` and
`DB_PASSWORD` in `Backend/.env` to match PostgreSQL on port 5432.
The project deliberately prefers this local `.env` file over
machine-wide `DB_*` environment variables.

Frontend talks to Backend only through REST API. The browser never connects directly to PostgreSQL.

## Budget notifications

- Device alerts can be enabled from **Settings → Notification delivery**.
- Email alerts use the email stored for the user in the `users` table.
- Configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and
  `SMTP_FROM` in `Backend/.env` to enable email delivery.
- A warning is sent once at 90% spent (10% remaining), and a critical alert
  is sent once at 100% spent. The notification log prevents duplicates.

## CRUD
Actual CRUD API endpoints are included for:
- accounts
- categories
- transactions
- budgets
- payment-methods
- users

Transactions support create/read/update/delete from the UI.
