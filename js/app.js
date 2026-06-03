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
  tableBody.innerHTML = state.products.map(product => `
    <tr>
      <td>${escapeHtml(product.name)}</td>
      <td>${escapeHtml(product.description || '')}</td>
      <td>${formatCurrency(product.price)}</td>
    </tr>
  `).join('');
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
  const payload = {
    name: document.querySelector('#product-name')?.value?.trim() || '',
    description: document.querySelector('#product-description')?.value?.trim() || '',
    price: parseFloat(document.querySelector('#product-price')?.value || '0') || 0
  };
  if (!payload.name) {
    showMessage('#product-message', 'Product name is required.');
    return;
  }
  const created = await fetchJson(api.products, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  if (created) {
    showMessage('#product-message', 'Product added successfully.');
    event.target.reset();
    await loadProducts();
  }
}

function initRoutes() {
  const customerForm = document.querySelector('#customer-form');
  if (customerForm) customerForm.addEventListener('submit', addCustomer);
  const productForm = document.querySelector('#product-form');
  if (productForm) productForm.addEventListener('submit', addProduct);
  fetchResources();
}

document.addEventListener('DOMContentLoaded', initRoutes);
