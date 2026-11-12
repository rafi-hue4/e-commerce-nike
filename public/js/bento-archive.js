import { ALLOWED_HOST, StylingBag, fmtMoney, showToast } from './bag.js';

export function initBentoArchive(cat) {
  renderBentoArchive(cat);
}

const bentoGrid = document.getElementById('bento-grid');
const filterBar = document.querySelector('.bento-filters');
const filterIndicator = document.querySelector('.bento-filter-indicator');
const footerOpenBagBtn = document.getElementById('footer-open-bag');

function updateFilterIndicator(activeBtn) {
  if (!filterIndicator || !activeBtn) return;
  filterIndicator.style.width = `${activeBtn.offsetWidth}px`;
  filterIndicator.style.transform = `translateX(${activeBtn.offsetLeft - 4}px)`;
}

function renderBentoArchive(cat) {
  if (!bentoGrid || !cat || !Array.isArray(cat.looks) || !Array.isArray(cat.items)) return;
  bentoGrid.innerHTML = '';

  const featuredIndices = [0, 3];
  for (const lookIdx of featuredIndices) {
    const look = cat.looks[lookIdx];
    if (!look) continue;
    const card = document.createElement('article');
    card.className = 'bento-card';
    card.dataset.span = '2';
    card.dataset.category = 'looks';

    const media = document.createElement('div');
    media.className = 'bento-media';
    const badge = document.createElement('span');
    badge.className = 'bento-badge';
    badge.textContent = `Look 0${lookIdx + 1}`;
    const img = document.createElement('img');
    img.src = look.image;
    img.alt = look.name;
    img.loading = 'lazy';
    img.decoding = 'async';
    media.append(badge, img);

    const body = document.createElement('div');
    body.className = 'bento-body';
    const metaRow = document.createElement('div');
    metaRow.className = 'bento-meta-row';
    const type = document.createElement('span');
    type.className = 'bento-type';
    type.textContent = 'Runway Look · 3 Pieces';
    const price = document.createElement('span');
    price.className = 'bento-price';
    price.textContent = '$492.30 (10% Bundle)';
    metaRow.append(type, price);

    const title = document.createElement('h3');
    title.className = 'bento-name';
    title.textContent = look.name;

    const desc = document.createElement('p');
    desc.className = 'bento-desc';
    desc.textContent = look.description;

    const actions = document.createElement('div');
    actions.className = 'bento-actions';
    const jumpBtn = document.createElement('button');
    jumpBtn.type = 'button';
    jumpBtn.className = 'bento-btn-primary';
    jumpBtn.textContent = `Inspect Look 0${lookIdx + 1} on Runway ↑`;
    jumpBtn.addEventListener('click', () => {
      const rw = document.querySelector('runway-section');
      if (rw && typeof rw._go === 'function') rw._go(lookIdx);
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    });
    actions.appendChild(jumpBtn);

    body.append(metaRow, title, desc, actions);
    card.append(media, body);
    bentoGrid.appendChild(card);
  }

  for (const item of cat.items) {
    const isFootwear = item.sizes.some((s) => /^\d+$/.test(s));
    const card = document.createElement('article');
    card.className = 'bento-card';
    card.dataset.category = isFootwear ? 'footwear' : 'tops';

    const media = document.createElement('div');
    media.className = 'bento-media';
    const badge = document.createElement('span');
    badge.className = 'bento-badge';
    badge.textContent = isFootwear ? 'Footwear' : 'Apparel';
    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.name;
    img.loading = 'lazy';
    img.decoding = 'async';
    media.append(badge, img);

    const body = document.createElement('div');
    body.className = 'bento-body';
    const metaRow = document.createElement('div');
    metaRow.className = 'bento-meta-row';
    const type = document.createElement('span');
    type.className = 'bento-type';
    type.textContent = isFootwear ? 'Nikey | Password: 1' : 'Nike';
    const price = document.createElement('span');
    price.className = 'bento-price';
    price.textContent = fmtMoney(item.price);
    metaRow.append(type, price);

    const title = document.createElement('h3');
    title.className = 'bento-name';
    title.textContent = item.name;

    let selectedVariantId = item.variants.find((v) => v.a)?.id || null;
    const sizesWrap = document.createElement('div');
    sizesWrap.className = 'bento-sizes';
    sizesWrap.setAttribute('role', 'group');
    sizesWrap.setAttribute('aria-label', `${item.name} size`);

    item.variants.forEach((v, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'bento-size-btn';
      btn.textContent = v.o.join(' / ');
      btn.disabled = !v.a;
      btn.setAttribute('aria-pressed', idx === 0 && v.a ? 'true' : 'false');
      btn.addEventListener('click', () => {
        selectedVariantId = v.id;
        sizesWrap.querySelectorAll('.bento-size-btn').forEach((b) => b.setAttribute('aria-pressed', 'false'));
        btn.setAttribute('aria-pressed', 'true');
      });
      sizesWrap.appendChild(btn);
    });

    const actions = document.createElement('div');
    actions.className = 'bento-actions';
    const addBtn = document.createElement('button');
    addBtn.type = 'button';
    addBtn.className = 'bento-btn-primary';
    addBtn.textContent = 'Save to bag';
    addBtn.addEventListener('click', async () => {
      if (!selectedVariantId) return;
      addBtn.disabled = true;
      const prev = addBtn.textContent;
      addBtn.textContent = 'Saving…';
      try {
        await StylingBag.add([{ id: selectedVariantId, quantity: 1 }]);
        addBtn.textContent = 'Saved ✓';
        setTimeout(() => { addBtn.textContent = prev; }, 1400);
      } catch {
        addBtn.textContent = prev;
        showToast('Couldn’t add to bag. Please try again.');
      } finally {
        addBtn.disabled = false;
      }
    });

    const shopUrl = new URL(item.url);
    if (shopUrl.hostname === ALLOWED_HOST) {
      const link = document.createElement('a');
      link.className = 'bento-btn-ghost';
      link.href = shopUrl.href;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.textContent = 'Shop ↗';
      actions.append(addBtn, link);
    } else {
      actions.appendChild(addBtn);
    }

    body.append(metaRow, title, sizesWrap, actions);
    card.append(media, body);
    bentoGrid.appendChild(card);
  }

  bentoGrid.addEventListener('pointermove', (e) => {
    const card = e.target.closest('.bento-card');
    if (!card) return;
    const r = card.getBoundingClientRect();
    card.style.setProperty('--spot-x', `${(e.clientX - r.left).toFixed(1)}px`);
    card.style.setProperty('--spot-y', `${(e.clientY - r.top).toFixed(1)}px`);
  });
}

if (filterBar) {
  const filterBtns = [...filterBar.querySelectorAll('.bento-filter')];
  requestAnimationFrame(() => updateFilterIndicator(filterBtns[0]));
  window.addEventListener('resize', () => {
    const active = filterBar.querySelector('.bento-filter[aria-pressed="true"]');
    if (active) updateFilterIndicator(active);
  });
  filterBar.addEventListener('click', (e) => {
    const btn = e.target.closest('.bento-filter');
    if (!btn || !bentoGrid) return;
    const filter = btn.dataset.bentoFilter;
    filterBtns.forEach((b) => b.setAttribute('aria-pressed', b === btn ? 'true' : 'false'));
    updateFilterIndicator(btn);
    bentoGrid.querySelectorAll('.bento-card').forEach((card) => {
      card.hidden = filter !== 'all' && card.dataset.category !== filter;
    });
  });
}

const openBagBtn = document.getElementById('open-bag');
if (footerOpenBagBtn && openBagBtn) {
  footerOpenBagBtn.addEventListener('click', () => openBagBtn.click());
}
