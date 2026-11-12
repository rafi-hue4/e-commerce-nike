import { fmtMoney } from './bag.js';

const SECTION_TOKEN = 'template--28035983671601__the_runway_wdM8BG';

const LOOK_META = [
  {
    key: 'bndthK',
    model640: 'https://reel-ref-try-the-look.vercel.app/assets/model-1-640.webp',
    pins: [
      { left: '47%', top: '27%' },
      { left: '48%', top: '58%' },
      { left: '45%', top: '96%' }
    ],
    items: [
      { isNew: false, vendor: 'Nikey | Password: 1', optName: 'Shoe size' },
      { isNew: false, vendor: 'Nike', optName: 'Size' },
      { isNew: false, vendor: 'Nike', optName: 'Size' }
    ]
  },
  {
    key: 'XckgG6',
    model640: 'https://reel-ref-try-the-look.vercel.app/assets/model-5-640.webp',
    pins: [
      { left: '50%', top: '28%' },
      { left: '48%', top: '58%' },
      { left: '45%', top: '88%' }
    ],
    items: [
      { isNew: false, vendor: 'Nikey | Password: 1', optName: 'Shoe size' },
      { isNew: true, vendor: 'Nike', optName: 'Size' },
      { isNew: false, vendor: 'Nike', optName: 'Size' }
    ]
  },
  {
    key: 'rLfAhC',
    model640: 'https://reel-ref-try-the-look.vercel.app/assets/model-4-640.webp',
    pins: [
      { left: '50%', top: '28%' },
      { left: '48%', top: '58%' },
      { left: '45%', top: '88%' }
    ],
    items: [
      { isNew: false, vendor: 'Nike', optName: 'Size' },
      { isNew: true, vendor: 'Nikey | Password: 1', optName: 'Shoe size' },
      { isNew: false, vendor: 'Nike', optName: 'Size' }
    ]
  },
  {
    key: 'FKg67q',
    model640: 'https://reel-ref-try-the-look.vercel.app/assets/model-6-640.webp',
    pins: [
      { left: '50%', top: '28%' },
      { left: '48%', top: '58%' },
      { left: '45%', top: '88%' }
    ],
    items: [
      { isNew: false, vendor: 'Nike', optName: 'Size' },
      { isNew: false, vendor: 'Nikey | Password: 1', optName: 'Shoe size' },
      { isNew: false, vendor: 'Nike', optName: 'Size' }
    ]
  },
  {
    key: '8KREEE',
    model640: 'https://reel-ref-try-the-look.vercel.app/assets/model-3-640.webp',
    pins: [
      { left: '50%', top: '28%' },
      { left: '48%', top: '58%' },
      { left: '45%', top: '88%' }
    ],
    items: [
      { isNew: false, vendor: 'Nike', optName: 'Size' },
      { isNew: false, vendor: 'Nikey | Password: 1', optName: 'Shoe size' },
      { isNew: false, vendor: 'Nike', optName: 'Size' }
    ]
  },
  {
    key: 'N3bfm9',
    model640: 'https://reel-ref-try-the-look.vercel.app/assets/model-2-640.webp',
    pins: [
      { left: '50%', top: '28%' },
      { left: '48%', top: '58%' },
      { left: '45%', top: '88%' }
    ],
    items: [
      { isNew: false, vendor: 'Nike', optName: 'Size' },
      { isNew: false, vendor: 'Nikey | Password: 1', optName: 'Shoe size' },
      { isNew: false, vendor: 'Nike', optName: 'Size' }
    ]
  }
];

function svg(attrs, paths) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  for (const d of paths) {
    const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    p.setAttribute('d', d);
    el.appendChild(p);
  }
  return el;
}

function createModelImg(src640, src1080, alt) {
  const img = document.createElement('img');
  img.src = src640;
  img.srcset = `${src640} 640w, ${src1080} 1080w`;
  img.sizes = '(min-width: 1800px) 540px, (min-width: 750px) 420px, 320px';
  img.loading = 'eager';
  img.decoding = 'async';
  img.width = 1100;
  img.height = 1956;
  img.draggable = false;
  img.setAttribute('data-model-image', '');
  img.alt = alt;
  return img;
}

export function buildRunwayDom(catalog) {
  const section = document.querySelector('runway-section');
  if (!section || !catalog || !Array.isArray(catalog.looks) || !Array.isArray(catalog.items)) return;

  const itemMap = new Map(catalog.items.map((it) => [it.id, it]));
  const actorsEl = section.querySelector('[data-rw-actors]');
  const heroesEl = section.querySelector('[data-rw-heroes]');
  const ticksEl = section.querySelector('.rw__ticks');
  const panelInner = section.querySelector('.rw__panel-inner');
  if (!actorsEl || !heroesEl || !ticksEl || !panelInner) return;

  actorsEl.innerHTML = '';
  heroesEl.innerHTML = '';
  ticksEl.innerHTML = '';
  panelInner.querySelectorAll('[data-rw-panel]').forEach((el) => el.remove());

  catalog.looks.forEach((look, idx) => {
    const meta = LOOK_META[idx];
    if (!meta) return;
    const products = look.products.map((id) => itemMap.get(id)).filter(Boolean);
    const numStr = String(idx + 1).padStart(2, '0');

    // 1. Queue body (.rw__model)
    const model = document.createElement('div');
    model.className = 'rw__model';
    model.setAttribute('data-rw-model', '');
    model.dataset.index = String(idx);
    model.setAttribute('aria-hidden', 'true');

    const mShadow = document.createElement('span');
    mShadow.className = 'rw__shadow';
    const mFig = document.createElement('div');
    mFig.className = 'rw__figure';
    mFig.style.setProperty('--rw-ar', '0.5625');
    const mArt = document.createElement('div');
    mArt.className = 'rw__art';
    const mHit = document.createElement('button');
    mHit.type = 'button';
    mHit.className = 'rw__hit';
    mHit.setAttribute('data-rw-go', String(idx));
    mHit.setAttribute('aria-label', `Look ${idx + 1}: ${look.name}`);
    mHit.tabIndex = -1;
    mArt.append(createModelImg(meta.model640, look.image, look.name), mHit);
    mFig.appendChild(mArt);
    model.append(mShadow, mFig);
    actorsEl.appendChild(model);

    // 2. Hero (.rw__hero) + pins
    const hero = document.createElement('div');
    hero.className = idx === 0 ? 'rw__hero is-on' : 'rw__hero';
    hero.setAttribute('data-rw-hero', '');
    hero.dataset.index = String(idx);
    hero.dataset.name = look.name;
    hero.dataset.label = `Look ${idx + 1}: ${look.name}`;
    hero.dataset.probe = meta.model640;

    const hMorph = document.createElement('div');
    hMorph.className = 'rw__morph';
    const hShadow = document.createElement('span');
    hShadow.className = 'rw__shadow';
    const hFig = document.createElement('div');
    hFig.className = 'rw__figure';
    hFig.style.setProperty('--rw-ar', '0.5625');
    const hArt = document.createElement('div');
    hArt.className = 'rw__art';

    const zoomBtn = document.createElement('button');
    zoomBtn.type = 'button';
    zoomBtn.className = 'rw__zoom';
    zoomBtn.setAttribute('data-rw-zoom', '');
    zoomBtn.setAttribute('aria-label', `View look: ${look.name}`);
    zoomBtn.tabIndex = idx === 0 ? 0 : -1;

    const pinsWrap = document.createElement('div');
    pinsWrap.className = 'rw__pins';
    products.forEach((prod, pIdx) => {
      const pMeta = meta.pins[pIdx] || { left: '50%', top: '50%' };
      const pinBtn = document.createElement('button');
      pinBtn.type = 'button';
      pinBtn.className = 'rw__pin';
      pinBtn.setAttribute('data-rw-pin', String(pIdx + 1));
      pinBtn.dataset.tip = prod.name;
      pinBtn.style.left = pMeta.left;
      pinBtn.style.top = pMeta.top;
      pinBtn.style.setProperty('--pi', String(pIdx + 1));
      pinBtn.setAttribute('aria-label', `${pIdx + 1}: ${prod.name}`);
      pinBtn.tabIndex = -1;
      const dot = document.createElement('span');
      dot.className = 'rw__pin-dot';
      dot.textContent = String(pIdx + 1);
      pinBtn.appendChild(dot);
      pinsWrap.appendChild(pinBtn);
    });

    hArt.append(createModelImg(meta.model640, look.image, look.name), zoomBtn, pinsWrap);
    hFig.appendChild(hArt);
    hMorph.append(hShadow, hFig);
    hero.appendChild(hMorph);
    heroesEl.appendChild(hero);

    // 3. Progress tick
    const tick = document.createElement('button');
    tick.type = 'button';
    tick.className = 'rw__tick';
    tick.setAttribute('data-rw-tick', String(idx));
    tick.setAttribute('aria-label', `Look ${idx + 1}: ${look.name}`);
    tick.setAttribute('aria-current', idx === 0 ? 'true' : 'false');
    const bar = document.createElement('span');
    bar.className = 'rw__tick-bar';
    const tLabel = document.createElement('span');
    tLabel.className = 'rw__tick-label';
    const tName = document.createElement('span');
    tName.className = 'rw__tick-name';
    tName.textContent = `\u00A0\u00A0${look.name}`;
    tLabel.append(document.createTextNode(numStr), tName);
    tick.append(bar, tLabel);
    ticksEl.appendChild(tick);

    // 4. Right-hand panel
    const panel = document.createElement('div');
    panel.className = idx === 0 ? 'rw__look-panel is-in' : 'rw__look-panel';
    panel.setAttribute('data-rw-panel', String(idx));
    if (idx !== 0) panel.hidden = true;

    const mhead = document.createElement('div');
    mhead.className = 'rw__mhead';
    const mName = document.createElement('span');
    mName.className = 'rw__mhead-title';
    mName.textContent = look.name;
    const mCount = document.createElement('span');
    mCount.className = 'rw__label';
    mCount.textContent = `${products.length} pieces`;
    mhead.append(mName, mCount);
    panel.appendChild(mhead);

    const list = document.createElement('ul');
    list.className = 'rw__items';
    list.setAttribute('role', 'list');

    let subtotal = 0;
    products.forEach((prod, pIdx) => {
      subtotal += prod.price;
      const cardNum = pIdx + 1;
      const iMeta = meta.items[pIdx] || { isNew: false, vendor: 'Nike', optName: 'Size' };
      const isShoe = iMeta.optName === 'Shoe size';
      const pickerId = `Picker-${SECTION_TOKEN}-look_${meta.key}-${cardNum}`;

      const li = document.createElement('li');
      li.className = 'rw__item';
      li.setAttribute('data-rw-card', String(cardNum));
      li.style.setProperty('--i', String(cardNum));
      li.dataset.title = prod.name;

      const media = document.createElement('a');
      media.className = 'rw__media';
      media.href = prod.url;
      media.target = '_blank';
      media.rel = 'noopener noreferrer';
      media.tabIndex = -1;
      media.setAttribute('aria-hidden', 'true');

      const thumb = document.createElement('img');
      thumb.src = prod.image;
      thumb.width = 400;
      thumb.height = isShoe ? 400 : 563;
      thumb.loading = 'lazy';
      thumb.decoding = 'async';
      thumb.alt = '';
      media.appendChild(thumb);

      if (iMeta.isNew) {
        const tag = document.createElement('span');
        tag.className = 'rw__tag';
        tag.textContent = 'New';
        media.appendChild(tag);
      }

      const numBadge = document.createElement('span');
      numBadge.className = 'rw__num';
      numBadge.textContent = String(cardNum);
      media.appendChild(numBadge);

      const info = document.createElement('div');
      info.className = 'rw__info';
      const vendor = document.createElement('span');
      vendor.className = 'rw__type';
      vendor.textContent = iMeta.vendor;
      const nameLink = document.createElement('a');
      nameLink.className = 'rw__name';
      nameLink.href = prod.url;
      nameLink.target = '_blank';
      nameLink.rel = 'noopener noreferrer';
      nameLink.textContent = prod.name;
      const priceWrap = document.createElement('span');
      priceWrap.className = 'rw__price';
      const priceSpan = document.createElement('span');
      priceSpan.textContent = fmtMoney(prod.price);
      priceWrap.appendChild(priceSpan);
      info.append(vendor, nameLink, priceWrap);

      const addBtn = document.createElement('button');
      addBtn.type = 'button';
      addBtn.className = 'rw__add';
      addBtn.setAttribute('data-rw-add', '');
      addBtn.setAttribute('aria-expanded', 'false');
      addBtn.setAttribute('aria-controls', pickerId);
      addBtn.setAttribute('aria-label', `Add to bag: ${prod.name}`);
      addBtn.dataset.addedLabel = `Added to bag: ${prod.name}`;
      addBtn.append(
        svg({ class: 'rw__plus', width: '20', height: '20', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.3', 'stroke-linecap': 'round', 'aria-hidden': 'true' }, ['M12 4v16M4 12h16']),
        svg({ class: 'rw__check', width: '20', height: '20', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' }, ['M4.5 12.5l5 5L19.5 7']),
        svg({ class: 'rw__spin', width: '18', height: '18', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'round', 'aria-hidden': 'true' }, ['M12 3a9 9 0 1 1-9 9'])
      );

      // Picker
      const picker = document.createElement('div');
      picker.className = 'rw__picker';
      picker.id = pickerId;
      picker.setAttribute('data-rw-picker', '');
      picker.hidden = true;

      const variantsScript = document.createElement('script');
      variantsScript.type = 'application/json';
      variantsScript.setAttribute('data-rw-variants', '');
      variantsScript.textContent = JSON.stringify(prod.variants);

      const pHead = document.createElement('div');
      pHead.className = 'rw__picker-head';
      const pThumb = document.createElement('img');
      pThumb.className = 'rw__picker-thumb';
      pThumb.src = prod.image;
      pThumb.width = 160;
      pThumb.height = isShoe ? 160 : 225;
      pThumb.loading = 'lazy';
      pThumb.decoding = 'async';
      pThumb.alt = '';
      const pMeta = document.createElement('div');
      pMeta.className = 'rw__picker-meta';
      const pTitle = document.createElement('span');
      pTitle.className = 'rw__picker-title';
      pTitle.textContent = prod.name;
      const pPrice = document.createElement('span');
      pPrice.className = 'rw__picker-price';
      pPrice.textContent = fmtMoney(prod.price);
      pMeta.append(pTitle, pPrice);
      const pClose = document.createElement('button');
      pClose.type = 'button';
      pClose.className = 'rw__pick-close';
      pClose.setAttribute('data-rw-pick-close', '');
      pClose.setAttribute('aria-label', 'Close');
      pClose.appendChild(svg({ width: '16', height: '16', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.5', 'stroke-linecap': 'round', 'aria-hidden': 'true' }, ['M5 5l14 14M19 5L5 19']));
      pHead.append(pThumb, pMeta, pClose);

      const fieldset = document.createElement('fieldset');
      fieldset.className = 'rw__opt';
      const legend = document.createElement('legend');
      legend.className = 'rw__opt-name';
      legend.textContent = iMeta.optName;
      const values = document.createElement('div');
      values.className = 'rw__opt-values';
      prod.sizes.forEach((sz, sIdx) => {
        const label = document.createElement('label');
        label.className = 'rw__pill';
        const input = document.createElement('input');
        input.type = 'radio';
        input.name = `Opt-${SECTION_TOKEN}-look_${meta.key}-${cardNum}-1`;
        input.value = sz;
        input.setAttribute('data-rw-option', '0');
        if (sIdx === 0) input.checked = true;
        const span = document.createElement('span');
        span.className = 'rw__pill-label';
        span.textContent = sz;
        label.append(input, span);
        values.appendChild(label);
      });
      fieldset.append(legend, values);

      const confirm = document.createElement('button');
      confirm.type = 'button';
      confirm.className = 'rw__confirm';
      confirm.setAttribute('data-rw-confirm', '');
      const cLabel = document.createElement('span');
      cLabel.setAttribute('data-rw-confirm-label', '');
      cLabel.dataset.add = 'Add to bag';
      cLabel.textContent = 'Add to bag';
      const cSr = document.createElement('span');
      cSr.className = 'rw__sr';
      cSr.textContent = ` — ${prod.name}`;
      confirm.append(cLabel, cSr);

      picker.append(variantsScript, pHead, fieldset, confirm);
      li.append(media, info, addBtn, picker);
      list.appendChild(li);
    });

    panel.appendChild(list);

    // Bundle footer
    const discounted = subtotal * 0.9;
    const bundle = document.createElement('div');
    bundle.className = 'rw__bundle has-rule';
    const msg = document.createElement('p');
    msg.className = 'rw__msg';
    msg.setAttribute('data-rw-msg', '');
    msg.setAttribute('role', 'status');
    msg.setAttribute('aria-live', 'polite');

    const bRow = document.createElement('div');
    bRow.className = 'rw__bundle-row';
    const bCopy = document.createElement('div');
    bCopy.className = 'rw__bundle-copy';
    const bTitle = document.createElement('span');
    bTitle.className = 'rw__bundle-title';
    bTitle.textContent = 'Complete the look';
    const bNote = document.createElement('span');
    bNote.className = 'rw__bundle-note';
    bNote.textContent = `Bundle all ${products.length} and save 10%`;
    bCopy.append(bTitle, bNote);
    const bPrice = document.createElement('div');
    bPrice.className = 'rw__bundle-price';
    const bOld = document.createElement('s');
    bOld.textContent = fmtMoney(subtotal);
    const bNew = document.createElement('strong');
    bNew.textContent = fmtMoney(discounted);
    bPrice.append(bOld, bNew);
    bRow.append(bCopy, bPrice);

    const cta = document.createElement('button');
    cta.type = 'button';
    cta.className = 'rw__cta';
    cta.setAttribute('data-rw-all', '');
    const cAdd = document.createElement('span');
    cAdd.className = 'rw__cta-add';
    cAdd.textContent = 'Add full look to bag';
    const cMob = document.createElement('span');
    cMob.className = 'rw__cta-m';
    cMob.textContent = `Add full look — ${fmtMoney(discounted)}`;
    const cDone = document.createElement('span');
    cDone.className = 'rw__cta-done';
    cDone.textContent = 'Full look in your bag';
    cta.append(
      cAdd,
      cMob,
      cDone,
      svg({ class: 'rw__cta-arrow', width: '22', height: '12', viewBox: '0 0 26 14', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.4', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true' }, ['M1 7h24M19 1l6 6-6 6']),
      svg({ class: 'rw__cta-spin', width: '16', height: '16', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '1.8', 'stroke-linecap': 'round', 'aria-hidden': 'true' }, ['M12 3a9 9 0 1 1-9 9'])
    );

    bundle.append(msg, bRow, cta);
    panel.appendChild(bundle);

    const tpl = document.createElement('template');
    tpl.setAttribute('data-rw-pieces-text', '');
    tpl.content.textContent = `${products.length} pieces`;
    panel.appendChild(tpl);

    panelInner.appendChild(panel);
  });
}
