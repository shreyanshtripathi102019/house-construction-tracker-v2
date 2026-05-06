import { getSupabase, json, err, sortExpensesDesc } from './_lib.js';

export default async function handler(req, res) {
  try {
    const phone = String(req.body?.phone || '').trim();
    const pin   = String(req.body?.pin   || '').trim();

    if (!phone) return err(res, 'Phone number is required.');

    const sb = getSupabase();

    if (pin) {
      // ── Single-owner mode: phone + PIN → direct payment view ─────────────
      const { data: contractor, error: cErr } = await sb
        .from('hc_contractors')
        .select('*')
        .eq('phone', phone)
        .eq('pin', pin)
        .maybeSingle();

      if (cErr) throw cErr;
      if (!contractor) return err(res, 'Invalid phone number or PIN.', 401);

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
        mode: 'single',
        contractorName: contractor.name,
        workType: contractor.work_type || '',
        agreedAmount: Number(contractor.agreed_amount || 0),
        total,
        payments: sorted
      });

    } else {
      // ── Multi-owner mode: phone only → list of all owners ─────────────────
      const { data: contractors, error: cErr } = await sb
        .from('hc_contractors')
        .select('*')
        .eq('phone', phone);

      if (cErr) throw cErr;
      if (!contractors || contractors.length === 0) {
        return err(res, 'No contractor profile found for this phone number.', 404);
      }

      // Fetch owner emails to display as masked labels
      const { data: { users }, error: usersErr } = await sb.auth.admin.listUsers();
      if (usersErr) throw usersErr;

      const userMap = Object.fromEntries(users.map(u => [u.id, u.email]));

      const owners = contractors.map(c => ({
        contractorId:   c.id,
        contractorName: c.name,
        workType:       c.work_type || '',
        agreedAmount:   Number(c.agreed_amount || 0),
        ownerLabel:     maskEmail(userMap[c.user_id] || '')
      }));

      return json(res, {
        mode: 'multi',
        contractorName: contractors[0].name,
        owners
      });
    }

  } catch (e) {
    return err(res, e.message);
  }
}

function maskEmail(email) {
  if (!email) return 'Owner';
  const [local, domain] = email.split('@');
  if (!domain) return email;
  return `${local.slice(0, 2)}****@${domain}`;
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
