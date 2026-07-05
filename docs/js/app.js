const state = {
  customers: [],
  products: [],
  invoices: [],
  suppliers: [],
  purchaseOrders: []
};

const api = {
  customers: `${window.config?.SUPABASE_URL || ''}/rest/v1/customers`,
  products: `${window.config?.SUPABASE_URL || ''}/rest/v1/products`,
  invoices: `${window.config?.SUPABASE_URL || ''}/rest/v1/invoices`,
  suppliers: `${window.config?.SUPABASE_URL || ''}/rest/v1/suppliers`,
  purchaseOrders: `${window.config?.SUPABASE_URL || ''}/rest/v1/purchase_orders`,
  inventoryMovements: `${window.config?.SUPABASE_URL || ''}/rest/v1/inventory_movements`,
  shippingRecords: `${window.config?.SUPABASE_URL || ''}/rest/v1/shipping_records`
};

const productMarkupPercent = 0.30;
const exchangeRates = {
  ZMW: 1,
  USD: 18.5,
  EUR: 20.3,
  GBP: 23.4,
  ZAR: 1.1
};

function createHeaders() {
  return {
    'Content-Type': 'application/json',
    apikey: window.config?.SUPABASE_ANON_KEY || '',
    Authorization: `Bearer ${window.config?.SUPABASE_ANON_KEY || ''}`
  };
}

async function fetchResources() {
  await Promise.all([
    loadSuppliers(),
    loadCustomers(),
    loadProducts(),
    loadInvoices(),
    loadPurchaseOrders()
  ]);
}

async function loadCustomers() {
  const tableBody = document.querySelector('#customer-table tbody');
  if (!tableBody) return;
  let results;
  try {
    results = await fetchJson(api.customers + '?select=*');
  } catch (error) {
    console.error('Failed to load customers', error);
    showMessage('#customer-message', `Failed to load customers: ${error.message}`);
    return;
  }
  state.customers = results || [];
  tableBody.innerHTML = state.customers.map(customer => `
    <tr>
      <td>${escapeHtml(customer.name)}</td>
      <td>${escapeHtml(customer.email || '')}</td>
      <td>${escapeHtml(customer.phone || '')}</td>
      <td>${escapeHtml(customer.address || '')}</td>
    </tr>
  `).join('');
}

async function loadSuppliers() {
  const tableBody = document.querySelector('#supplier-table tbody');
  let results;
  try {
    results = await fetchJson(api.suppliers + '?select=*');
  } catch (error) {
    console.error('Failed to load suppliers', error);
    showMessage('#supplier-message', `Failed to load suppliers: ${error.message}`);
    return;
  }
  state.suppliers = results || [];

  if (tableBody) {
    tableBody.innerHTML = state.suppliers.map(supplier => `
      <tr>
        <td>${escapeHtml(supplier.name)}</td>
        <td>${escapeHtml(supplier.product_types || '')}</td>
        <td>${escapeHtml(supplier.country || '')}</td>
        <td>${escapeHtml(supplier.currency || 'ZMW')}</td>
        <td>${escapeHtml(supplier.email || '')}</td>
        <td>${escapeHtml(supplier.phone || '')}</td>
        <td>${escapeHtml(supplier.address || '')}</td>
      </tr>
    `).join('');
  }

  populateSupplierSelect();
  renderSupplierDashboard();
}

function populateSupplierSelect() {
  const supplierSelect = document.querySelector('#product-supplier');
  if (!supplierSelect) return;
  supplierSelect.innerHTML = `
    <option value="">Choose supplier</option>
    ${state.suppliers.map(supplier => `
      <option value="${supplier.id}">${escapeHtml(supplier.name)} (${escapeHtml(supplier.currency || 'ZMW')})</option>
    `).join('')}
  `;
}

async function loadProducts() {
  const tableBody = document.querySelector('#product-table tbody');
  if (!tableBody) return;
  let results;
  try {
    results = await fetchJson(api.products + '?select=*');
  } catch (error) {
    console.error('Failed to load products', error);
    showMessage('#product-message', `Failed to load products: ${error.message}`);
    return;
  }
  state.products = results || [];

  const lowStockCount = state.products.filter(product => Number(product.stock || 0) <= Number(product.reorder_threshold || 0)).length;
  const reorderText = lowStockCount > 0 ? `${lowStockCount} low stock product(s) need attention.` : 'No low-stock products right now.';
  const reorderAlert = document.querySelector('#reorder-alert-text');
  if (reorderAlert) reorderAlert.textContent = reorderText;

  tableBody.innerHTML = state.products.map(product => {
    const supplier = state.suppliers.find(s => s.id === product.supplier_id);
    const supplierName = supplier ? supplier.name : 'Unassigned';
    const productCurrency = product.price_currency || supplier?.currency || 'ZMW';
    const sellPriceZmw = Number(product.price_zmw || (Number(product.price || 0) * getExchangeRate(productCurrency))).toFixed(2);
    const lowStock = Number(product.stock || 0) <= Number(product.reorder_threshold || 0);

    return `
      <tr data-product-id="${product.id}" class="${lowStock ? 'low-stock' : ''}">
        <td>${escapeHtml(product.name)}</td>
        <td>${escapeHtml(product.product_type || '')}</td>
        <td>${escapeHtml(product.brand || '')}</td>
        <td>${escapeHtml(supplierName)}</td>
        <td>${escapeHtml((product.stock || 0).toString())}</td>
        <td>${escapeHtml((product.reorder_threshold || 0).toString())}</td>
        <td>${formatCurrency(product.price, productCurrency)}</td>
        <td>${formatCurrency(sellPriceZmw, 'ZMW')}</td>
        <td>${escapeHtml(product.status || 'active')}</td>
        <td>
          <button class="record-sale-button" type="button">Record sale</button>
          ${lowStock ? '<button class="order-more-button" type="button">Order more</button>' : ''}
        </td>
      </tr>
    `;
  }).join('');

  attachProductButtons();
  renderSupplierDashboard();
}

async function loadPurchaseOrders() {
  try {
    const results = await fetchJson(api.purchaseOrders + '?select=*');
    state.purchaseOrders = results || [];
  } catch (error) {
    console.error('Failed to load purchase orders', error);
  }
}

function renderSupplierDashboard() {
  const supplierCountEl = document.querySelector('#supplier-count');
  if (supplierCountEl) supplierCountEl.textContent = state.suppliers.length.toString();

  const lowStockProducts = state.products.filter(product => Number(product.stock || 0) <= Number(product.reorder_threshold || 0));
  const lowStockCountEl = document.querySelector('#low-stock-count');
  if (lowStockCountEl) lowStockCountEl.textContent = lowStockProducts.length.toString();

  const lowStockSupplierIds = [...new Set(lowStockProducts.map(product => product.supplier_id).filter(Boolean))];
  const supplierReorderStatusEl = document.querySelector('#supplier-reorder-status');
  if (supplierReorderStatusEl) {
    supplierReorderStatusEl.textContent = lowStockSupplierIds.length > 0
      ? `${lowStockSupplierIds.length} supplier(s) have products at or below reorder threshold.`
      : 'All supplier allocations are healthy.';
  }

  const supplierSales = state.products.reduce((acc, product) => {
    if (product.supplier_id) {
      acc[product.supplier_id] = (acc[product.supplier_id] || 0) + Number(product.sales_count || 0);
    }
    return acc;
  }, {});
  const topSupplierId = Object.keys(supplierSales).sort((a, b) => supplierSales[b] - supplierSales[a])[0];
  const topSupplier = state.suppliers.find(s => s.id === topSupplierId);
  const topSupplierEl = document.querySelector('#top-supplier');
  if (topSupplierEl) topSupplierEl.textContent = topSupplier ? `${topSupplier.name} (${supplierSales[topSupplierId]} sales)` : 'None yet';
}

async function addCustomer(event) {
  event.preventDefault();
  const payload = {
    name: document.querySelector('#customer-name')?.value?.trim() || '',
    email: document.querySelector('#customer-email')?.value?.trim() || '',
    phone: document.querySelector('#customer-phone')?.value?.trim() || '',
    address: document.querySelector('#customer-address')?.value?.trim() || ''
  };

  if (!payload.name) {
    showMessage('#customer-message', 'Customer name is required.');
    return;
  }

  try {
    await fetchJson(api.customers, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('Failed to add customer', error);
    showMessage('#customer-message', `Failed to add customer: ${error.message}`);
    return;
  }

  showMessage('#customer-message', 'Customer added successfully.');
  event.target.reset();
  await loadCustomers();
}

async function addSupplier(event) {
  event.preventDefault();
  const payload = {
    name: document.querySelector('#supplier-name')?.value?.trim() || '',
    product_types: document.querySelector('#supplier-product-types')?.value?.trim() || '',
    country: document.querySelector('#supplier-country')?.value?.trim() || '',
    currency: document.querySelector('#supplier-currency')?.value || 'ZMW',
    email: document.querySelector('#supplier-email')?.value?.trim() || '',
    phone: document.querySelector('#supplier-phone')?.value?.trim() || '',
    address: document.querySelector('#supplier-address')?.value?.trim() || ''
  };

  if (!payload.name) {
    showMessage('#supplier-message', 'Supplier name is required.');
    return;
  }

  try {
    await fetchJson(api.suppliers, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('Failed to add supplier', error);
    showMessage('#supplier-message', `Failed to add supplier: ${error.message}`);
    return;
  }

  showMessage('#supplier-message', 'Supplier added successfully.');
  event.target.reset();
  await loadSuppliers();
}

async function addProduct(event) {
  event.preventDefault();
  const name = document.querySelector('#product-name')?.value?.trim() || '';
  const productType = document.querySelector('#product-type')?.value || '';
  const brand = document.querySelector('#product-brand')?.value?.trim() || '';
  const category = document.querySelector('#product-category')?.value?.trim() || '';
  const season = document.querySelector('#product-season')?.value?.trim() || '';
  const volume = document.querySelector('#product-volume')?.value?.trim() || '';
  const concentration = document.querySelector('#product-concentration')?.value?.trim() || '';
  const team = document.querySelector('#product-team')?.value?.trim() || '';
  const size = document.querySelector('#product-size')?.value?.trim() || '';
  const sleeveType = document.querySelector('#product-sleeve')?.value?.trim() || '';
  const gender = document.querySelector('#product-gender')?.value?.trim() || '';
  const model = document.querySelector('#product-model')?.value?.trim() || '';
  const attributes = document.querySelector('#product-attributes')?.value?.trim() || '';
  const status = document.querySelector('#product-status')?.value || 'active';
  const supplierId = document.querySelector('#product-supplier')?.value || null;
  const purchaseCost = Number(document.querySelector('#product-purchase')?.value || '0');
  const transportCost = Number(document.querySelector('#product-transport')?.value || '0');
  const stock = parseInt(document.querySelector('#product-stock')?.value || '0', 10) || 0;
  const reorderThreshold = parseInt(document.querySelector('#product-reorder')?.value || '0', 10) || 0;
  const enteredPrice = Number(document.querySelector('#product-price')?.value || '0');

  if (!name) {
    showMessage('#product-message', 'Product name is required.');
    return;
  }
  if (!productType) {
    showMessage('#product-message', 'Please select a product type.');
    return;
  }
  if (!supplierId) {
    showMessage('#product-message', 'Please choose a supplier.');
    return;
  }
  if (purchaseCost <= 0) {
    showMessage('#product-message', 'Purchase cost must be greater than zero.');
    return;
  }

  const supplier = state.suppliers.find(s => s.id === supplierId);
  const productCurrency = supplier?.currency || 'ZMW';
  const costLocal = Number((purchaseCost + transportCost).toFixed(2));
  const costZmw = Number((costLocal * getExchangeRate(productCurrency)).toFixed(2));
  const suggestedPrice = calculateSuggestedSell(costLocal, 0);
  const price = enteredPrice > 0 ? enteredPrice : suggestedPrice;
  const priceZmw = Number((price * getExchangeRate(productCurrency)).toFixed(2));

  const payload = {
    name,
    product_type: productType,
    brand,
    category,
    season,
    volume,
    concentration,
    team,
    size,
    sleeve_type: sleeveType,
    gender,
    model,
    description: attributes,
    status,
    supplier_id: supplierId,
    purchase_cost: costLocal,
    cost_currency: productCurrency,
    cost_total_zmw: costZmw,
    price,
    price_currency: productCurrency,
    price_zmw: priceZmw,
    stock,
    reorder_threshold: reorderThreshold,
    sales_count: 0,
    attributes: {
      season,
      volume,
      concentration,
      team,
      size,
      sleeve_type: sleeveType,
      gender,
      model,
      notes: attributes
    }
  };

  try {
    await fetchJson(api.products, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  } catch (error) {
    console.error('Failed to add product', error);
    showMessage('#product-message', `Failed to add product: ${error.message}`);
    return;
  }

  showMessage('#product-message', `Product added at ${formatCurrency(price, productCurrency)} (${formatCurrency(priceZmw, 'ZMW')}).`);
  event.target.reset();
  updateSellSuggestion();
  await loadProducts();
}

function calculateSuggestedSell(purchaseAmount, transportCost) {
  const costTotal = Number(purchaseAmount || 0) + Number(transportCost || 0);
  return Number((costTotal * (1 + productMarkupPercent)).toFixed(2));
}

function updateSellSuggestion() {
  const purchase = Number(document.querySelector('#product-purchase')?.value || '0');
  const transport = Number(document.querySelector('#product-transport')?.value || '0');
  const supplierId = document.querySelector('#product-supplier')?.value || null;
  const supplier = state.suppliers.find(s => s.id === supplierId);
  const currency = supplier?.currency || 'ZMW';
  const costLocal = Number((purchase + transport).toFixed(2));
  const suggested = calculateSuggestedSell(costLocal, 0);
  const rate = getExchangeRate(currency);
  const suggestedZmw = Number((suggested * rate).toFixed(2));
  const suggestionEl = document.querySelector('#product-suggestion');
  const costInfoEl = document.querySelector('#product-cost-info');

  if (costInfoEl) {
    costInfoEl.textContent = supplierId
      ? `Costs use supplier currency ${currency}. Current conversion to ZMW: 1 ${currency} = ${formatCurrency(rate, 'ZMW')} ZMW.`
      : 'Choose a supplier to calculate costs in the supplier currency and ZMW.';
  }

  if (suggestionEl) {
    suggestionEl.textContent = purchase > 0 || transport > 0
      ? `Suggested sell price: ${formatCurrency(suggested, currency)} (${formatCurrency(suggestedZmw, 'ZMW')} in ZMW)`
      : 'Enter purchase cost and transport cost to see a suggested sell price.';
  }
}

function attachProductButtons() {
  document.querySelectorAll('.record-sale-button').forEach(button => {
    button.removeEventListener('click', handleRecordSaleClick);
    button.addEventListener('click', handleRecordSaleClick);
  });

  document.querySelectorAll('.order-more-button').forEach(button => {
    button.removeEventListener('click', handleOrderMoreClick);
    button.addEventListener('click', handleOrderMoreClick);
  });
}

function handleRecordSaleClick(event) {
  const row = event.currentTarget.closest('tr');
  if (!row) return;
  const productId = row.dataset.productId;
  recordSale(productId);
}

async function recordSale(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;
  const quantityText = prompt('Enter quantity sold', '1');
  const quantity = parseInt(quantityText || '0', 10);
  if (!quantity || quantity <= 0) {
    showMessage('#product-message', 'Sale quantity must be a positive number.');
    return;
  }

  const remainingStock = Math.max((Number(product.stock) || 0) - quantity, 0);
  try {
    await fetchJson(`${api.products}?id=eq.${encodeURIComponent(productId)}`, {
      method: 'PATCH',
      body: JSON.stringify({
        stock: remainingStock,
        sales_count: Number(product.sales_count || 0) + quantity
      })
    });
  } catch (error) {
    console.error('Failed to record sale', error);
    showMessage('#product-message', `Failed to record sale: ${error.message}`);
    return;
  }

  let movementWarning = '';
  try {
    await recordInventoryMovement({
      product_id: product.id,
      movement_type: 'sale',
      quantity,
      source: 'customer sale',
      destination: 'customer',
      related_order_id: null,
      note: `Sold ${quantity} units of ${product.name}`
    });
  } catch (error) {
    console.error('Sale recorded but logging the inventory movement failed', error);
    movementWarning = ' (warning: inventory movement was not logged)';
  }

  showMessage('#product-message', `Recorded sale of ${quantity} item(s). Stock is now ${remainingStock}.${movementWarning}`);
  await loadProducts();
  renderSupplierDashboard();
}

function handleOrderMoreClick(event) {
  const row = event.currentTarget.closest('tr');
  if (!row) return;
  const productId = row.dataset.productId;
  createPurchaseOrder(productId);
}

async function createPurchaseOrder(productId) {
  const product = state.products.find(p => p.id === productId);
  if (!product) return;

  if (!product.supplier_id) {
    showMessage('#product-message', 'Please assign a supplier to this product before ordering.');
    return;
  }

  const quantity = Math.max(Number(product.reorder_threshold) || 1, 1);
  const totalCost = Number((quantity * Number(product.price || 0)).toFixed(2));

  let purchaseOrder;
  try {
    const created = await fetchJson(api.purchaseOrders, {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        supplier_id: product.supplier_id,
        product_id: product.id,
        quantity,
        status: 'requested',
        total_cost: totalCost,
        shipping_status: 'pending'
      })
    });
    purchaseOrder = Array.isArray(created) ? created[0] : created;
  } catch (error) {
    console.error('Failed to create purchase order', error);
    showMessage('#product-message', `Unable to create purchase order: ${error.message}`);
    return;
  }

  if (!purchaseOrder || !purchaseOrder.id) {
    showMessage('#product-message', 'Unable to create purchase order: the server did not return an order id.');
    return;
  }

  const warnings = [];
  try {
    await recordInventoryMovement({
      product_id: product.id,
      movement_type: 'reorder',
      quantity,
      source: 'reorder request',
      destination: 'supplier',
      related_order_id: purchaseOrder.id,
      note: `Purchase order created for ${quantity} units of ${product.name}`
    });
  } catch (error) {
    console.error('Purchase order created but inventory movement logging failed', error);
    warnings.push('inventory movement');
  }

  try {
    await createShippingRecord(purchaseOrder.id);
  } catch (error) {
    console.error('Purchase order created but shipping record creation failed', error);
    warnings.push('shipping record');
  }

  const warningSuffix = warnings.length ? ` (warning: failed to create ${warnings.join(' and ')})` : '';
  showMessage('#product-message', `Purchase order submitted for ${quantity} units from the supplier.${warningSuffix}`);
  await loadPurchaseOrders();
  renderSupplierDashboard();
}

async function recordInventoryMovement(payload) {
  await fetchJson(api.inventoryMovements, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

async function createShippingRecord(purchaseOrderId) {
  await fetchJson(api.shippingRecords, {
    method: 'POST',
    body: JSON.stringify({
      purchase_order_id: purchaseOrderId,
      carrier: 'TBD',
      tracking_number: null,
      status: 'pending',
      notes: 'Shipping record created automatically for reorder.',
      shipped_at: null,
      delivered_at: null
    })
  });
}

async function loadInvoices() {
  const tableBody = document.querySelector('#invoice-table tbody');
  if (!tableBody) return;
  let results;
  try {
    results = await fetchJson(api.invoices + '?select=*');
  } catch (error) {
    console.error('Failed to load invoices', error);
    showMessage('#invoice-message', `Failed to load invoices: ${error.message}`);
    return;
  }
  state.invoices = results || [];
  tableBody.innerHTML = state.invoices.map(invoice => `
    <tr>
      <td>${escapeHtml(invoice.customer_name || '')}</td>
      <td>${escapeHtml(invoice.status || '')}</td>
      <td>${formatCurrency(invoice.total, 'ZMW')}</td>
      <td>${escapeHtml(invoice.issued_date || '')}</td>
    </tr>
  `).join('');
}

async function fetchJson(url, options = {}) {
  if (!window.config?.SUPABASE_URL || !window.config?.SUPABASE_ANON_KEY) {
    throw new Error('Supabase is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in config.js.');
  }

  const headers = { ...createHeaders(), ...(options.headers || {}) };

  let response;
  try {
    response = await fetch(url, { headers, ...options });
  } catch (networkError) {
    throw new Error(`Network request failed: ${networkError.message}`);
  }

  if (!response.ok) {
    let detail = '';
    try {
      detail = (await response.text()).trim();
    } catch {
      /* ignore inability to read the error body */
    }
    throw new Error(`Request failed (${response.status} ${response.statusText})${detail ? `: ${detail}` : ''}`);
  }

  // Some successful responses (e.g. 204, or POST/PATCH without a representation) have no body.
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Failed to parse the server response as JSON.');
  }
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatCurrency(value, currency = 'USD') {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(Number(value));
  } catch {
    return `${currency} ${Number(value).toFixed(2)}`;
  }
}

function getExchangeRate(currency) {
  return Number(exchangeRates[currency] || exchangeRates.ZMW || 1);
}

function showMessage(selector, message) {
  const el = document.querySelector(selector);
  if (el) el.textContent = message;
}

function initRoutes() {
  const customerForm = document.querySelector('#customer-form');
  if (customerForm) customerForm.addEventListener('submit', addCustomer);

  const supplierForm = document.querySelector('#supplier-form');
  if (supplierForm) supplierForm.addEventListener('submit', addSupplier);

  const productForm = document.querySelector('#product-form');
  if (productForm) {
    productForm.addEventListener('submit', addProduct);
    document.querySelector('#product-purchase')?.addEventListener('input', updateSellSuggestion);
    document.querySelector('#product-transport')?.addEventListener('input', updateSellSuggestion);
    document.querySelector('#product-supplier')?.addEventListener('change', updateSellSuggestion);
  }

  updateSellSuggestion();
  fetchResources();
}

document.addEventListener('DOMContentLoaded', initRoutes);
