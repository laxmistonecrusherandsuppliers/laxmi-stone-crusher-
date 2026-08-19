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
-- Admin password: AdminSecure@2026 (bcrypt hash)
-- Staff password: StaffSecure@2026 (bcrypt hash)
INSERT INTO users (username, mobile, password_hash, role) VALUES
  ('admin_master', '9999999999', '$2b$10$d2ho6oVBIoNgLhVE7.UPIuhEHfGeYQno0WNVpYN2JII8qD/Qa1xZ.', 'admin'),
  ('staff_user', '8888888888', '$2b$10$2QwVmPmeBF.In2bngdowAu3G1/Y2vf1pFw7h3BxWcxAXnvnvc0nJK', 'staff')
ON CONFLICT (username) DO NOTHING;

-- ========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR SUPABASE FRONTEND ACCESS
-- ========================================================

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow anon and authenticated roles full read and write access for operational tables
CREATE POLICY "Allow public read/write access to customers" ON customers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access to sales" ON sales FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access to sale_items" ON sale_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access to payment_logs" ON payment_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access to materials" ON materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access to saved_rates" ON saved_rates FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access to settings" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access to staff" ON staff FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access to attendance" ON attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access to advances" ON advances FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write access to leave_requests" ON leave_requests FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public select access to users" ON users FOR SELECT USING (true);

