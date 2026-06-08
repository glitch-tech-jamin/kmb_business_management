const adminPasswordInput = document.querySelector('#admin-password');
const adminPanel = document.querySelector('#admin-panel');
const loginForm = document.querySelector('#admin-login-form');
const loginMessage = document.querySelector('#admin-login-message');
const orderForm = document.querySelector('#admin-order-form');
const orderMessage = document.querySelector('#admin-order-message');
let adminPassword = '';

function showMessage(el, text, isError = true) {
  if (!el) return;
  el.textContent = text;
  el.style.color = isError ? '#cc3b3b' : '#1d5a92';
}

loginForm?.addEventListener('submit', event => {
  event.preventDefault();
  const password = adminPasswordInput?.value?.trim();
  if (!password) {
    showMessage(loginMessage, 'Enter the admin password.');
    return;
  }
  adminPassword = password;
  adminPanel?.classList.remove('hidden');
  showMessage(loginMessage, 'Admin unlocked. You may create purchase orders.', false);
  loginForm.classList.add('hidden');
});

orderForm?.addEventListener('submit', async event => {
  event.preventDefault();
  if (!adminPassword) {
    showMessage(orderMessage, 'Unlock admin first.');
    return;
  }

  const productId = document.querySelector('#admin-product-id')?.value?.trim();
  const supplierId = document.querySelector('#admin-supplier-id')?.value?.trim();
  const quantity = Number(document.querySelector('#admin-quantity')?.value || '0');
  const totalCost = Number(document.querySelector('#admin-total-cost')?.value || '0');

  if (!productId || quantity <= 0) {
    showMessage(orderMessage, 'Product ID and positive quantity are required.');
    return;
  }

  try {
    const response = await fetch('/api/admin-create-purchase-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        admin_password: adminPassword,
        product_id: productId,
        supplier_id: supplierId || null,
        quantity,
        total_cost: totalCost
      })
    });

    const data = await response.json();
    if (!response.ok) {
      showMessage(orderMessage, data.error || 'Unable to create purchase order.');
      return;
    }

    showMessage(orderMessage, `Purchase order created: ${data.purchase_order.id}`, false);
    orderForm.reset();
  } catch (error) {
    showMessage(orderMessage, 'Request failed. Check network and try again.');
    console.error(error);
  }
});
