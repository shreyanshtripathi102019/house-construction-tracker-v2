import { getSupabase, requireOwner, json, err, sortExpensesDesc } from './_lib.js';

export default async function handler(req, res) {
  try {
    requireOwner(req);
    const sb = getSupabase();
    const [expRes, setRes] = await Promise.all([
      sb.from('hc_expenses').select('*'),
      sb.from('hc_settings').select('key,value')
    ]);
    if (expRes.error) throw expRes.error;
    if (setRes.error) throw setRes.error;
    const settingsMap = Object.fromEntries((setRes.data || []).map(r => [r.key, r.value]));
    const totalBudget = Number(settingsMap['TOTAL_BUDGET'] || 0);
    const expenses = expRes.data || [];
    const summary = { total: 0, Contractor: 0, Material: 0, Equipment: 0, Miscellaneous: 0 };
    let laluAdvanceBalance = 0;
    for (const r of expenses) {
      const ek = r.entry_kind || 'DirectExpense';
      const amt = Number(r.amount || 0);
      const adv = String(r.advance_party || r.paid_to || '').toLowerCase();
      if (ek === 'AdvanceGiven') {
        if (adv === 'lalu') laluAdvanceBalance += amt;
        continue;
      }
      if (ek === 'AdvanceSettlement' && adv === 'lalu') laluAdvanceBalance -= amt;
      summary.total += amt;
      const cat = r.category || 'Miscellaneous';
      summary[cat] = (summary[cat] || 0) + amt;
    }
    const mapped = expenses.map(mapExpense);
    const recent = sortExpensesDesc(mapped).slice(0, 5);
    return json(res, { totalBudget, summary, recentExpenses: recent, laluAdvanceBalance });
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
