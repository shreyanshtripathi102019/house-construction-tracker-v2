-- Migration: multi-screenshot + vendor bill support
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New query)

ALTER TABLE public.hc_expenses
  ADD COLUMN IF NOT EXISTS screenshot_url_2 TEXT,
  ADD COLUMN IF NOT EXISTS screenshot_url_3 TEXT,
  ADD COLUMN IF NOT EXISTS bill_url         TEXT;

-- Update schema.sql comment (informational only)
COMMENT ON COLUMN public.hc_expenses.screenshot_url   IS 'Payment screenshot 1';
COMMENT ON COLUMN public.hc_expenses.screenshot_url_2 IS 'Payment screenshot 2 (split payment)';
COMMENT ON COLUMN public.hc_expenses.screenshot_url_3 IS 'Payment screenshot 3 (split payment)';
COMMENT ON COLUMN public.hc_expenses.bill_url         IS 'Vendor bill / invoice image';
