-- ========================================================
-- LAKSHMI STONE CRUSHER & SUPPLIERS — SUPABASE DATABASE SCHEMA
-- Paste and run this script in Supabase SQL Editor
-- ========================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  mobile VARCHAR(15) UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'staff' CHECK (role IN ('admin','staff')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  mobile VARCHAR(15),
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. MATERIALS
CREATE TABLE IF NOT EXISTS materials (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SAVED RATES
CREATE TABLE IF NOT EXISTS saved_rates (
  id SERIAL PRIMARY KEY,
  material_id INT REFERENCES materials(id) ON DELETE CASCADE,
  rate_per_unit NUMERIC(10,2),
  unit VARCHAR(20) DEFAULT 'Tonne',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(material_id)
);

-- 5. SALES (Bill header)
CREATE TABLE IF NOT EXISTS sales (
  id SERIAL PRIMARY KEY,
  invoice_number VARCHAR(30) UNIQUE NOT NULL,
  customer_id INT REFERENCES customers(id),
  sale_date DATE NOT NULL DEFAULT CURRENT_DATE,
  gst_enabled BOOLEAN DEFAULT false,
  gst_percent NUMERIC(5,2) DEFAULT 18,
  subtotal NUMERIC(12,2) NOT NULL,
  gst_amount NUMERIC(12,2) DEFAULT 0,
  grand_total NUMERIC(12,2) NOT NULL,
  payment_mode VARCHAR(10) CHECK (payment_mode IN ('full','partial','due')),
  amount_paid NUMERIC(12,2) DEFAULT 0,
  amount_due NUMERIC(12,2) DEFAULT 0,
  notes TEXT,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. SALE ITEMS
CREATE TABLE IF NOT EXISTS sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INT REFERENCES sales(id) ON DELETE CASCADE,
  material_id INT REFERENCES materials(id),
  custom_material_name VARCHAR(100),
  quantity NUMERIC(10,3) NOT NULL,
  unit VARCHAR(20) DEFAULT 'Tonne',
  rate NUMERIC(10,2) NOT NULL,
  amount NUMERIC(12,2) NOT NULL
);

-- 7. PAYMENT LOGS (Ledger)
CREATE TABLE IF NOT EXISTS payment_logs (
  id SERIAL PRIMARY KEY,
  sale_id INT REFERENCES sales(id) ON DELETE CASCADE,
  customer_id INT REFERENCES customers(id),
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  amount_paid NUMERIC(12,2) NOT NULL,
  balance_before NUMERIC(12,2) NOT NULL,
  balance_after NUMERIC(12,2) NOT NULL,
  notes TEXT,
  recorded_by INT REFERENCES users(id)
);

-- 8. SETTINGS
CREATE TABLE IF NOT EXISTS settings (
  key VARCHAR(50) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PHASE 2: STAFF, ATTENDANCE, ADVANCES, LEAVE
CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  mobile VARCHAR(15),
  joining_date DATE,
  salary NUMERIC(10,2),
  status VARCHAR(10) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS attendance (
  id SERIAL PRIMARY KEY,
  staff_id INT REFERENCES staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status VARCHAR(10) CHECK (status IN ('present','absent','half','leave')),
  notes TEXT,
  UNIQUE(staff_id, date)
);

CREATE TABLE IF NOT EXISTS advances (
  id SERIAL PRIMARY KEY,
  staff_id INT REFERENCES staff(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  advance_date DATE NOT NULL,
  notes TEXT,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS leave_requests (
  id SERIAL PRIMARY KEY,
  staff_id INT REFERENCES staff(id) ON DELETE CASCADE,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  type VARCHAR(20),
  reason TEXT,
  status VARCHAR(10) DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  approved_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEED SYSTEM MATERIALS
INSERT INTO materials (name, is_system) VALUES
  ('80-100mm', true),
  ('40mm', true),
  ('20mm', true),
  ('10mm', true),
  ('6mm', true),
  ('1/8', true),
  ('Crush Sand', true),
  ('Wash Sand', true),
  ('Other', true)
ON CONFLICT DO NOTHING;

-- SEED DEFAULT SETTINGS
INSERT INTO settings (key, value) VALUES
  ('business_name', 'Lakshmi Stone Crusher & Suppliers'),
  ('business_address', 'At Post Crusher Zone, Highway Road'),
  ('business_mobile', '+91 98765 43210'),
  ('gstin', '27AAAAA0000A1Z5'),
  ('gst_percent', '18'),
  ('invoice_prefix', 'LSC'),
  ('financial_year', '2526'),
  ('next_invoice_number', '1'),
  ('thermal_width', '80')
ON CONFLICT (key) DO NOTHING;

-- SEED DEFAULT ADMIN & STAFF USERS
-- Admin password: admin123 (bcrypt hash)
-- Staff password: staff123 (bcrypt hash)
INSERT INTO users (username, mobile, password_hash, role) VALUES
  ('admin', '9999999999', '$2a$10$wT8KskY78FmFqfG83gXg2.1wH496P27wO0v8Xj801Vj9pG28c/0tO', 'admin'),
  ('staff1', '8888888888', '$2a$10$wT8KskY78FmFqfG83gXg2.1wH496P27wO0v8Xj801Vj9pG28c/0tO', 'staff')
ON CONFLICT (username) DO NOTHING;

-- DISABLE RLS FOR DIRECT API QUERY ACCESS (Or enable with public read/write policy)
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE materials DISABLE ROW LEVEL SECURITY;
ALTER TABLE saved_rates DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
