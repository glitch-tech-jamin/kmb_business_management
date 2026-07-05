function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return { url, serviceRoleKey };
}

function supabaseHeaders(serviceRoleKey) {
  return {
    'Content-Type': 'application/json',
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    Prefer: 'return=representation',
  };
}

function buildPurchaseOrderPayload({ product_id, quantity, supplier_id, total_cost }) {
  return {
    supplier_id: supplier_id || null,
    product_id,
    quantity: Number(quantity),
    status: 'requested',
    shipping_status: 'pending',
    total_cost: Number(total_cost || 0),
  };
}

async function insertPurchaseOrder(supabaseUrl, serviceRoleKey, payload) {
  const response = await fetch(`${supabaseUrl}/rest/v1/purchase_orders`, {
    method: 'POST',
    headers: supabaseHeaders(serviceRoleKey),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const detail = await response.text();
    return { order: null, error: detail };
  }

  const data = await response.json();
  const order = Array.isArray(data) ? data[0] : data;
  return { order, error: null };
}

async function insertInventoryMovement(supabaseUrl, serviceRoleKey, payload) {
  await fetch(`${supabaseUrl}/rest/v1/inventory_movements`, {
    method: 'POST',
    headers: supabaseHeaders(serviceRoleKey),
    body: JSON.stringify(payload),
  }).catch(() => {});
}

function validatePurchaseOrderInput(product_id, quantity) {
  if (!product_id || !quantity || Number(quantity) <= 0) {
    return 'product_id and positive quantity are required';
  }
  return null;
}

module.exports = {
  getSupabaseConfig,
  supabaseHeaders,
  buildPurchaseOrderPayload,
  insertPurchaseOrder,
  insertInventoryMovement,
  validatePurchaseOrderInput,
};
