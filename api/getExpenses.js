import { getSupabase, requireOwner, json, err, sortExpensesDesc } from './_lib.js';

export default async function handler(req, res) {
  try {
    requireOwner(req);
    const sb = getSupabase();
    const { data, error } = await sb.from('expenses').select('*');
    if (error) throw error;
    const expenses = sortExpensesDesc((data || []).map(mapExpense));
    return json(res, { expenses });
  } catch (e) {
    return err(res, e.message);
  }
}

function mapExpense(r) {
  return {
    ID: r.id, Date: r.expense_at || '', Category: r.category || '',
    Description: r.description || '', Amount: Number(r.amount || 0),
    PaymentMode: r.payment_mode || '', PaidTo: r.paid_to || '',
    ScreenshotUrl: r.screenshot_url || '', CreatedAt: r.created_at || '',
    PaidBy: r.paid_by || '', EntryKind: r.entry_kind || 'DirectExpense',
    AdvanceParty: r.advance_party || ''
  };
}
