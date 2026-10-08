(() => {
  const key = 'michelles-quote-cart';
  let items = [];
  try { const stored = JSON.parse(localStorage.getItem(key) || '[]'); if (Array.isArray(stored)) items = stored.filter((item) => typeof item === 'string').slice(0, 20); } catch { localStorage.removeItem(key); }
  const save = () => { try { localStorage.setItem(key, JSON.stringify(items)); return true; } catch { return false; } };
  const label = (name) => name.replace(/\s+/g, ' ').trim();
  const render = () => {
    let panel = document.querySelector('.quote-cart');
    if (!panel) {
      panel = document.createElement('aside');
      panel.className = 'quote-cart';
      panel.setAttribute('aria-live', 'polite');
      document.body.append(panel);
    }
    panel.replaceChildren();
    const heading = document.createElement('strong'); heading.textContent = 'Your menu selections'; panel.append(heading);
    if (!items.length) { const empty = document.createElement('p'); empty.textContent = 'No menu selections yet.'; panel.append(empty); return; }
    const list = document.createElement('ul');
    items.forEach((item, index) => { const row = document.createElement('li'); row.append(document.createTextNode(`${label(item)} `)); const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '×'; remove.dataset.remove = String(index); remove.setAttribute('aria-label', `Remove ${label(item)}`); remove.addEventListener('click', () => { items.splice(index, 1); save(); render(); }); row.append(remove); list.append(row); });
    panel.append(list); const continueLink = document.createElement('a'); continueLink.className = 'button button-dark'; continueLink.href = '../../index.html#inquire'; continueLink.textContent = 'Continue to quote'; panel.append(continueLink);
  };
  document.querySelectorAll('.meal-option').forEach((option) => {
    const name = option.querySelector('h2')?.textContent || 'Menu selection';
    const photo = name.startsWith('Jamaican') ? '../../assets/images/jamaican-classics-real.jpg' : name.startsWith('Celebration') ? '../../assets/images/catering-gathering-live.jpg' : name.startsWith('Office') ? '../../assets/images/catering-buffet-real.jpg' : '';
    if (photo && !option.querySelector('img')) { const image = document.createElement('img'); image.src = photo; image.alt = `${name} catering`; image.loading = 'eager'; option.prepend(image); }
    const action = document.createElement('button');
    action.type = 'button'; action.className = 'button button-outline'; action.textContent = 'Add to quote';
    action.addEventListener('click', (event) => { event.preventDefault(); event.stopPropagation(); if (!items.includes(name)) { items.push(name); save(); render(); } });
    option.querySelector('div')?.append(action);
  });
  render();
})();
