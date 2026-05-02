import { getSupabase, requireOwner, toNumber, json, err } from './_lib.js';

export default async function handler(req, res) {
  try {
    requireOwner(req);
    const amount = toNumber(req.body?.amount);
    const sb = getSupabase();
    const { data: existing } = await sb.from('settings').select('key').eq('key', 'TOTAL_BUDGET').maybeSingle();
    let error;
    if (existing) {
      ({ error } = await sb.from('settings').update({ value: String(amount) }).eq('key', 'TOTAL_BUDGET'));
    } else {
      ({ error } = await sb.from('settings').insert({ key: 'TOTAL_BUDGET', value: String(amount) }));
    }
    if (error) throw error;
    return json(res, { success: true });
  } catch (e) {
    return err(res, e.message);
  }
}
