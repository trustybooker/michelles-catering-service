(() => {
  const operations = document.querySelector('[data-section="operations"]');
  if (!operations) return;
  const panel = document.createElement('div');
  panel.className = 'admin-panel';
  panel.hidden = true;
  panel.innerHTML = '<h2>Team access</h2><p>Owner-only access management. Managers can edit approved business content; viewers are read-only.</p><div class="settings-grid"><label class="admin-field">Team member email<input data-team-email type="email" autocomplete="off"></label><label class="admin-field">Role<select data-team-role><option value="manager">Manager</option><option value="viewer">Viewer</option></select></label></div><button class="admin-button primary" type="button" data-team-add>Add or restore access</button><p class="admin-status" data-team-status role="status"></p><div data-team-list></div>';
  operations.appendChild(panel);
  const email = panel.querySelector('[data-team-email]'), role = panel.querySelector('[data-team-role]'), status = panel.querySelector('[data-team-status]'), list = panel.querySelector('[data-team-list]');
  const render = (members = []) => { list.innerHTML = members.length ? members.map((m) => `<div class="admin-team-row"><strong>${m.email}</strong><span>${m.role}</span><button class="admin-button" type="button" data-team-remove="${m.email}" data-team-role="${m.role}" data-team-active="${m.active}">${m.active ? 'Revoke' : 'Restore'}</button></div>`).join('') : '<p class="admin-status">No team members yet.</p>'; };
  const load = async () => { const r = await fetch('/api/team-members', { cache: 'no-store' }); if (!r.ok) { panel.remove(); return; } panel.hidden = false; render((await r.json()).members); };
  panel.querySelector('[data-team-add]').addEventListener('click', async () => { status.textContent = 'Saving…'; const r = await fetch('/api/team-members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.value, role: role.value }) }); const data = await r.json().catch(() => ({})); status.textContent = r.ok ? `Access saved for ${data.email}.` : (data.error || 'Could not save team access.'); if (r.ok) { email.value = ''; await load(); } });
  list.addEventListener('click', async (event) => { const button = event.target.closest('[data-team-remove]'); if (!button) return; const member = button.dataset.teamRemove; const restoring = button.dataset.teamActive !== 'true'; const r = await fetch('/api/team-members', { method: restoring ? 'POST' : 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(restoring ? { email: member, role: button.dataset.teamRole } : { email: member }) }); status.textContent = r.ok ? `Access ${restoring ? 'restored' : 'revoked'} for ${member}.` : 'Could not update team access.'; await load(); });
  load();
})();
