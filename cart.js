(() => {
  const key = 'michelles-quote-cart';
  const items = JSON.parse(localStorage.getItem(key) || '[]');
  const save = () => localStorage.setItem(key, JSON.stringify(items));
  const label = (name) => name.replace(/\s+/g, ' ').trim();
  const render = () => {
    let panel = document.querySelector('.quote-cart');
    if (!panel) {
      panel = document.createElement('aside');
      panel.className = 'quote-cart';
      panel.setAttribute('aria-live', 'polite');
      document.body.append(panel);
    }
    panel.innerHTML = `<strong>Your menu selections</strong>${items.length ? `<ul>${items.map((item, i) => `<li>${label(item)} <button type="button" data-remove="${i}" aria-label="Remove ${label(item)}">×</button></li>`).join('')}</ul><a class="button button-dark" href="../../index.html#inquire">Continue to quote</a>` : '<p>No menu selections yet.</p>'}`;
    panel.querySelectorAll('[data-remove]').forEach((button) => button.addEventListener('click', () => { items.splice(Number(button.dataset.remove), 1); save(); render(); }));
  };
  document.querySelectorAll('.meal-option').forEach((option) => {
    const name = option.querySelector('h2')?.textContent || 'Menu selection';
    const photo = name.startsWith('Jamaican') ? '../../assets/images/jamaican-classics-real.jpg' : name.startsWith('Celebration') ? '../../assets/images/catering-gathering-live.jpg' : name.startsWith('Office') ? '../../assets/images/catering-buffet-real.jpg' : '';
    if (photo && !option.querySelector('img')) { const image = document.createElement('img'); image.src = photo; image.alt = `${name} catering`; image.loading = 'eager'; option.prepend(image); }
    const action = document.createElement('button');
    action.type = 'button'; action.className = 'button button-outline'; action.textContent = 'Add to quote';
    action.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); items.push(name); save(); render(); });
    option.querySelector('div')?.append(action);
  });
  render();
})();
