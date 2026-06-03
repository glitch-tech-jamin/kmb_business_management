const state = {
  customers: [],
  products: [],
  invoices: []
};

const api = {
  customers: `${window.config?.SUPABASE_URL || ''}/rest/v1/customers`,
  products: `${window.config?.SUPABASE_URL || ''}/rest/v1/products`,
  invoices: `${window.config?.SUPABASE_URL || ''}/rest/v1/invoices`
};

const productMarkupPercent = 0.30;

function calculateSuggestedSell(purchaseAmount, transportCost) {
  const costTotal = Number(purchaseAmount || 0) + Number(transportCost || 0);
  return Number((costTotal * (1 + productMarkupPercent)).toFixed(2));
}

function updateSellSuggestion() {
  const purchase = parseFloat(document.querySelector('#product-purchase')?.value || '0');
  const transport = parseFloat(document.querySelector('#product-transport')?.value || '0');
  const suggested = calculateSuggestedSell(purchase, transport);
  const suggestionEl = document.querySelector('#product-suggestion');
  if (suggestionEl) {
    suggestionEl.textContent = purchase > 0 || transport > 0
      ? `Suggested sell price: ${formatCurrency(suggested)} (30% markup)`
      : 'Enter purchase amount and transport cost to see a suggested sell price.';
  }
}

function createHeaders() {
  return {
    'Content-Type': 'application/json',
    apikey: window.config?.SUPABASE_ANON_KEY || '',
    Authorization: `Bearer ${window.config?.SUPABASE_ANON_KEY || ''}`
  };
}

async function fetchResources() {
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

async function loadProducts() {
  const tableBody = document.querySelector('#product-table tbody');
  if (!tableBody) return;
  const results = await fetchJson(api.products + '?select=*');
  state.products = results || [];
  tableBody.innerHTML = state.products.map(product => {
    const descriptionText = escapeHtml(product.description || '');
    const costMatch = /Cost total: \$?([0-9.,]+)/.exec(product.description || '');
    const costTotal = costMatch ? formatCurrency(Number(costMatch[1].replace(/,/g, ''))) : '';
    return `
      <tr data-product-id="${product.id}">
        <td>${escapeHtml(product.name)}</td>
        <td>${descriptionText}</td>
        <td>${costTotal}</td>
        <td class="sell-price-cell">${formatCurrency(product.price)}</td>
        <td><button class="edit-price-button" type="button">Edit price</button></td>
      </tr>
    `;
  }).join('');

  attachPriceEditors();
}

function attachPriceEditors() {
  const buttons = document.querySelectorAll('.edit-price-button');
  buttons.forEach(button => {
    button.removeEventListener('click', handleEditPriceClick);
    button.addEventListener('click', handleEditPriceClick);
  });
}

function handleEditPriceClick(event) {
  const button = event.currentTarget;
  const row = button.closest('tr');
  if (!row) return;
  const productId = row.dataset.productId;
  const priceCell = row.querySelector('.sell-price-cell');
  if (!priceCell) return;
  const currentPrice = parseFloat(priceCell.textContent.replace(/[^0-9.]/g, '')) || 0;
  priceCell.innerHTML = `
    <input class="sell-price-input" type="number" step="0.01" value="${currentPrice}">
    <button class="save-price-button" type="button">Save</button>
    <button class="cancel-price-button" type="button">Cancel</button>
  `;

  const saveButton = priceCell.querySelector('.save-price-button');
  const cancelButton = priceCell.querySelector('.cancel-price-button');
  saveButton?.addEventListener('click', () => saveUpdatedSellPrice(productId, priceCell));
  cancelButton?.addEventListener('click', () => {
    priceCell.textContent = formatCurrency(currentPrice);
  });
}

async function saveUpdatedSellPrice(productId, priceCell) {
  const input = priceCell.querySelector('.sell-price-input');
  if (!input) return;
  const newPrice = parseFloat(input.value || '0');
  if (!newPrice || newPrice <= 0) {
    showMessage('#product-message', 'Enter a valid sell price to save.');
    return;
  }
  const response = await fetchJson(`${api.products}?id=eq.${encodeURIComponent(productId)}`, {
    method: 'PATCH',
    body: JSON.stringify({ price: newPrice })
  });
  if (response) {
    showMessage('#product-message', 'Sell price updated.');
    await loadProducts();
  } else {
    showMessage('#product-message', 'Unable to update sell price.');
  }
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

async function addProduct(event) {
  event.preventDefault();
  const name = document.querySelector('#product-name')?.value?.trim() || '';
  const description = document.querySelector('#product-description')?.value?.trim() || '';
  const purchaseAmount = parseFloat(document.querySelector('#product-purchase')?.value || '0') || 0;
  const transportCost = parseFloat(document.querySelector('#product-transport')?.value || '0') || 0;
  const enteredPrice = parseFloat(document.querySelector('#product-price')?.value || '0') || 0;

  if (!name) {
    showMessage('#product-message', 'Product name is required.');
    return;
  }
  if (purchaseAmount <= 0) {
    showMessage('#product-message', 'Initial purchase amount is required.');
    return;
  }

  const costTotal = Number((purchaseAmount + transportCost).toFixed(2));
  const suggestedPrice = calculateSuggestedSell(purchaseAmount, transportCost);
  const price = enteredPrice > 0 ? enteredPrice : suggestedPrice;
  const combinedDescription = `${description}${description ? ' | ' : ''}Cost total: ${formatCurrency(costTotal)} | Transport: ${formatCurrency(transportCost)}`;

  const payload = {
    name,
    description: combinedDescription,
    price
  };

  const created = await fetchJson(api.products, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (created) {
    showMessage('#product-message', `Product added at ${formatCurrency(price)}. Use Edit price to update later.`);
    event.target.reset();
    updateSellSuggestion();
    await loadProducts();
  }
}

function initRoutes() {
  const customerForm = document.querySelector('#customer-form');
  if (customerForm) customerForm.addEventListener('submit', addCustomer);
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
