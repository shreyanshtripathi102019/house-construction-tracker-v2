-- Phase 3 (SaaS Multi-Tenant) Supabase Schema for House Construction Tracker V2

-- Create Contractors Table
CREATE TABLE public.hc_contractors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  phone TEXT,
  pin TEXT,
  work_type TEXT,
  agreed_amount NUMERIC DEFAULT 0
);

-- Create Expenses Table
CREATE TABLE public.hc_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid(),
  expense_at TEXT,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  payment_mode TEXT NOT NULL,
  paid_to TEXT NOT NULL,
  paid_by TEXT NOT NULL,
  screenshot_url TEXT,
  entry_kind TEXT DEFAULT 'DirectExpense',
  advance_party TEXT,
  material_name TEXT,
  material_qty NUMERIC,
  material_unit TEXT,
  material_rate NUMERIC
);

-- Create Audit Logs Table
CREATE TABLE public.hc_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  old_data JSONB,
  new_data JSONB
);

-- Create Settings Table
CREATE TABLE public.hc_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id) NOT NULL DEFAULT auth.uid(),
  key TEXT NOT NULL,
  value TEXT NOT NULL,
  UNIQUE (user_id, key)
);

-- Enable Row Level Security
ALTER TABLE public.hc_contractors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hc_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies for Owners (Authenticated Users)
CREATE POLICY "Users can manage their own contractors"
  ON public.hc_contractors FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own expenses"
  ON public.hc_expenses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own settings"
  ON public.hc_settings FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own audit logs"
  ON public.hc_audit_logs FOR SELECT USING (auth.uid() = user_id);
  
-- Note: Audit logs shouldn't be insertable/updatable by the user directly, only by the DB trigger.
-- But the trigger runs with elevated privileges (SECURITY DEFINER) or as postgres.

-- Storage Policy (Allow authenticated users to upload and anyone to view)
-- Note: You still need to manually create the 'screenshots' bucket and make it public.
-- Example policy (can be applied via Supabase UI):
-- CREATE POLICY "Allow uploads" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'screenshots');

-- Trigger to auto-create default budget on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.hc_settings (user_id, key, value)
  VALUES (NEW.id, 'TOTAL_BUDGET', '1200000');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger for Audit Logging
CREATE OR REPLACE FUNCTION public.log_expense_audit()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.hc_audit_logs (user_id, action, table_name, record_id, old_data)
    VALUES (OLD.user_id, 'DELETE', 'hc_expenses', OLD.id, row_to_json(OLD)::jsonb);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Only log if something actually changed
    IF row_to_json(OLD)::jsonb != row_to_json(NEW)::jsonb THEN
      INSERT INTO public.hc_audit_logs (user_id, action, table_name, record_id, old_data, new_data)
      VALUES (NEW.user_id, 'UPDATE', 'hc_expenses', NEW.id, row_to_json(OLD)::jsonb, row_to_json(NEW)::jsonb);
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_expense_audit ON public.hc_expenses;
CREATE TRIGGER on_expense_audit
  AFTER UPDATE OR DELETE ON public.hc_expenses
  FOR EACH ROW EXECUTE PROCEDURE public.log_expense_audit();
