
// mobile nav
const burger = document.querySelector('.burger');
const nav = document.querySelector('.nav');
burger?.addEventListener('click', () => {
  nav.style.display = nav.style.display === 'flex' ? '' : 'flex';
});

// year
document.getElementById('year').textContent = new Date().getFullYear();

// filters build
const filtersEl = document.getElementById('filters');
const grid = document.getElementById('menuGrid');
const search = document.getElementById('menuSearch');

const categories = Object.keys(window.MENU_DATA);
let current = 'Alle';

function buildFilters() {
  const btnAll = document.createElement('button');
  btnAll.textContent = 'Alle';
  btnAll.className = 'active';
  btnAll.onclick = () => { setFilter('Alle'); };
  filtersEl.appendChild(btnAll);
  categories.forEach(cat => {
    const b = document.createElement('button');
    b.textContent = cat;
    b.onclick = () => { setFilter(cat); };
    filtersEl.appendChild(b);
  });
}
function setFilter(cat) {
  current = cat;
  filtersEl.querySelectorAll('button').forEach(b => b.classList.remove('active'));
  [...filtersEl.children].find(b => b.textContent === cat)?.classList.add('active');
  render();
}

function items() {
  const arr = [];
  for (const [cat, list] of Object.entries(window.MENU_DATA)) {
    list.forEach(it => arr.push({ ...it, category: cat }));
  }
  return arr;
}
function render() {
  const q = (search.value || '').toLowerCase();
  const all = items().filter(i => current === 'Alle' || i.category === current);
  const list = q ? all.filter(i => (i.name + ' ' + (i.desc || '') + ' ' + i.category).toLowerCase().includes(q)) : all;
  grid.innerHTML = '';
  list.forEach(it => {
    const el = document.createElement('article');
    el.className = 'menu-card';
    el.innerHTML = `
      <div class="tags"><span class="tag">${it.category}</span>${(it.allergens || []).slice(0, 3).map(a => `<span class="tag">Allergen ${a}</span>`).join('')}</div>
      <h4>${it.name}</h4>
      <p class="muted">${it.desc || ''}</p>
      <div class="menu-meta"><div class="price">${(it.price || 0).toFixed ? it.price.toFixed(2).replace('.', ',') : it.price} €</div>
      <button class="btn">Details</button></div>`;
    grid.appendChild(el);
  });
}
buildFilters();
render();
search?.addEventListener('input', render);

// === FULL-CARD FLIP для кожної .menu-card ===
(function () {
  const demoImage = 'assets/img/demo-dish.avif'; // одне фото для всіх

  const initFlip = () => {
    const cards = document.querySelectorAll('.menu-card');
    if (!cards.length) return;

    cards.forEach(card => {
      if (card.classList.contains('is-flip')) return;

      const content = card.innerHTML;

      // збираємо нову структуру: обидві сторони займають УСЮ картку
      card.classList.add('is-flip');
      card.innerHTML = `
        <div class="flip-inner">
          <div class="face front">
            ${content}
          </div>
          <div class="face back" aria-hidden="true"></div>
        </div>
      `;

      // підставляємо бек-фото
      const back = card.querySelector('.face.back');
      back.style.backgroundImage = `url("${demoImage}")`;

      // торк-пристрої: тап = переворот (не чіпаємо кліки по кнопках/лінках)
      card.addEventListener('click', (e) => {
        if (e.target.closest('a,button')) return;
        card.classList.toggle('flipped');
      });
    });
  };

  initFlip();

  // якщо грід меню наповнюється динамічно — ініціалізуємо повторно
  const grid = document.getElementById('menuGrid');
  if (grid) {
    const mo = new MutationObserver(() => initFlip());
    mo.observe(grid, { childList: true, subtree: true });
  }
})();

(function () {
  const grid = document.getElementById('menuGrid');
  if (!grid) return;

  const isHidden = el => {
    const cs = getComputedStyle(el);
    return cs.display === 'none' || cs.visibility === 'hidden' || el.offsetParent === null;
  };

  let rafId = null;
  const size = () => {
    cancelAnimationFrame(rafId);
    rafId = requestAnimationFrame(() => {
      const cs = getComputedStyle(grid);
      const rowH = parseFloat(cs.getPropertyValue('grid-auto-rows')) || 6;
      const gap = parseFloat(cs.getPropertyValue('row-gap')) || parseFloat(cs.getPropertyValue('gap')) || 16;

      grid.querySelectorAll('.menu-card').forEach(card => {
        if (isHidden(card)) { card.style.gridRowEnd = ''; return; }

        const inner = card.querySelector('.flip-inner') || card;
        // беремо максимально надійну висоту контенту
        const h = Math.max(inner.scrollHeight, inner.offsetHeight);
        const span = Math.ceil((h + gap) / (rowH + gap));
        card.style.gridRowEnd = `span ${span}`;
      });
    });
  };

  // первинний підрахунок
  window.addEventListener('load', size);
  window.addEventListener('resize', size);

  // коли шрифти домальовуються — текст змінює висоту
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(size).catch(() => { });
  }

  // якщо твій рендер меню міняє DOM — перерахувати
  const mo = new MutationObserver(size);
  mo.observe(grid, { childList: true, subtree: true });

  // якщо вміст/висота окремих карток змінюється
  const ro = new ResizeObserver(size);
  new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) ro.observe(e.target); });
  }, { root: null, threshold: 0.01 })
    .observe(grid);

  // якщо у тебе є функція renderMenu(..) — викликай size() відразу після рендера
  // renderMenu(...); size();
})();

// ToTop: автододавання кнопки + показ після скролу
(function () {
  function ensureBtn() {
    let btn = document.getElementById('toTop');
    if (!btn) {
      btn = document.createElement('button');
      btn.id = 'toTop';
      btn.className = 'to-top';
      btn.setAttribute('aria-label', 'Nach oben');
      btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M12 5l-6 6m6-6l6 6M12 5v14"
            stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;
      document.body.appendChild(btn);
    }

    const toggle = () => btn.classList.toggle('show', window.scrollY > 400);
    window.addEventListener('scroll', toggle, { passive: true });
    toggle();

    btn.addEventListener('click', () => {
      try { window.scrollTo({ top: 0, behavior: 'smooth' }); }
      catch { window.scrollTo(0, 0); }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ensureBtn);
  } else {
    ensureBtn();
  }
})();

const y = document.getElementById('year');
if (y) y.textContent = new Date().getFullYear();