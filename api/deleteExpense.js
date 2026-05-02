import { getSupabase, requireOwner, json, err } from './_lib.js';

export default async function handler(req, res) {
  try {
    requireOwner(req);
    const expenseId = String((req.body?.expenseId) || '').trim();
    if (!expenseId) return err(res, 'expenseId is required.');
    const sb = getSupabase();
    const { error } = await sb.from('expenses').delete().eq('id', expenseId);
    if (error) throw error;
    return json(res, { success: true });
  } catch (e) {
    return err(res, e.message);
  }
}
