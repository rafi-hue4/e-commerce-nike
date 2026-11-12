export const ALLOWED_HOST = 'nike-makknzjs.myshopify.com';
const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });
export const fmtMoney = (v) => usd.format(v);

let variantIndex = new Map();
let bagEntries = [];
let toastTimer = null;

function validateCatalog(cat) {
  if (!cat || !Array.isArray(cat.items)) throw new Error('The product list could not load.');
  const map = new Map();
  for (const item of cat.items) {
    if (
      typeof item.id !== 'string' ||
      typeof item.name !== 'string' ||
      typeof item.price !== 'number' ||
      !Number.isFinite(item.price) ||
      item.price < 0 ||
      !Array.isArray(item.variants)
    ) {
      throw new Error('The product list is unavailable.');
    }
    for (const v of item.variants) {
      if (
        !Number.isSafeInteger(v.id) ||
        typeof v.a !== 'boolean' ||
        !Array.isArray(v.o) ||
        v.o.some((x) => typeof x !== 'string')
      ) {
        throw new Error('The product list is unavailable.');
      }
      map.set(v.id, { item, variant: v });
    }
  }
  return map;
}

const bagDialog = document.getElementById('bag-dialog');
const bagItemsEl = document.getElementById('bag-items');
const bagTotalEl = document.getElementById('bag-total');
const exportBagBtn = document.getElementById('export-bag');
const openBagBtn = document.getElementById('open-bag');
const closeBagBtn = document.getElementById('close-bag');
const bagStatusEl = document.getElementById('bag-status');

export function showToast(msg) {
  if (!bagStatusEl) return;
  clearTimeout(toastTimer);
  bagStatusEl.textContent = msg;
  bagStatusEl.classList.add('is-on');
  toastTimer = setTimeout(() => {
    bagStatusEl.classList.remove('is-on');
  }, 2500);
}

function updateCartCount() {
  const totalQty = bagEntries.reduce((sum, e) => sum + e.quantity, 0);
  document.querySelectorAll('[data-cart-count]').forEach((el) => {
    el.textContent = String(totalQty);
  });
}

function renderBag() {
  updateCartCount();
  if (!bagItemsEl || !bagTotalEl || !exportBagBtn) return;
  bagItemsEl.innerHTML = '';

  if (bagEntries.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'bag-note';
    empty.textContent = 'Your styling bag is empty. Choose a size beside a piece to save it.';
    bagItemsEl.appendChild(empty);
    bagTotalEl.textContent = '';
    exportBagBtn.disabled = true;
    return;
  }

  let subtotal = 0;
  exportBagBtn.disabled = false;

  for (const entry of bagEntries) {
    const hit = variantIndex.get(entry.id);
    if (!hit) continue;
    const { item, variant } = hit;
    const u = new URL(item.url);
    if (u.hostname !== ALLOWED_HOST) {
      throw new Error('Unexpected product domain.');
    }
    subtotal += item.price * entry.quantity;

    const row = document.createElement('div');
    row.className = 'bag-row';

    const img = document.createElement('img');
    img.src = item.image;
    img.alt = item.name;
    img.width = 60;
    img.height = 80;
    img.loading = 'lazy';
    img.decoding = 'async';

    const info = document.createElement('div');
    info.className = 'bag-row-info';

    const title = document.createElement('h3');
    title.textContent = item.name;

    const meta = document.createElement('p');
    meta.textContent = `Size ${variant.o.join(' / ')} · Quantity ${entry.quantity} · ${fmtMoney(item.price)}`;

    const link = document.createElement('a');
    link.href = u.href;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = 'View original piece ↗';

    info.append(title, meta, link);

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'bag-remove';
    removeBtn.setAttribute('aria-label', `Remove ${item.name}`);
    removeBtn.textContent = '×';
    removeBtn.addEventListener('click', async () => {
      try {
        const res = await fetch(`/api/bag/items/${entry.id}`, { method: 'DELETE', credentials: 'same-origin' });
        if (!res.ok) throw new Error('Delete failed');
        const data = await res.json();
        bagEntries = Array.isArray(data.items) ? data.items : [];
        renderBag();
      } catch {
        showToast('Could not remove piece. Please try again.');
      }
    });

    row.append(img, info, removeBtn);
    bagItemsEl.appendChild(row);
  }

  bagTotalEl.textContent = `Reference subtotal ${fmtMoney(subtotal)}`;
}

export const readyPromise = (async () => {
  const [catRes, bagRes] = await Promise.all([
    fetch('/api/catalog', { credentials: 'same-origin' }),
    fetch('/api/bag', { credentials: 'same-origin' })
  ]);
  if (!catRes.ok) throw new Error('The product list could not load.');
  const cat = await catRes.json();
  variantIndex = validateCatalog(cat);
  if (bagRes.ok) {
    const data = await bagRes.json();
    if (Array.isArray(data.items)) bagEntries = data.items;
  }
  renderBag();
  return cat;
})().catch((err) => {
  console.error(err);
  renderBag();
  return null;
});

export const StylingBag = {
  async add(items) {
    await readyPromise;
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Please choose an available size.');
    }
    const res = await fetch('/api/bag/items', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data.error || 'Couldn’t add to bag. Please try again.');
    }
    bagEntries = Array.isArray(data.items) ? data.items : [];
    renderBag();
    showToast(items.length === 1 ? 'Piece saved to your styling bag' : 'Look saved to your styling bag');
  }
};

if (openBagBtn && bagDialog) {
  openBagBtn.addEventListener('click', async () => {
    await readyPromise;
    renderBag();
    if (typeof bagDialog.showModal === 'function') bagDialog.showModal();
    else bagDialog.setAttribute('open', '');
  });
}

if (closeBagBtn && bagDialog) {
  closeBagBtn.addEventListener('click', () => {
    if (typeof bagDialog.close === 'function') bagDialog.close();
    else bagDialog.removeAttribute('open');
  });
}

if (bagDialog) {
  bagDialog.addEventListener('click', (e) => {
    if (e.target !== bagDialog) return;
    const r = bagDialog.getBoundingClientRect();
    if (e.clientX === 0 && e.clientY === 0) return;
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) {
      if (typeof bagDialog.close === 'function') bagDialog.close();
      else bagDialog.removeAttribute('open');
    }
  });
}

if (exportBagBtn) {
  exportBagBtn.addEventListener('click', async () => {
    if (bagEntries.length === 0) return;
    try {
      const res = await fetch('/api/bag/export', { credentials: 'same-origin' });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'runway-outfit-shortlist.txt';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      showToast('Could not download shortlist.');
    }
  });
}
