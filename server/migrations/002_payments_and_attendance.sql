-- Apply this migration to existing installations after 001_initial.sql.
ALTER TABLE payment_logs ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(10) DEFAULT 'cash';
ALTER TABLE payment_logs DROP CONSTRAINT IF EXISTS payment_logs_payment_mode_check;
ALTER TABLE payment_logs ADD CONSTRAINT payment_logs_payment_mode_check CHECK (payment_mode IN ('cash', 'upi'));
