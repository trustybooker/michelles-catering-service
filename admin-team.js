(() => {
  const operations = document.querySelector('[data-section="operations"]');
  if (!operations) return;
  const panel = document.createElement('div');
  panel.className = 'admin-panel';
  panel.hidden = true;
  panel.innerHTML = '<h2>Team access</h2><p>Find this workspace at <strong>Operations → Team access</strong>. Invite a manager or viewer by email; the invitee receives a secure sign-in link after access is saved.</p><div class="settings-grid"><label class="admin-field">Team member email<input data-team-email type="email" autocomplete="off"></label><label class="admin-field">Role<select data-team-role><option value="manager">Manager</option><option value="viewer">Viewer</option></select></label></div><button class="admin-button primary" type="button" data-team-add>Save access &amp; send sign-in link</button><p class="admin-status" data-team-status role="status"></p><div data-team-list></div>';
  operations.appendChild(panel);
  const email = panel.querySelector('[data-team-email]'), role = panel.querySelector('[data-team-role]'), status = panel.querySelector('[data-team-status]'), list = panel.querySelector('[data-team-list]');
  const render = (members = []) => {
    list.replaceChildren();
    if (!members.length) { const empty = document.createElement('p'); empty.className = 'admin-status'; empty.textContent = 'No team members yet.'; list.append(empty); return; }
    members.forEach((member) => {
      const row = document.createElement('div'); row.className = 'admin-team-row';
      const name = document.createElement('strong'); name.textContent = String(member.email || '');
      const memberRole = document.createElement('span'); memberRole.textContent = String(member.role || '');
      const action = document.createElement('button'); action.className = 'admin-button'; action.type = 'button'; action.textContent = member.active ? 'Revoke' : 'Restore';
      action.dataset.teamRemove = String(member.email || ''); action.dataset.teamRole = String(member.role || ''); action.dataset.teamActive = String(Boolean(member.active));
      row.append(name, memberRole, action); list.append(row);
    });
  };
  const load = async () => { const r = await fetch('/api/team-members', { cache: 'no-store' }); if (!r.ok) { panel.remove(); return; } panel.hidden = false; render((await r.json()).members); };
  panel.querySelector('[data-team-add]').addEventListener('click', async () => { const invited = email.value.trim(); if (!invited) { status.textContent = 'Enter a team member email first.'; return; } status.textContent = 'Saving access…'; const r = await fetch('/api/team-members', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: invited, role: role.value }) }); const data = await r.json().catch(() => ({})); if (!r.ok) { status.textContent = data.error || 'Could not save team access.'; return; } status.textContent = 'Sending secure sign-in link…'; const invite = await fetch('/api/admin-link', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: invited }) }); const inviteData = await invite.json().catch(() => ({})); status.textContent = invite.ok ? `Access saved and sign-in link sent to ${data.email}.` : (inviteData.error || `Access saved for ${data.email}; sign-in email could not be sent.`); email.value = ''; await load(); });
  list.addEventListener('click', async (event) => { const button = event.target.closest('[data-team-remove]'); if (!button) return; const member = button.dataset.teamRemove; const restoring = button.dataset.teamActive !== 'true'; if (!restoring && !window.confirm(`Revoke dashboard access for ${member}?`)) return; const r = await fetch('/api/team-members', { method: restoring ? 'POST' : 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(restoring ? { email: member, role: button.dataset.teamRole } : { email: member }) }); status.textContent = r.ok ? `Access ${restoring ? 'restored' : 'revoked'} for ${member}.` : 'Could not update team access.'; await load(); });
  load();
})();

