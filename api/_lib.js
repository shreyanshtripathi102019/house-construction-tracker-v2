// api/_lib.js  –  shared Supabase client + helpers (parallel track only)
import { createClient } from '@supabase/supabase-js';

export function getSupabase() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set');
  return createClient(url, key);
}

export function requireOwner(req) {
  const secret = req.body?.secret || req.query?.secret;
  const password = process.env.OWNER_PASSWORD;
  if (!password) throw new Error('OWNER_PASSWORD not configured');
  if (!secret || secret !== password) throw new Error('Incorrect owner password.');
}

export function toNumber(v) {
  const n = Number(v || 0);
  return isNaN(n) ? 0 : n;
}

export function sortExpensesDesc(rows) {
  return rows.slice().sort((a, b) => {
    const ta = getExpenseSortTs(a);
    const tb = getExpenseSortTs(b);
    return tb - ta;
  });
}

function getExpenseSortTs(row) {
  const raw = String(row.expense_at || '').trim();
  if (raw) {
    const d = new Date(raw);
    if (!isNaN(d)) return d.getTime();
  }
  const ca = String(row.created_at || '').trim();
  if (ca) {
    const d2 = new Date(ca);
    if (!isNaN(d2)) return d2.getTime();
  }
  return 0;
}

export function json(res, data, status = 200) {
  return res.status(status).json(data);
}

export function err(res, message, status = 400) {
  return res.status(status).json({ error: message });
}
