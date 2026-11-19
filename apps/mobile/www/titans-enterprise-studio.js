'use strict';
const search = document.querySelector('#product-search');
const cards = [...document.querySelectorAll('#product-grid .product-card')];
const empty = document.querySelector('#no-products');
if (search) {
  search.addEventListener('input', () => {
    const query = search.value.trim().toLocaleLowerCase('it');
    let visible = 0;
    for (const card of cards) {
      const haystack = (card.dataset.search + ' ' + card.textContent).toLocaleLowerCase('it');
      const match = haystack.includes(query);
      card.hidden = !match;
      if (match) visible += 1;
    }
    if (empty) empty.hidden = visible !== 0;
  });
}
const navLinks = [...document.querySelectorAll('.nav-link')];
for (const link of navLinks) {
  link.addEventListener('click', () => {
    for (const item of navLinks) {
      item.classList.remove('active');
      item.removeAttribute('aria-current');
    }
    link.classList.add('active');
    link.setAttribute('aria-current', 'location');
  });
}