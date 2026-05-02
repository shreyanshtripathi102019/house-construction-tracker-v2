import { getSupabase, json, err, sortExpensesDesc } from './_lib.js';

export default async function handler(req, res) {
  try {
    const phone = String(req.body?.phone || '').trim();
    const pin = String(req.body?.pin || '').trim();

    if (!phone || !pin) return err(res, 'Phone and PIN are required.');

    const sb = getSupabase();
    
    // Verify contractor
    const { data: contractor, error: authError } = await sb
      .from('hc_contractors')
      .select('name')
      .eq('phone', phone)
      .eq('pin', pin)
      .maybeSingle();
      
    if (authError) throw authError;
    if (!contractor) return err(res, 'Invalid phone number or PIN.', 401);

    // Fetch payments
    const { data: payments, error: expError } = await sb
      .from('hc_expenses')
      .select('*')
      .ilike('paid_to', contractor.name);

    if (expError) throw expError;

    const rows = (payments || []).map(mapExpense);
    const sorted = sortExpensesDesc(rows);
    const total = rows.reduce((s, r) => s + Number(r.Amount || 0), 0);

    return json(res, { contractorName: contractor.name, total, payments: sorted });
  } catch (e) {
    return err(res, e.message);
  }
}

function mapExpense(r) {
  return {
    ID: r.id,
    Date: r.expense_at || '',
    Category: r.category || '',
    Description: r.description || '',
    Amount: Number(r.amount || 0),
    PaymentMode: r.payment_mode || '',
    PaidTo: r.paid_to || '',
    ScreenshotUrl: r.screenshot_url || '',
    CreatedAt: r.created_at || '',
    PaidBy: r.paid_by || '',
    EntryKind: r.entry_kind || 'DirectExpense',
    AdvanceParty: r.advance_party || ''
  };
}
