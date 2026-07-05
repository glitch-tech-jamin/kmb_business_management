// Secure serverless endpoint for creating purchase orders using Supabase service role key
// Expecting POST JSON: { product_id: '<uuid>', quantity: <number> }
// Require header: x-api-key: <PURCHASE_API_KEY> (set in Vercel env)

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const apiKey = req.headers['x-api-key'] || (req.headers['authorization'] || '').replace(/^Bearer\s+/i, '');
    if (!apiKey || apiKey !== process.env.PURCHASE_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { product_id, quantity } = req.body || {};
    if (!product_id || !quantity || Number(quantity) <= 0) {
      return res.status(400).json({ error: 'product_id and positive quantity are required' });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return res.status(500).json({ error: 'Supabase configuration missing on server' });
    }

    // Create purchase order using Supabase REST API with service role key
    const poPayload = {
      supplier_id: req.body.supplier_id || null,
      product_id,
      quantity: Number(quantity),
      status: 'requested',
      shipping_status: 'pending',
      total_cost: Number(req.body.total_cost || 0)
    };

    const poResp = await fetch(`${SUPABASE_URL}/rest/v1/purchase_orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
        Prefer: 'return=representation'
      },
      body: JSON.stringify(poPayload)
    });

    if (!poResp.ok) {
      console.error('Supabase purchase_orders insert failed:', await poResp.text());
      return res.status(502).json({ error: 'Failed to create purchase order' });
    }

    const created = await poResp.json();
    const po = Array.isArray(created) ? created[0] : created;

    // Optionally record an inventory movement referencing this PO
    const movementPayload = {
      product_id,
      movement_type: 'reorder',
      quantity: Number(quantity),
      source: 'reorder_request',
      destination: 'supplier',
      related_order_id: po.id,
      note: `Purchase order ${po.id} created via serverless function`
    };

    await fetch(`${SUPABASE_URL}/rest/v1/inventory_movements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
        Prefer: 'return=representation'
      },
      body: JSON.stringify(movementPayload)
    }).catch(() => {});

    return res.status(200).json({ ok: true, purchase_order: po });
  } catch (err) {
    console.error('create-purchase-order error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
