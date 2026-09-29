(() => {
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
    if (button && !button.disabled) activate(button.dataset.tab);
  });
  document.querySelectorAll('[data-tab]').forEach((button) => {
    button.setAttribute('aria-controls', `${button.dataset.tab}-settings`);
  });
  document.querySelectorAll('[data-section]').forEach((section) => {
    section.id = `${section.dataset.section}-settings`;
  });
  activate(document.querySelector('[data-tab].active')?.dataset.tab || 'brand');
})();
