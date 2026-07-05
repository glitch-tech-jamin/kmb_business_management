const {
  getSupabaseConfig,
  buildPurchaseOrderPayload,
  insertPurchaseOrder,
  validatePurchaseOrderInput,
} = require('../../src/lib/purchaseOrderHelpers');

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { admin_password, product_id, quantity, supplier_id, total_cost } = req.body || {};
    if (!admin_password) return res.status(401).json({ error: 'Password required' });
    if (admin_password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const validationError = validatePurchaseOrderInput(product_id, quantity);
    if (validationError) return res.status(400).json({ error: validationError });

    const { url: SUPABASE_URL, serviceRoleKey: SERVICE_ROLE } = getSupabaseConfig();
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return res.status(500).json({ error: 'Supabase configuration missing on server' });
    }

    const payload = buildPurchaseOrderPayload({ product_id, quantity, supplier_id, total_cost });
    const { order, error } = await insertPurchaseOrder(SUPABASE_URL, SERVICE_ROLE, payload);
    if (error) return res.status(502).json({ error: 'Failed to create purchase order', detail: error });

    return res.status(200).json({ ok: true, purchase_order: order });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal_error', detail: String(err) });
  }
}
