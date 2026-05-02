-- Phase 2 Supabase Schema for House Construction Tracker V2

-- Create Contractors Table
CREATE TABLE public.hc_contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  name TEXT NOT NULL,
  phone TEXT,
  work_type TEXT,
  agreed_amount NUMERIC DEFAULT 0
);

-- Create Expenses Table
CREATE TABLE public.hc_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  expense_at TEXT,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_mode TEXT NOT NULL,
  paid_to TEXT NOT NULL,
  paid_by TEXT NOT NULL,
  screenshot_url TEXT,
  entry_kind TEXT DEFAULT 'DirectExpense',
  advance_party TEXT
);

-- Create Settings Table
CREATE TABLE public.hc_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL
);

-- Initial Data
INSERT INTO public.hc_settings (key, value) VALUES
  ('TOTAL_BUDGET', '1200000')
ON CONFLICT (key) DO NOTHING;

-- Note: In this architecture, the Vercel /api routes use the SUPABASE_SERVICE_ROLE_KEY 
-- to read/write data securely from the backend. Row Level Security (RLS) is not strictly 
-- required for these tables unless you plan to connect directly from the frontend.

-- Storage Bucket Setup (Manual Step)
-- 1. Go to Storage in Supabase Studio
-- 2. Create a new bucket named 'screenshots'
-- 3. Set the bucket to 'Public'
