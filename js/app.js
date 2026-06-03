const state = {
  customers: [],
  products: [],
  invoices: [],
  suppliers: []
};

const api = {
  customers: `${window.config?.SUPABASE_URL || ''}/rest/v1/customers`,
  products: `${window.config?.SUPABASE_URL || ''}/rest/v1/products`,
  invoices: `${window.config?.SUPABASE_URL || ''}/rest/v1/invoices`,
  suppliers: `${window.config?.SUPABASE_URL || ''}/rest/v1/suppliers`,
  purchaseOrders: `${window.config?.SUPABASE_URL || ''}/rest/v1/purchase_orders`
};

const productMarkupPercent = 0.30;

function createHeaders() {
  return {
    'Content-Type': 'application/json',
    apikey: window.config?.SUPABASE_ANON_KEY || '',
    Authorization: `Bearer ${window.config?.SUPABASE_ANON_KEY || ''}`
  };
}

async function fetchResources() {
  await loadSuppliers();
  await Promise.all([loadCustomers(), loadProducts(), loadInvoices()]);
}

async function loadCustomers() {
  const tableBody = document.querySelector('#customer-table tbody');
  if (!tableBody) return;
  const results = await fetchJson(api.customers + '?select=*');
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
  const results = await fetchJson(api.suppliers + '?select=*');
  state.suppliers = results || [];

  if (tableBody) {
    tableBody.innerHTML = state.suppliers.map(supplier => `
      <tr>
        <td>${escapeHtml(supplier.name)}</td>
        <td>${escapeHtml(supplier.email || '')}</td>
        <td>${escapeHtml(supplier.phone || '')}</td>
        <td>${escapeHtml(supplier.address || '')}</td>
      </tr>
    `).join('');
  }

  populateSupplierSelect();
}

function populateSupplierSelect() {
  const supplierSelect = document.querySelector('#product-supplier');
  if (!supplierSelect) return;
  supplierSelect.innerHTML = `
    <option value="">Choose supplier</option>
    ${state.suppliers.map(supplier => `
      <option value="${supplier.id}">${escapeHtml(supplier.name)}</option>
    `).join('')}
  `;
}

async function loadProducts() {
  const tableBody = document.querySelector('#product-table tbody');
  if (!tableBody) return;
  const results = await fetchJson(api.products + '?select=*');
  state.products = results || [];

  tableBody.innerHTML = state.products.map(product => {
    const supplier = state.suppliers.find(s => s.id === product.supplier_id);
    const supplierName = supplier ? supplier.name : 'Unassigned';
    const lowStock = Number(product.stock) <= Number(product.reorder_threshold);

    return `
      <tr data-product-id="${product.id}">
        <td>${escapeHtml(product.name)}</td>
        <td>${escapeHtml(product.category || '')}</td>
        <td>${escapeHtml(product.stock?.toString() || '0')}</td>
        <td>${escapeHtml(product.reorder_threshold?.toString() || '0')}</td>
        <td>${escapeHtml(supplierName)}</td>
        <td>${formatCurrency(product.price)}</td>
        <td>${escapeHtml(product.sales_count?.toString() || '0')}</td>
        <td>
          <button class="record-sale-button" type="button">Record sale</button>
          ${lowStock ? '<button class="order-more-button" type="button">Order more</button>' : ''}
        </td>
      </tr>
    `;
  }).join('');

  attachProductButtons();
}

async function loadInvoices() {
  const tableBody = document.querySelector('#invoice-table tbody');
  if (!tableBody) return;
  const results = await fetchJson(api.invoices + '?select=*');
  state.invoices = results || [];
  tableBody.innerHTML = state.invoices.map(invoice => `
    <tr>
      <td>${escapeHtml(invoice.customer_name || '')}</td>
      <td>${escapeHtml(invoice.status || '')}</td>
      <td>${formatCurrency(invoice.total)}</td>
      <td>${escapeHtml(invoice.issued_date || '')}</td>
    </tr>
  `).join('');
}

async function fetchJson(url, options = {}) {
  if (!window.config?.SUPABASE_URL || !window.config?.SUPABASE_ANON_KEY) {
    return [];
  }
  const response = await fetch(url, { headers: createHeaders(), ...options });
  if (!response.ok) {
    console.warn('Fetch failed', response.status, response.statusText);
    return [];
  }
  return response.json();
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatCurrency(value) {
  if (value === undefined || value === null || Number.isNaN(Number(value))) return '';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value));
}

function showMessage(selector, message) {
  const el = document.querySelector(selector);
  if (el) el.textContent = message;
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
  const created = await fetchJson(api.customers, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (created) {
    showMessage('#customer-message', 'Customer added successfully.');
    event.target.reset();
    await loadCustomers();
  }
}

async function addSupplier(event) {
  event.preventDefault();
  const payload = {
    name: document.querySelector('#supplier-name')?.value?.trim() || '',
    email: document.querySelector('#supplier-email')?.value?.trim() || '',
    phone: document.querySelector('#supplier-phone')?.value?.trim() || '',
    address: document.querySelector('#supplier-address')?.value?.trim() || ''
  };
  if (!payload.name) {
    showMessage('#supplier-message', 'Supplier name is required.');
    return;
  }
  const created = await fetchJson(api.suppliers, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (created) {
    showMessage('#supplier-message', 'Supplier added successfully.');
    event.target.reset();
    await loadSuppliers();
  }
}

async function addProduct(event) {
  event.preventDefault();
  const name = document.querySelector('#product-name')?.value?.trim() || '';
  const description = document.querySelector('#product-description')?.value?.trim() || '';
  const category = document.querySelector('#product-category')?.value?.trim() || 'Perfume';
  const supplierId = document.querySelector('#product-supplier')?.value || null;
  const purchaseAmount = parseFloat(document.querySelector('#product-purchase')?.value || '0') || 0;
  const transportCost = parseFloat(document.querySelector('#product-transport')?.value || '0') || 0;
  const stock = parseInt(document.querySelector('#product-stock')?.value || '0', 10) || 0;
  const reorderThreshold = parseInt(document.querySelector('#product-reorder')?.value || '0', 10) || 0;
  const enteredPrice = parseFloat(document.querySelector('#product-price')?.value || '0') || 0;

  if (!name) {
    showMessage('#product-message', 'Product name is required.');
    return;
  }
  if (purchaseAmount <= 0) {
    showMessage('#product-message', 'Purchase amount is required.');
    return;
  }
  if (stock < 0) {
    showMessage('#product-message', 'Stock must be zero or more.');
    return;
  }

  const costTotal = Number((purchaseAmount + transportCost).toFixed(2));
  const suggestedPrice = calculateSuggestedSell(purchaseAmount, transportCost);
  const price = enteredPrice > 0 ? enteredPrice : suggestedPrice;
  const combinedDescription = `${description}${description ? ' | ' : ''}Cost total: ${formatCurrency(costTotal)} | Transport: ${formatCurrency(transportCost)}`;

  const payload = {
    name,
    description: combinedDescription,
    category,
    price,
    stock,
    reorder_threshold: reorderThreshold,
    supplier_id: supplierId || null
  };

  const created = await fetchJson(api.products, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (created) {
    showMessage('#product-message', `Product added at ${formatCurrency(price)}. Use Record sale to update inventory later.`);
    event.target.reset();
    updateSellSuggestion();
    await loadProducts();
  }
}

function calculateSuggestedSell(purchaseAmount, transportCost) {
  const costTotal = Number(purchaseAmount || 0) + Number(transportCost || 0);
  return Number((costTotal * (1 + productMarkupPercent)).toFixed(2));
}

function updateSellSuggestion() {
  const purchase = parseFloat(document.querySelector('#product-purchase')?.value || '0') || 0;
  const transport = parseFloat(document.querySelector('#product-transport')?.value || '0') || 0;
  const suggestionEl = document.querySelector('#product-suggestion');
  if (!suggestionEl) return;
  if (purchase > 0 || transport > 0) {
    suggestionEl.textContent = `Suggested sell price: ${formatCurrency(calculateSuggestedSell(purchase, transport))} (30% markup)`;
  } else {
    suggestionEl.textContent = 'Enter purchase amount and transport cost to see a suggested sell price.';
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
  const updated = await fetchJson(`${api.products}?id=eq.${encodeURIComponent(productId)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      stock: remainingStock,
      sales_count: Number(product.sales_count || 0) + quantity
    })
  });

  if (updated) {
    showMessage('#product-message', `Recorded sale of ${quantity} item(s). Stock is now ${remainingStock}.`);
    await loadProducts();
  }
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
  const payload = {
    supplier_id: product.supplier_id,
    product_id: product.id,
    quantity,
    status: 'requested',
    total_cost: totalCost
  };

  const created = await fetchJson(api.purchaseOrders, {
    method: 'POST',
    body: JSON.stringify(payload)
  });

  if (created) {
    showMessage('#product-message', `Purchase order submitted for ${quantity} more units from supplier.`);
  }
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
  }

  updateSellSuggestion();
  fetchResources();
}

document.addEventListener('DOMContentLoaded', initRoutes);
