// Admin-only serverless endpoint for creating purchase orders using Supabase service role key
// Protected by ADMIN_PASSWORD and using Supabase service role key on the server.

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { admin_password, product_id, quantity, supplier_id, total_cost } = req.body || {};
    if (!admin_password) {
      return res.status(401).json({ error: 'Password required' });
    }
    if (admin_password !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    if (!product_id || !quantity || Number(quantity) <= 0) {
      return res.status(400).json({ error: 'product_id and positive quantity are required' });
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!SUPABASE_URL || !SERVICE_ROLE) {
      return res.status(500).json({ error: 'Supabase configuration missing on server' });
    }

    const payload = {
      supplier_id: supplier_id || null,
      product_id,
      quantity: Number(quantity),
      status: 'requested',
      shipping_status: 'pending',
      total_cost: Number(total_cost || 0)
    };

    const response = await fetch(`${SUPABASE_URL}/rest/v1/purchase_orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: SERVICE_ROLE,
        Authorization: `Bearer ${SERVICE_ROLE}`,
        Prefer: 'return=representation'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const detail = await response.text();
      return res.status(502).json({ error: 'Failed to create purchase order', detail });
    }

    const data = await response.json();
    const order = Array.isArray(data) ? data[0] : data;

    return res.status(200).json({ ok: true, purchase_order: order });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'internal_error', detail: String(err) });
  }
};
