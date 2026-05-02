import { getSupabase, json, err, sortExpensesDesc } from './_lib.js';

export default async function handler(req, res) {
  try {
    const ownerEmail = String(req.body?.ownerEmail || '').trim().toLowerCase();
    const phone = String(req.body?.phone || '').trim();
    const pin = String(req.body?.pin || '').trim();

    if (!ownerEmail || !phone || !pin) return err(res, 'Owner Email, Phone and PIN are required.');

    const sb = getSupabase(); // initialized with SUPABASE_SERVICE_ROLE_KEY

    // Find Owner ID by email
    const { data: { users }, error: usersError } = await sb.auth.admin.listUsers();
    if (usersError) throw usersError;
    
    const owner = users.find(u => u.email === ownerEmail);
    if (!owner) return err(res, 'Owner not found.', 404);
    const ownerId = owner.id;
    
    // Verify contractor belongs to this owner
    const { data: contractor, error: authError } = await sb
      .from('hc_contractors')
      .select('name')
      .eq('user_id', ownerId)
      .eq('phone', phone)
      .eq('pin', pin)
      .maybeSingle();
      
    if (authError) throw authError;
    if (!contractor) return err(res, 'Invalid phone number or PIN for this owner.', 401);

    // Fetch payments for this contractor under this owner
    const { data: payments, error: expError } = await sb
      .from('hc_expenses')
      .select('*')
      .eq('user_id', ownerId)
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
