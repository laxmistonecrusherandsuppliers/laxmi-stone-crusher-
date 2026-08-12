# Lakshmi Stone Crusher & Suppliers — Static Web Application

A zero-server, high-performance static business management system for stone crushing material sales, powered directly by **Supabase**.

## Architecture & Hosting

- **Frontend**: HTML5, CSS3, Vanilla JavaScript, Tailwind CSS
- **Backend / Database**: Supabase PostgreSQL Database (Direct Browser Access)
- **Auth**: Client-side authentication with bcrypt password verification against Supabase `users` table
- **PDF Generation**: Client-side `jsPDF` / `jspdf-autotable`
- **Printing**: Native browser printing (`window.print()`) supporting A4 and Thermal paper sizes (58mm & 80mm)
- **Runtime Requirement**: **NONE**. Requires no Node.js, Next.js, Express, or Vercel server functions.

---

## Static Production Files Directory (`dist/`)

Upload the contents of the `dist/` directory to any static file hosting service (cPanel, Netlify, Vercel Static, GitHub Pages, Cloudflare Pages, Nginx, or Apache).

```text
dist/
├── index.html            # Executive Dashboard
├── login.html            # Sign-in portal
├── sales.html            # Sales & Invoices Directory
├── sale-new.html         # New Sale Invoice Creation Wizard
├── sale-details.html     # Bill View, Thermal/A4 Printing, PDF Export & Payments
├── customers.html        # Customer Directory & Management
├── customer-details.html # Customer Running Ledger & Payment History
├── attendance.html       # Staff Directory, Attendance, Advances & Leaves
├── reports.html          # Business Reports (Daily, Customer, Material, Dues)
├── settings.html         # Business Information, GST% & Material Rates
└── assets/
    ├── css/
    │   └── style.css     # Design System & Styling
    └── js/
        ├── config.js          # Supabase Configuration
        ├── supabase-client.js # Supabase JS Library Initializer
        ├── auth.js            # Authentication Service
        ├── db-service.js      # Data Access Layer
        ├── pdf-generator.js   # Client-side PDF Export
        ├── layout.js          # Shared Sidebar & Header Injector
        └── utils.js           # Currency & Date Formatters
```

---

## Quick Setup & Deployment

### 1. Database Setup (Supabase)
1. Open your project on [Supabase Dashboard](https://app.supabase.com).
2. Navigate to **SQL Editor**.
3. Paste and run the script from [`supabase/schema.sql`](file:///Users/sushant/Documents/Laxmi%20Stone%20Crusher%20and%20Suplliers%20/supabase/schema.sql).

### 2. Configure Supabase Credentials
Open `dist/assets/js/config.js` and set your Supabase Project URL and Anon/Publishable API Key:

```javascript
window.LSC_CONFIG = {
  SUPABASE_URL: "https://your-project.supabase.co",
  SUPABASE_ANON_KEY: "your-supabase-anon-key"
};
```

### 3. Deploy
Simply upload the `dist/` folder to your web server or hosting service.

---

## Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | `admin` | `admin123` |
| Staff | `staff1` | `staff123` |

---

## Key Features

1. **Customers**: Add/edit customers, search by name/mobile, track customer-wise sales & payment history, view net due balance.
2. **Sales & Materials**: Multi-item bills supporting 80-100mm, 40mm, 20mm, 10mm, 6mm, 1/8, Crush Sand, Wash Sand, and Custom materials with editable rates.
3. **GST & Plain Invoices**: Configurable GST ON/OFF toggle (CGST 9% + SGST 9%).
4. **Payment Ledgers**: Support full, partial, or due payments with full log retention without overwriting past payment records.
5. **Staff Management**: Daily attendance tracking (Present, Absent, Half-day, Leave), salary advances, and leave requests.
6. **Reports**: Daily sales, customer-wise sales, material-wise sales, and outstanding dues report with PDF export & print.
