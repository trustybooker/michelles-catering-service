(() => {
  const key = 'michelles-admin-settings';
  const defaults = { classicsPrice: 'Quote', celebrationPrice: 'Quote', officePrice: 'Quote', sweetsPrice: 'Quote' };
  const read = () => { try { return { ...defaults, ...(JSON.parse(localStorage.getItem(key) || '{}') || {}) }; } catch { return { ...defaults }; } };
  const save = (state) => localStorage.setItem(key, JSON.stringify({ ...read(), ...state }));
  const operations = document.querySelector('[data-section="operations"]');
  if (!operations) return;
  const panel = document.createElement('div'); panel.className = 'admin-panel';
  panel.innerHTML = '<h2>Menu pricing</h2><p>Use labels such as “From $18/person” or leave “Quote” when pricing depends on the event.</p><div class="settings-grid"><label class="admin-field">Jamaican classics<input data-price="classicsPrice" maxlength="40" placeholder="Quote"></label><label class="admin-field">Celebration spreads<input data-price="celebrationPrice" maxlength="40" placeholder="Quote"></label><label class="admin-field">Office &amp; weddings<input data-price="officePrice" maxlength="40" placeholder="Quote"></label><label class="admin-field">Sweet finishes<input data-price="sweetsPrice" maxlength="40" placeholder="Quote"></label></div><p class="admin-status" data-price-status role="status"></p>';
  operations.insertBefore(panel, operations.firstElementChild);
  const state = read(); panel.querySelectorAll('[data-price]').forEach((input) => { input.value = state[input.dataset.price] || 'Quote'; input.addEventListener('change', () => { save({ [input.dataset.price]: input.value.trim() || 'Quote' }); panel.querySelector('[data-price-status]').textContent = 'Pricing saved in this browser. Open the customer menu to preview it.'; }); });
  const actions = document.querySelector('.admin-actions'); const inbox = document.createElement('a'); inbox.className = 'admin-button'; inbox.href = 'mailto:fifynow@gmail.com?subject=Michelle%27s%20Catering%20inquiries'; inbox.textContent = 'Open inquiry inbox'; actions?.insertBefore(inbox, actions.firstChild);
  document.querySelector('#saveAll')?.addEventListener('click', () => { const prices = {}; panel.querySelectorAll('[data-price]').forEach((input) => { prices[input.dataset.price] = input.value.trim() || 'Quote'; }); save(prices); const status = document.querySelector('#adminStatus'); if (status) status.textContent = 'Saved locally in this browser. Customer-menu preview is updated on this device.'; });
})();
