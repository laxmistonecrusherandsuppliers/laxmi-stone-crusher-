# Lakshmi Stone Crusher & Suppliers — Business Management App

A full-stack business management system for stone crushing material sales.

## Features (Phase 1)
- 🔐 Multi-device login with JWT auth (Admin & Staff roles)
- 👥 Customer management with full sales history & payment ledger
- 🧾 New Sale flow — multi-item bills, GST ON/OFF, partial payments
- 💰 Due tracking with running ledger per customer
- 📄 PDF generation — plain bills & GST tax invoices
- 🖨️ Print support — A4 and thermal (58mm/80mm)
- 📊 Reports — Daily, Customer-wise, Material-wise, Due report (PDF export)
- ⚙️ Admin settings — business info, GST%, saved material rates

## Tech Stack
- **Frontend**: React 18 + Vite, React Router v6, TanStack Query v5
- **Backend**: Node.js + Express.js REST API
- **Database**: PostgreSQL 15 (centralized — multi-device sync)
- **Auth**: JWT tokens with bcrypt passwords
- **PDF**: PDFKit (server-side generation)

---

## Quick Start (Development)

### Prerequisites
- Node.js 18+
- PostgreSQL 15 (or Docker for one-command setup)

### Option A — With Docker (Recommended)

```bash
# 1. Clone/download the project
cd "Laxmi Stone Crusher and Suplliers"

# 2. Start everything with Docker
docker-compose up -d

# 3. Open in browser
# Frontend: http://localhost:80
# Backend API: http://localhost:5000/api
```

### Option B — Manual Setup

**1. Start PostgreSQL and create database:**
```bash
psql -U postgres -c "CREATE USER lsc_user WITH PASSWORD 'lsc_pass';"
psql -U postgres -c "CREATE DATABASE lsc_db OWNER lsc_user;"
psql -U lsc_user -d lsc_db -f server/migrations/001_initial.sql
```

**2. Setup Backend:**
```bash
cd server
cp .env.example .env
# Edit .env with your database credentials
npm install
node scripts/seed.js    # Creates default admin user
npm run dev             # Starts on http://localhost:5000
```

**3. Setup Frontend:**
```bash
cd client
npm install
npm run dev             # Starts on http://localhost:5173
```

**4. Open browser:** http://localhost:5173

---

## Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Staff | `staff1` | `staff123` |

> ⚠️ **Change these passwords immediately after first login!**

---

## Project Structure

```
/
├── server/                 # Node.js/Express backend
│   ├── src/
│   │   ├── config/         # DB connection
│   │   ├── controllers/    # Route handlers
│   │   ├── middleware/     # Auth, error handling
│   │   ├── routes/         # API routes
│   │   └── services/       # PDF generation
│   ├── migrations/         # SQL schema files
│   ├── scripts/            # Seed scripts
│   └── package.json
│
├── client/                 # React frontend
│   ├── src/
│   │   ├── api/            # Axios API functions
│   │   ├── components/     # Shared UI components
│   │   ├── context/        # Auth context
│   │   ├── pages/          # App pages
│   │   └── utils/          # Helpers (currency format, dates)
│   └── package.json
│
├── docker-compose.yml
└── README.md
```

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET | `/api/customers` | List customers |
| POST | `/api/customers` | Create customer |
| GET | `/api/customers/:id/ledger` | Payment ledger |
| GET | `/api/materials` | List materials |
| POST | `/api/sales` | Create sale |
| GET | `/api/sales/:id/pdf` | Download bill PDF |
| POST | `/api/sales/:id/payments` | Record payment |
| GET | `/api/reports/daily` | Daily sales report |
| GET | `/api/reports/due` | Outstanding dues |
| GET | `/api/settings` | App settings |

---

## GST Invoice

When GST is enabled on a sale:
- CGST = GST% / 2
- SGST = GST% / 2
- Grand Total = Subtotal + CGST + SGST

GST percentage is configurable in Settings (default 18%).

## Thermal Printing

When printing, select paper size in your browser's print dialog:
- **A4**: Standard invoice/bill
- **80mm thermal**: Narrow receipt format
- **58mm thermal**: Smallest thermal format

The bill layout auto-adjusts via CSS `@media print` rules.

---

## Phase 2 (Coming Soon)
- Staff management (profiles, salary)
- Daily attendance tracking (Present/Absent/Half-day/Leave)
- Advance salary tracking
- Leave request management
- Granular staff permissions
- Data backup & export

---

## Support

Business: Lakshmi Stone Crusher & Suppliers
