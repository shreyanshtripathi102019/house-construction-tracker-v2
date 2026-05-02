import { getSupabase, requireOwner, toNumber, json, err } from './_lib.js';
import { v4 as uuidv4 } from 'uuid';

export default async function handler(req, res) {
  try {
    requireOwner(req);
    const b = req.body || {};
    const date = String(b.date || '').trim();
    const time = String(b.time || '').trim();
    const category = String(b.category || '').trim();
    const description = String(b.description || '').trim();
    const amount = toNumber(b.amount);
    const paymentMode = String(b.paymentMode || '').trim();
    const entryKind = String(b.entryKind || 'DirectExpense').trim();
    const advanceParty = String(b.advanceParty || '').trim();
    const paidBy = resolvePaidBy(String(b.paidBy || '').trim(), entryKind, advanceParty);
    const paidTo = (entryKind === 'AdvanceGiven' && advanceParty) ? advanceParty : String(b.paidTo || '').trim();
    const screenshotUrl = String(b.screenshotUrl || '').trim();
    if (!date || !category || !description || !amount || !paymentMode || !paidTo || !paidBy) {
      return err(res, 'date, category, description, amount, paymentMode, paidTo, and paidBy are required.');
    }
    const VALID_KINDS = ['DirectExpense', 'AdvanceGiven', 'AdvanceSettlement'];
    if (!VALID_KINDS.includes(entryKind)) return err(res, 'Invalid entry type.');
    const expenseAt = time ? `${date}T${time}` : date;
    const sb = getSupabase();
    const { error } = await sb.from('hc_expenses').insert({
      id: uuidv4(),
      expense_at: expenseAt,
      category, description, amount, payment_mode: paymentMode,
      paid_to: paidTo, screenshot_url: screenshotUrl,
      paid_by: paidBy, entry_kind: entryKind, advance_party: advanceParty
    });
    if (error) throw error;
    return json(res, { success: true });
  } catch (e) {
    return err(res, e.message);
  }
}

function resolvePaidBy(paidBy, entryKind, advanceParty) {
  if (entryKind === 'AdvanceSettlement') return String(advanceParty || 'Lalu').trim();
  return paidBy;
}
