import { getSupabase, json, err, sortExpensesDesc } from './_lib.js';

export default async function handler(req, res) {
  try {
    const contractorName = String((req.query.contractorName || req.body?.contractorName) || '').trim();
    if (!contractorName) return err(res, 'contractorName is required.');
    const sb = getSupabase();
    const { data, error } = await sb
      .from('expenses')
      .select('*')
      .ilike('paid_to', contractorName);
    if (error) throw error;
    const rows = (data || []).map(mapExpense);
    const sorted = sortExpensesDesc(rows);
    const total = rows.reduce((s, r) => s + Number(r.Amount || 0), 0);
    return json(res, { contractorName, total, payments: sorted });
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
