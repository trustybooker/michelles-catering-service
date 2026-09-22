document.querySelectorAll('.photo-card img, .hero-art-image').forEach((image) => {
  if (image.alt.startsWith('A generous Jamaican celebration buffet')) image.src = 'assets/images/catering-gathering-live.jpg';
  if (image.alt.startsWith('Elegant Jamaican catering setup')) { image.src = 'assets/images/catering-buffet-real.jpg'; image.style.objectPosition = '72% center'; }
  const source = image.currentSrc || image.src;
  const preload = new Image();
  preload.onload = () => {
    if (image.closest('.photo-card')) {
      image.closest('.photo-card').style.backgroundImage = `url("${source}")`;
      image.closest('.photo-card').style.backgroundSize = 'cover';
      image.closest('.photo-card').style.backgroundPosition = 'center';
    }
  };
  preload.src = source;
});
const storyImage = document.querySelector('.story-image');
if (storyImage) storyImage.style.backgroundImage = "url('assets/images/catering-gathering-live.jpg')";
const dateField = document.querySelector('input[name="date"]');
if (dateField) dateField.min = new Date().toISOString().slice(0, 10);
const toggle = document.querySelector('.menu-toggle');
const links = document.querySelector('.nav-links');
toggle?.addEventListener('click', () => { const open = links.classList.toggle('open'); toggle.setAttribute('aria-expanded', String(open)); });
const inquiryForm = document.querySelector('.inquiry-form');
inquiryForm?.addEventListener('submit', async (event) => {
  event.preventDefault(); const form = event.currentTarget; const status = form.querySelector('.form-status'); const button = form.querySelector('button[type="submit"]'); const data = Object.fromEntries(new FormData(form)); const guests = Number(data.guests);
  if (!data.name?.trim() || !data.email?.trim() || !data.date || data.date < new Date().toISOString().slice(0, 10) || !data.eventType || !Number.isInteger(guests) || guests < 1 || guests > 1000) { status.textContent = 'Please choose today or a future date and enter 1–1,000 guests.'; return; }
  button.disabled = true; button.textContent = 'Sending…'; const smsBody = `Michelle's Catering inquiry\nName: ${data.name}\nEmail: ${data.email}\nDate: ${data.date}\nGuests: ${data.guests}\nEvent: ${data.eventType}\nDetails: ${data.message || 'None provided'}`;
  try { if (!/^https?:$/.test(location.protocol)) throw new Error('Preview mode'); const response = await fetch('/api/inquiry', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); if (!response.ok) throw new Error('Inquiry service unavailable'); status.textContent = 'Thank you — Michelle’s team received your inquiry.'; form.reset(); } catch (error) { status.textContent = 'Opening a text message so your inquiry is not lost.'; window.location.href = `sms:+17722823269?body=${encodeURIComponent(smsBody)}`; } finally { button.disabled = false; button.innerHTML = 'Request a quote <span>↗</span>'; }
});
const conciergeToggle = document.querySelector('.concierge-toggle'), conciergePanel = document.querySelector('.concierge-panel'), conciergeClose = document.querySelector('.concierge-close'), voiceToggle = document.querySelector('.voice-toggle'), transcriptButton = document.querySelector('.transcript-button'); let voiceEnabled = false;
const transcript = [['Michelle’s concierge', 'Hi! I can help with menus, events, service areas, payments, and planning. What are you looking for?']];
const answers = { menu: 'Michelle serves Jamaican favorites like jerk chicken, oxtail, curry goat, brown stew, and rice and peas, plus global comfort food for your event.', area: 'Michelle serves Port St. Lucie, Stuart, Vero Beach, and surrounding Treasure Coast communities. Call to confirm your exact location.', events: 'We cater weddings, birthdays, graduations, family reunions, corporate events, office lunches, private dinners, and celebration buffets.', payment: 'Zelle, Cash App, and cash are available by arrangement. Payment details are provided after your quote is confirmed.', contact: 'Call Michelle at (772) 282-3269, or use the event form to prepare your date, guest count, event type, and details.', quote: 'To request a quote, share your date, guest count, event type, and location in the inquiry form, or call (772) 282-3269.' };
const answerQuestion = (input) => { const q = input.toLowerCase(); if (/menu|meal|serve|food|dish|jerk|oxtail|curry/.test(q)) return answers.menu; if (/where|area|location|port|stuart|vero|treasure/.test(q)) return answers.area; if (/event|wedding|party|office|birthday|reunion/.test(q)) return answers.events; if (/pay|zelle|cash app|cash|deposit/.test(q)) return answers.payment; if (/quote|book|reserve|availability|date/.test(q)) return answers.quote; if (/call|phone|contact|reach/.test(q)) return answers.contact; return 'I can help with menus, service areas, event types, payment options, quotes, and contacting Michelle. Try one of those topics or call (772) 282-3269.'; };
const speak = (text) => { if (voiceEnabled && 'speechSynthesis' in window) { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(text)); } };
const addConciergeMessage = (question, answer) => { const messages = document.querySelector('.concierge-messages'); if (!messages) return; const user = document.createElement('div'); user.className = 'user-message'; user.textContent = question; const reply = document.createElement('div'); reply.className = 'bot-message'; reply.textContent = answer; messages.append(user, reply); transcript.push(['Visitor', question], ['Michelle’s concierge', answer]); messages.scrollTop = messages.scrollHeight; speak(answer); };
const closeConcierge = () => { if (conciergePanel) conciergePanel.hidden = true; conciergeToggle?.setAttribute('aria-expanded', 'false'); };
conciergeToggle?.addEventListener('click', () => { conciergePanel.hidden = false; conciergeToggle.setAttribute('aria-expanded', 'true'); }); conciergeClose?.addEventListener('click', closeConcierge);
voiceToggle?.addEventListener('click', () => { voiceEnabled = !voiceEnabled; voiceToggle.setAttribute('aria-pressed', String(voiceEnabled)); voiceToggle.textContent = voiceEnabled ? '🔈' : '🔊'; });
transcriptButton?.addEventListener('click', () => { const blob = new Blob([transcript.map(([speaker, text]) => `${speaker}: ${text}`).join('\n\n')], { type: 'text/plain' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = 'michelles-concierge-transcript.txt'; link.click(); setTimeout(() => URL.revokeObjectURL(link.href), 0); });
document.querySelectorAll('[data-question]').forEach((button) => button.addEventListener('click', () => addConciergeMessage(button.textContent, answers[button.dataset.question] || answers.quote)));
document.querySelector('.concierge-form')?.addEventListener('submit', (event) => { event.preventDefault(); const input = event.currentTarget.querySelector('input'); const value = input.value.trim().slice(0, 500); if (value) { addConciergeMessage(value, answerQuestion(value)); input.value = ''; input.focus(); } });
