import { getSupabase, json, err } from './_lib.js';

export default async function handler(req, res) {
  try {
    const sb = getSupabase();
    const { data, error } = await sb
      .from('contractors')
      .select('id, name, phone, work_type, agreed_amount')
      .order('name');
    if (error) throw error;
    const contractors = (data || []).map(r => ({
      Name: r.name,
      Phone: r.phone || '',
      WorkType: r.work_type || '',
      AgreedAmount: Number(r.agreed_amount || 0)
    }));
    return json(res, { contractors });
  } catch (e) {
    return err(res, e.message);
  }
}
