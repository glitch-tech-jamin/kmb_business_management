const {
  getSupabaseConfig,
  buildPurchaseOrderPayload,
  insertPurchaseOrder,
  insertInventoryMovement,
  validatePurchaseOrderInput,
} = require('../../src/lib/purchaseOrderHelpers');

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const apiKey = req.headers['x-api-key'] || (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
    if (!apiKey || apiKey !== process.env.PURCHASE_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { product_id, quantity } = req.body || {};
    const validationError = validatePurchaseOrderInput(product_id, quantity);
    if (validationError) return res.status(400).json({ error: validationError });

    const { url: SUPABASE_URL, serviceRoleKey: SERVICE_ROLE } = getSupabaseConfig();
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return res.status(500).json({ error: 'Supabase configuration missing on server' });
    }

    const payload = buildPurchaseOrderPayload({
      product_id,
      quantity,
      supplier_id: req.body.supplier_id,
      total_cost: req.body.total_cost,
    });

    const { order: po, error } = await insertPurchaseOrder(SUPABASE_URL, SERVICE_ROLE, payload);
    if (error) return res.status(502).json({ error: 'Supabase insert failed', detail: error });

    await insertInventoryMovement(SUPABASE_URL, SERVICE_ROLE, {
      product_id,
      movement_type: 'reorder',
      quantity: Number(quantity),
      source: 'reorder_request',
      destination: 'supplier',
      related_order_id: po.id,
      note: `Purchase order ${po.id} created via serverless function`,
    });

    return res.status(200).json({ ok: true, purchase_order: po });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal_error', detail: String(err) });
  }
}
