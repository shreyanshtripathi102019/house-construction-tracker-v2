import { getSupabase, requireOwner, toNumber, json, err } from './_lib.js';

export default async function handler(req, res) {
  try {
    requireOwner(req);
    const b = req.body || {};
    const name = String(b.name || '').trim();
    if (!name) return err(res, 'Contractor name is required.');
    const phone = String(b.phone || '').trim();
    const pin = String(b.pin || '').trim();
    const workType = String(b.workType || '').trim();
    const agreedAmount = toNumber(b.agreedAmount);
    const sb = getSupabase();
    // upsert by name (case-insensitive match)
    const { data: existing } = await sb.from('hc_contractors').select('id').ilike('name', name).maybeSingle();
    let error;
    if (existing) {
      ({ error } = await sb.from('hc_contractors').update({ phone, pin, work_type: workType, agreed_amount: agreedAmount }).eq('id', existing.id));
    } else {
      ({ error } = await sb.from('hc_contractors').insert({ name, phone, pin, work_type: workType, agreed_amount: agreedAmount }));
    }
    if (error) throw error;
    return json(res, { success: true });
  } catch (e) {
    return err(res, e.message);
  }
}
