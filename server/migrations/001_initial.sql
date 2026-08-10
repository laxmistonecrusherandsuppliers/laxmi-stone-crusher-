-- users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  mobile VARCHAR(15) UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'staff' CHECK (role IN ('admin','staff')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- customers
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  mobile VARCHAR(15),
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- materials (system + custom)
CREATE TABLE materials (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  is_system BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- saved_rates (admin-managed default rates per material)
CREATE TABLE saved_rates (
  id SERIAL PRIMARY KEY,
  material_id INT REFERENCES materials(id) ON DELETE CASCADE,
  rate_per_unit NUMERIC(10,2),
  unit VARCHAR(20) DEFAULT 'Tonne',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(material_id)
);

-- sales (bill header)
CREATE TABLE sales (
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

-- sale_items (line items — multiple materials per bill)
CREATE TABLE sale_items (
  id SERIAL PRIMARY KEY,
  sale_id INT REFERENCES sales(id) ON DELETE CASCADE,
  material_id INT REFERENCES materials(id),
  custom_material_name VARCHAR(100),
  quantity NUMERIC(10,3) NOT NULL,
  unit VARCHAR(20) DEFAULT 'Tonne',
  rate NUMERIC(10,2) NOT NULL,
  amount NUMERIC(12,2) NOT NULL
);

-- payment_logs (running ledger)
CREATE TABLE payment_logs (
  id SERIAL PRIMARY KEY,
  sale_id INT REFERENCES sales(id) ON DELETE CASCADE,
  customer_id INT REFERENCES customers(id),
  payment_date TIMESTAMPTZ DEFAULT NOW(),
  amount_paid NUMERIC(12,2) NOT NULL,
  payment_mode VARCHAR(10) DEFAULT 'cash' CHECK (payment_mode IN ('cash','upi')),
  balance_before NUMERIC(12,2) NOT NULL,
  balance_after NUMERIC(12,2) NOT NULL,
  notes TEXT,
  recorded_by INT REFERENCES users(id)
);

-- settings (key-value store)
CREATE TABLE settings (
  key VARCHAR(50) PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 2 tables (scaffolded)
CREATE TABLE staff (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  mobile VARCHAR(15),
  joining_date DATE,
  salary NUMERIC(10,2),
  status VARCHAR(10) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attendance (
  id SERIAL PRIMARY KEY,
  staff_id INT REFERENCES staff(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status VARCHAR(10) CHECK (status IN ('present','absent','half','leave')),
  notes TEXT,
  UNIQUE(staff_id, date)
);

CREATE TABLE advances (
  id SERIAL PRIMARY KEY,
  staff_id INT REFERENCES staff(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  advance_date DATE NOT NULL,
  notes TEXT,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE leave_requests (
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

-- System materials
INSERT INTO materials (name, is_system) VALUES
  ('80-100mm', true),
  ('40mm', true),
  ('20mm', true),
  ('10mm', true),
  ('6mm', true),
  ('1/8', true),
  ('Crush Sand', true),
  ('Wash Sand', true),
  ('Other', true);

-- Default settings
INSERT INTO settings (key, value) VALUES
  ('business_name', 'Lakshmi Stone Crusher & Suppliers'),
  ('business_address', 'Your Address Here'),
  ('business_mobile', ''),
  ('gstin', ''),
  ('gst_percent', '18'),
  ('invoice_prefix', 'LSC'),
  ('financial_year', '2526'),
  ('next_invoice_number', '1'),
  ('thermal_width', '80');
