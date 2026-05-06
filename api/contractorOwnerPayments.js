// Called when a contractor (in multi-owner mode) taps on a specific owner card.
// Input:  { contractorId: UUID }
// Output: { contractorName, workType, agreedAmount, total, payments[] }

import { getSupabase, json, err, sortExpensesDesc } from './_lib.js';

export default async function handler(req, res) {
  try {
    const contractorId = String(req.body?.contractorId || '').trim();
    if (!contractorId) return err(res, 'contractorId is required.');

    const sb = getSupabase();

    // Look up the contractor record (service role bypasses RLS — intentional here)
    const { data: contractor, error: cErr } = await sb
      .from('hc_contractors')
      .select('*')
      .eq('id', contractorId)
      .maybeSingle();

    if (cErr) throw cErr;
    if (!contractor) return err(res, 'Contractor not found.', 404);

    // Fetch all payments this owner recorded for this contractor
    const { data: payments, error: expErr } = await sb
      .from('hc_expenses')
      .select('*')
      .eq('user_id', contractor.user_id)
      .ilike('paid_to', contractor.name);

    if (expErr) throw expErr;

    const rows   = (payments || []).map(mapExpense);
    const sorted = sortExpensesDesc(rows);
    const total  = rows.reduce((s, r) => s + r.Amount, 0);

    return json(res, {
      contractorName: contractor.name,
      workType:       contractor.work_type || '',
      agreedAmount:   Number(contractor.agreed_amount || 0),
      total,
      payments: sorted
    });

  } catch (e) {
    return err(res, e.message);
  }
}

function mapExpense(r) {
  return {
    ID:           r.id,
    Date:         r.expense_at || '',
    Category:     r.category || '',
    Description:  r.description || '',
    Amount:       Number(r.amount || 0),
    PaymentMode:  r.payment_mode || '',
    PaidTo:       r.paid_to || '',
    ScreenshotUrl:r.screenshot_url || '',
    CreatedAt:    r.created_at || '',
    PaidBy:       r.paid_by || '',
    EntryKind:    r.entry_kind || 'DirectExpense',
    AdvanceParty: r.advance_party || ''
  };
}
