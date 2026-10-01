(() => {
  let dirty = false;
  const markDirty = () => { dirty = true; window.michelleAdminDirty = true; };
  window.michelleAdminMarkClean = () => { dirty = false; window.michelleAdminDirty = false; };
  window.addEventListener('beforeunload', (event) => { if (!dirty) return; event.preventDefault(); event.returnValue = ''; });
  document.addEventListener('input', (event) => { if (event.target.matches('input, textarea')) markDirty(); });
  document.addEventListener('change', (event) => {
    if (event.target.matches('select[data-key="bookingStatus"], select[data-key="broadcastStatus"]')) {
      const previous = event.target.dataset.previousValue ?? event.target.value;
      if (/^Paused$/i.test(event.target.value) || /^Paused until verified$/i.test(event.target.value)) {
        if (!window.confirm('This pauses a live business workflow. Continue?')) { event.target.value = previous; return; }
      }
      event.target.dataset.previousValue = event.target.value;
      markDirty();
    } else if (event.target.matches('select, input[type="file"]')) markDirty();
  });
  const activate = (name) => {
    document.querySelectorAll('[data-tab]').forEach((button) => {
      const selected = button.dataset.tab === name;
      button.classList.toggle('active', selected);
      button.setAttribute('aria-selected', String(selected));
    });
    document.querySelectorAll('[data-section]').forEach((section) => {
      section.hidden = section.dataset.section !== name;
    });
  };
  document.addEventListener('click', (event) => {
    const button = event.target.closest?.('[data-tab]');
    if (button && !button.disabled) {
      if (dirty && button.dataset.tab !== document.querySelector('[data-tab].active')?.dataset.tab && !window.confirm('You have unsaved changes. Leave this section without saving?')) return;
      activate(button.dataset.tab);
    }
  });
  document.querySelectorAll('[data-tab]').forEach((button) => {
    button.setAttribute('aria-controls', `${button.dataset.tab}-settings`);
  });
  document.querySelectorAll('[data-section]').forEach((section) => {
    section.id = `${section.dataset.section}-settings`;
  });
  activate(document.querySelector('[data-tab].active')?.dataset.tab || 'brand');
})();
