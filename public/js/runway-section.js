import { StylingBag } from './bag.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/* =========================================================
   <runway-section> Custom Element
   ========================================================= */
class RunwaySection extends HTMLElement {
  connectedCallback() {
    if (this._init) return;
    this._init = true;

    this._motionMq = window.matchMedia('(prefers-reduced-motion: reduce)');
    this._pointerMq = window.matchMedia('(hover: hover) and (pointer: fine)');
    this._reduced = this._motionMq.matches;

    this.classList.add('rw--js');

    this._stage = this.querySelector('[data-rw-stage]');
    this._actors = this.querySelector('[data-rw-actors]');
    this._heroesEl = this.querySelector('[data-rw-heroes]');
    this._heroes = [...this.querySelectorAll('[data-rw-hero]')];
    this._ticks = [...this.querySelectorAll('[data-rw-tick]')];
    this._panels = [...this.querySelectorAll('[data-rw-panel]')];
    this._panelWrap = this.querySelector('.rw__panel');
    this._piecesEl = this.querySelector('[data-rw-pieces]');
    this._liveEl = this.querySelector('[data-rw-live]');
    this._autoBtn = this.querySelector('[data-rw-auto]');
    this._cursorEl = this.querySelector('[data-rw-cursor]');
    this._lb = this.querySelector('[data-rw-lb]');
    this._lbStage = this.querySelector('[data-rw-lb-stage]');
    this._lbKicker = this.querySelector('[data-rw-lb-kicker]');
    this._lbName = this.querySelector('[data-rw-lb-name]');
    this._lbClose = this.querySelector('[data-rw-zoom-close]');
    this._headEl = this.querySelector('.rw__head');

    this._nLooks = this._heroes.length; // 6
    this._nBodies = this._nLooks * Math.ceil(8 / this._nLooks); // 12
    this._K = 95;
    this._C = 2 * Math.sqrt(this._K);
    this._startOffset = this._reduced ? 0 : 1.15;

    this._index = 0;
    this._target = 0;
    this._cur = -this._startOffset;
    this._vel = 0;
    this._still = false;
    this._visible = true;
    this._playing = false;
    this._engaged = false;
    this._panelHover = false;
    this._zoomed = false;
    this._dragging = false;
    this._suppressClickUntil = 0;
    this._wheelAcc = 0;
    this._wheelLockUntil = 0;

    this._latchedW = 0;
    this._latchedVh = 0;
    this._W = 0;
    this._H = 0;
    this._isPhone = false;
    this._mode = 'ring';
    this._fs = 1.08;
    this._unit = 300;

    this._raf = 0;
    this._lastTs = 0;
    this._autoTimer = 0;
    this._resizeTimer = 0;
    this._lbTimer = 0;
    this._cursorRaf = 0;

    this._sheetHost = null;
    this._activeSheetCard = null;

    // Clone original 6 bodies to 6..11
    const originals = [...this.querySelectorAll('[data-rw-model]')];
    for (let i = 0; i < originals.length; i++) {
      const clone = originals[i].cloneNode(true);
      clone.setAttribute('data-rw-clone', '');
      clone.setAttribute('aria-hidden', 'true');
      clone.querySelectorAll('img[data-model-image]').forEach((img) => {
        img.setAttribute('loading', 'lazy');
      });
      const hit = clone.querySelector('[data-rw-go]');
      if (hit) hit.tabIndex = -1;
      this._actors.appendChild(clone);
    }

    this._bodies = [...this.querySelectorAll('[data-rw-model]')].map((el, a) => ({
      el,
      hit: el.querySelector('[data-rw-go]'),
      index: Number(el.dataset.index),
      a,
      w: 0,
      lastFilter: '',
      x: a + this._startOffset,
      g: a + this._startOffset,
      v: 0,
      trip: false,
      from: a + this._startOffset,
      goal: a
    }));

    // Image decode watcher
    this.querySelectorAll('img[data-model-image]').forEach((img) => this._watchDecode(img));

    // Feet detection per look
    this._detectAllFeet();

    // Custom cursor setup
    if (this._pointerMq.matches && this._cursorEl) {
      this.classList.add('rw--cursor');
      this._cx = 0;
      this._cy = 0;
      this._tx = 0;
      this._ty = 0;
      this._cOn = false;
    } else if (this._cursorEl) {
      this._cursorEl.remove();
      this._cursorEl = null;
    }

    // Initialize all variant pickers cleanly (without marking touched)
    this.querySelectorAll('.rw__item').forEach((card) => this._syncPicker(card, true));

    // Measure + silent first look setup
    this._measure();
    this._setIndex(0, true);
    this._renderAll();

    // Intro reveal observer
    if (this._reduced) {
      this.classList.add('is-revealed');
    } else {
      this._revealObs = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                this.classList.add('is-revealed');
              });
            });
            this._revealObs.disconnect();
          }
        },
        { threshold: 0, rootMargin: '0px 0px -22% 0px' }
      );
      this._revealObs.observe(this);
    }

    // Visibility observer
    this._visObs = new IntersectionObserver(
      (entries) => {
        this._visible = entries.some((e) => e.isIntersecting);
        if (this._visible) {
          this._kick();
          if (this._playing) this._restartAutoBar();
        } else {
          this._stopRaf();
        }
      },
      { threshold: 0 }
    );
    this._visObs.observe(this);

    // Resize observers
    this._ro = new ResizeObserver(() => {
      this._measure();
      this._renderAll();
    });
    this._ro.observe(this._stage);

    this._bindEvents();
    this._kick();

    // Autoplay on init
    const isEditor = !!(window.Shopify && window.Shopify.designMode);
    if (isEditor) this.classList.add('rw--design');
    if (this.dataset.autoplay === 'true' && !this._reduced && !isEditor) {
      this._play(true);
    }
  }

  disconnectedCallback() {
    this._stopRaf();
    clearTimeout(this._autoTimer);
    clearTimeout(this._resizeTimer);
    clearTimeout(this._lbTimer);
    if (this._cursorRaf) cancelAnimationFrame(this._cursorRaf);
    if (this._revealObs) this._revealObs.disconnect();
    if (this._visObs) this._visObs.disconnect();
    if (this._ro) this._ro.disconnect();

    for (const [target, type, fn, opts] of this._listeners || []) {
      target.removeEventListener(type, fn, opts);
    }
    this._listeners = [];
    this._dockAllSheets();
    if (this._sheetHost) {
      this._sheetHost.remove();
      this._sheetHost = null;
    }
  }

  _on(target, type, fn, opts) {
    this._listeners = this._listeners || [];
    target.addEventListener(type, fn, opts);
    this._listeners.push([target, type, fn, opts]);
  }

  _watchDecode(img) {
    const done = () => img.classList.add('is-decoded');
    if (img.complete && img.naturalWidth > 0) {
      if (typeof img.decode === 'function') img.decode().then(done, done);
      else done();
      return;
    }
    if (typeof img.decode === 'function') {
      img.decode().then(done, () => {
        if (img.naturalWidth > 0) done();
      });
    }
    img.addEventListener('load', () => {
      if (img.naturalWidth > 0) done();
    }, { once: true });
  }

  _detectAllFeet() {
    this._heroes.forEach((hero, lookIdx) => {
      const url = hero.dataset.probe;
      if (!url) return;
      const probe = new Image();
      probe.crossOrigin = 'anonymous';
      probe.onload = () => {
        try {
          const w = 48;
          const h = Math.max(1, Math.round((w * probe.naturalHeight) / (probe.naturalWidth || 1)));
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) return;
          ctx.drawImage(probe, 0, 0, w, h);
          const data = ctx.getImageData(0, 0, w, h).data;
          let lastRow = h - 1;
          outer: for (let y = h - 1; y >= 0; y--) {
            const rowOffset = y * w * 4;
            for (let x = 0; x < w; x++) {
              if (data[rowOffset + x * 4 + 3] > 40) {
                lastRow = y;
                break outer;
              }
            }
          }
          const foot = clamp((h - 1 - lastRow) / h, 0, 0.4);
          const val = foot.toFixed(4);
          hero.style.setProperty('--rw-foot', val);
          for (const b of this._bodies) {
            if (b.index === lookIdx) b.el.style.setProperty('--rw-foot', val);
          }
        } catch {
          /* tainted canvas keeps 0 offset */
        }
      };
      probe.src = url;
    });
  }

  _measure() {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const prevPhone = this._isPhone;
    this._isPhone = vw <= 749;
    this._mode = this._isPhone ? (this.dataset.mstyle || 'classic') : (this.dataset.style || 'ring');

    if (prevPhone && !this._isPhone) {
      this._dockAllSheets();
    }

    let frameH;
    if (!this._isPhone) {
      let headerH = 0;
      document
        .querySelectorAll('.shopify-section-group-header-group, #shopify-section-header, #shopify-section-announcement-bar')
        .forEach((el) => {
          if (!el.contains(this) && el.offsetParent !== null) {
            headerH += el.getBoundingClientRect().height;
          }
        });
      frameH = Math.max(380, Math.round(vh - headerH));
    } else {
      if (!this._latchedVh || vw !== this._latchedW || Math.abs(vh - this._latchedVh) >= 160) {
        this._latchedW = vw;
        this._latchedVh = vh;
      }
      const pct = clamp(Number(this.dataset.mheightVh || 109), 50, 120);
      frameH = Math.round((this._latchedVh * pct) / 100);
    }

    this.style.setProperty('--rw-frame-h', frameH + 'px');

    const rect = this._stage.getBoundingClientRect();
    this._W = rect.width;
    this._H = rect.height;

    this._fs = this._mode === 'ring' ? 1.08 : 1;
    this._stage.style.setProperty('--rw-fs', String(this._fs));

    let modelH;
    if (this._mode === 'ring') {
      modelH = Math.max(200, Math.round((this._H - 34 - 18) / 1.08));
      this._unit = Math.max(this._isPhone ? 90 : 120, 0.3 * this._W);
    } else {
      modelH = Math.max(200, Math.round(this._H - (this._isPhone ? 24 : 36) - 18));
      this._unit = Math.max(90, this._W * 0.32 * 1.6);
    }
    this._stage.style.setProperty('--rw-model-h', modelH + 'px');

    const hx = this._mode === 'ring' ? 0.5 * this._W : (this._isPhone ? 0.3 : 0.4) * this._W;
    const hy = this._mode === 'ring' ? 34 : this._isPhone ? 22 : 36;
    this._stage.style.setProperty('--rw-hx', hx.toFixed(1) + 'px');
    this._stage.style.setProperty('--rw-hy', hy + 'px');
    this.style.setProperty('--rw-ax', ((hx / (this._W || 1)) * 100).toFixed(2) + '%');

    for (const b of this._bodies) {
      b.w = b.el.offsetWidth || Math.round(modelH * 0.5625);
    }

    if (this._zoomed) this._sizeLbModel();
  }

  _setStill(v) {
    if (this._still === v) return;
    this._still = v;
    this.classList.toggle('rw--still', v);
  }

  _wrapN(v) {
    return ((v % this._nBodies) + this._nBodies) % this._nBodies;
  }

  _wrapLooks(v) {
    return ((v % this._nLooks) + this._nLooks) % this._nLooks;
  }

  _put(s, x, bottom, scale, opacity, blur, z) {
    const W = this._W;
    if (x + (s.w * scale) / 2 < -4 || x - (s.w * scale) / 2 > W + 4) {
      opacity = 0;
    }
    s.el.style.transform = `translate3d(${x.toFixed(2)}px, ${(-bottom).toFixed(2)}px, 0) translateX(-50%) scale(${scale.toFixed(4)})`;
    s.el.style.opacity = opacity.toFixed(3);
    s.el.style.zIndex = String(z);
    s.el.style.visibility = opacity < 0.01 ? 'hidden' : 'visible';
    s.el.style.pointerEvents = opacity < 0.5 ? 'none' : '';

    const b = this.dataset.blur === 'true' ? Math.round(blur * 10) / 10 : 0;
    const nextFilter = b > 0.05 ? `blur(${b}px)` : '';
    if (s.lastFilter !== nextFilter) {
      s.el.style.filter = nextFilter;
      s.lastFilter = nextFilter;
    }
  }

  _renderAll() {
    const W = this._W;
    const H = this._H;
    if (W <= 0 || H <= 0) return;

    if (this._mode === 'ring') {
      const cx = 0.5 * W;
      const R = (this._isPhone ? 0.72 : 0.62) * W;
      const P = (this._isPhone ? 1.9 : 1.65) * W;
      const floor = H - 34;
      const horizon = 0.36 * H;
      const step = (Math.PI * 2) / this._nBodies;

      for (const s of this._bodies) {
        let phi = ((s.a - this._cur) * step) % (Math.PI * 2);
        if (phi > Math.PI) phi -= Math.PI * 2;
        if (phi <= -Math.PI) phi += Math.PI * 2;

        const zDepth = R * (1 - Math.cos(phi));
        const persp = P / (P + zDepth);
        const sl = Math.abs(phi) / step;
        const scale = persp * (1 + (this._fs - 1) * clamp(1 - sl, 0, 1));
        const x = cx + R * Math.sin(phi) * persp;
        const feet = horizon + (floor - horizon) * persp;
        const bottom = H - feet;
        const blur = sl <= 1 ? 1.8 * sl : Math.min(1.8 + (sl - 1) * 2, 6.5);
        let opacity = clamp((Math.cos(phi) + 0.55) / 0.3, 0, 1);
        if (this._still && sl < 0.02) opacity = 0;
        const z = Math.round(scale * 1000);
        this._put(s, x, bottom, scale, opacity, blur, z);
      }
    } else {
      // Classic mode
      const ax = this._isPhone ? 0.3 : 0.4;
      const ay = this._isPhone ? 22 : 36;
      const sx = this._isPhone ? 0.32 : 0.125;
      const sy = this._isPhone ? 22 : 58;
      const sr = 0.76;
      const ex = this._isPhone ? 0.55 : 0.38;
      const d = this._isPhone ? 4 : 5;

      for (const s of this._bodies) {
        let k = s.x;
        let e = -1;

        if (s.trip) {
          const denom = Math.abs(s.goal - s.from) || 1;
          const u = clamp(Math.abs(s.x - s.from) / denom, 0, 1);
          if (s.goal > s.from) {
            if (u < 0.5) e = 2 * u * 1.4;
            else k = s.goal + 2 * (1 - u);
          } else {
            if (u < 0.5) k = s.from + 2 * u;
            else e = 2 * (1 - u) * 1.4;
          }
        } else if (k < 0) {
          e = Math.min(-k, 1.4);
        }

        if (e >= 0) {
          const x = W * (ax - ex * e);
          const bottom = ay - 22 * e;
          const scale = 1 + 0.14 * e;
          const opacity = Math.max(0, 1 - 1.05 * e);
          const blur = 4 * Math.min(e, 1);
          this._put(s, x, bottom, scale, opacity, blur, 1100);
        } else {
          const x = W * (ax + sx * k);
          const bottom = ay + sy * k;
          const scale = Math.pow(sr, k);
          let opacity = k <= d - 1 ? 1 - 0.13 * k : Math.max(0, 0.61 * (d - k));
          if (this._still && Math.abs(k) < 0.02) opacity = 0;
          const blur = Math.min(0.9 * k, 3.2);
          const z = 1000 - Math.round(10 * k);
          this._put(s, x, bottom, scale, opacity, blur, z);
        }
      }
    }
  }

  _kick() {
    if (this._raf || !this._visible || document.hidden) return;
    this._lastTs = 0;
    this._raf = requestAnimationFrame((ts) => this._tick(ts));
  }

  _stopRaf() {
    if (this._raf) {
      cancelAnimationFrame(this._raf);
      this._raf = 0;
    }
  }

  _tick(ts) {
    this._raf = 0;
    if (!this._visible || document.hidden) return;

    const rawDt = this._lastTs ? (ts - this._lastTs) / 1000 : 1 / 60;
    this._lastTs = ts;
    const dt = Math.min(0.034, Math.max(0.001, rawDt));

    let moving = false;

    if (this._reduced) {
      this._cur = this._target;
      this._vel = 0;
      for (const b of this._bodies) {
        const goal = this._wrapN(b.a - this._target);
        b.goal = goal;
        b.g = goal;
        b.x = goal;
        b.v = 0;
        b.trip = false;
      }
    } else if (this._mode === 'ring') {
      const sub = dt / 3;
      for (let i = 0; i < 3; i++) {
        const acc = -this._K * (this._cur - this._target) - this._C * this._vel;
        this._vel += acc * sub;
        this._cur += this._vel * sub;
      }
      if (!this._dragging && Math.abs(this._cur - this._target) <= 0.0005 && Math.abs(this._vel) <= 0.0005) {
        this._cur = this._target;
        this._vel = 0;
      } else {
        moving = true;
      }
    } else {
      // Classic per-body spring
      const sub = dt / 3;
      for (const b of this._bodies) {
        const goal = this._wrapN(b.a - this._target);
        if (Math.abs(goal - b.goal) > this._nBodies / 2) {
          b.trip = true;
          b.from = b.x;
        }
        b.goal = goal;

        const tau = this._dragging ? 0.016 : b.trip ? 0.1 : 0.03 + 0.04 * Math.min(goal, 4);
        const alpha = 1 - Math.exp(-dt / tau);
        b.g += (goal - b.g) * alpha;

        for (let i = 0; i < 3; i++) {
          const acc = -this._K * (b.x - b.g) - this._C * b.v;
          b.v += acc * sub;
          b.x += b.v * sub;
        }

        if (b.trip && Math.abs(b.x - goal) < 0.02) {
          b.trip = false;
        }

        if (
          !this._dragging &&
          !b.trip &&
          Math.abs(b.x - goal) <= 0.0006 &&
          Math.abs(b.v) <= 0.0006 &&
          Math.abs(b.g - goal) <= 0.0006
        ) {
          b.x = goal;
          b.g = goal;
          b.v = 0;
        } else {
          moving = true;
        }
      }
      this._cur = this._target;
    }

    if (moving || this._dragging) {
      this._setStill(false);
      this._renderAll();
      this._raf = requestAnimationFrame((nextTs) => this._tick(nextTs));
    } else {
      this._setStill(true);
      this._renderAll();
    }
  }

  _rankOfBody(b) {
    const raw = b.a - this._wrapN(Math.round(this._target));
    let k = ((raw % this._nBodies) + this._nBodies) % this._nBodies;
    if (this._mode === 'ring' && k > this._nBodies / 2) k -= this._nBodies;
    return k;
  }

  _syncBodyA11y() {
    for (const b of this._bodies) {
      const k = this._rankOfBody(b);
      const activeSide = k !== 0 && (this._mode === 'ring' ? Math.abs(k) <= 2 : k > 0 && k <= 3);
      if (b.hit) b.hit.tabIndex = activeSide ? 0 : -1;
      if (activeSide) {
        b.el.removeAttribute('aria-hidden');
      } else {
        b.el.setAttribute('aria-hidden', 'true');
      }
    }
  }

  _setIndex(i, silent = false) {
    const prev = this._index;
    this._index = this._wrapLooks(i);
    this._syncBodyA11y();
    this._kick();

    if (!silent && prev !== this._index) {
      if (this._zoomed) this._closeLb(true);
      if (this._isPhone) this._dockAllSheets();
    }

    this.style.setProperty('--rw-progress', ((this._index + 1) / this._nLooks).toFixed(3));

    this._heroes.forEach((hero, hi) => {
      const on = hi === this._index;
      const was = !silent && prev !== this._index && hi === prev;
      hero.classList.toggle('is-on', on);
      hero.classList.toggle('was', was);
      hero.setAttribute('aria-hidden', on ? 'false' : 'true');
      const zBtn = hero.querySelector('[data-rw-zoom]');
      if (zBtn) zBtn.tabIndex = on ? 0 : -1;
    });

    if (!silent) {
      if (!this._reduced) {
        this._stage.classList.remove('is-sweep');
        void this._stage.offsetWidth;
        this._stage.classList.add('is-sweep');
      }
      const activeHero = this._heroes[this._index];
      if (this._liveEl && activeHero) {
        this._liveEl.textContent = activeHero.dataset.label || '';
      }
    }

    this._ticks.forEach((tick, ti) => {
      tick.setAttribute('aria-current', ti === this._index ? 'true' : 'false');
      tick.classList.toggle('is-past', ti < this._index);
    });

    if (!silent) {
      this._panels.forEach((panel, pi) => {
        panel.hidden = pi !== this._index;
        panel.classList.remove('is-in');
      });
      const activePanel = this._panels[this._index];
      if (activePanel) {
        void activePanel.offsetWidth;
        activePanel.classList.add('is-in');
        const tpl = activePanel.querySelector('[data-rw-pieces-text]');
        if (this._piecesEl && tpl) {
          this._piecesEl.textContent = tpl.content.textContent;
          this._piecesEl.classList.remove('is-swap');
          void this._piecesEl.offsetWidth;
          this._piecesEl.classList.add('is-swap');
        }
      }
    }

    this._clearHot();
    if (this._playing) this._restartAutoBar();
  }

  _moveTo(T) {
    this._target = T;
    this._setStill(false);
    this._setIndex(T);
    this._kick();
  }

  _next() {
    this._moveTo(Math.round(this._target) + 1);
  }

  _prev() {
    this._moveTo(Math.round(this._target) - 1);
  }

  _go(i) {
    let d = ((i - this._index) % this._nLooks + this._nLooks) % this._nLooks;
    if (d > this._nLooks / 2) d -= this._nLooks;
    this._moveTo(Math.round(this._target) + d);
  }

  _play(on) {
    this._playing = !!on;
    this.classList.toggle('is-playing', this._playing);
    if (this._autoBtn) this._autoBtn.setAttribute('aria-pressed', this._playing ? 'true' : 'false');
    clearTimeout(this._autoTimer);
    if (this._playing) {
      this._restartAutoBar();
    } else {
      this._ticks.forEach((t) => t.classList.remove('is-run'));
    }
  }

  _restartAutoBar() {
    clearTimeout(this._autoTimer);
    this._ticks.forEach((t) => t.classList.remove('is-run'));
    if (!this._playing) return;
    const activeTick = this._ticks[this._index];
    if (activeTick) {
      void activeTick.offsetWidth;
      activeTick.classList.add('is-run');
    }
    const speed = Math.max(1000, Number(this.dataset.speed || 5000));
    this._autoTimer = setTimeout(() => {
      if (
        this._playing &&
        this._visible &&
        !this._dragging &&
        !document.hidden &&
        !this._panelHover &&
        !this._zoomed &&
        !this._engaged
      ) {
        this._next();
      } else if (this._playing) {
        this._restartAutoBar();
      }
    }, speed);
  }

  _engage() {
    this._engaged = true;
    if (this._playing) this._play(false);
  }

  _clearHot() {
    this.querySelectorAll('.is-hot').forEach((el) => el.classList.remove('is-hot'));
  }

  _hot(n, scroll = false) {
    this._clearHot();
    if (!n) return;
    const scope = this._zoomed ? this._lbStage : this._heroes[this._index];
    if (scope) {
      const pin = scope.querySelector(`[data-rw-pin="${n}"]`);
      if (pin) pin.classList.add('is-hot');
    }
    const panel = this._panels[this._index];
    const card = panel && panel.querySelector(`[data-rw-card="${n}"]`);
    if (card) {
      card.classList.add('is-hot');
      if (scroll) this._revealCard(card, panel);
    }
  }

  _revealCard(card, panel) {
    const list = panel.querySelector('.rw__items');
    if (!list) return;
    const behavior = this._reduced ? 'auto' : 'smooth';
    if (list.scrollWidth > list.clientWidth + 2) {
      const targetLeft = list.scrollLeft + (card.getBoundingClientRect().left - list.getBoundingClientRect().left) - 20;
      list.scrollTo({ left: targetLeft, behavior });
    } else if (list.scrollHeight > list.clientHeight + 2) {
      const targetTop = card.offsetTop - list.offsetTop - 12;
      list.scrollTo({ top: targetTop, behavior });
    } else {
      const r = card.getBoundingClientRect();
      if (r.top < 0 || r.bottom > window.innerHeight - 140) {
        window.scrollBy({ top: r.top - 0.3 * window.innerHeight, behavior });
      }
    }
  }

  /* Lightbox */
  _sizeLbModel() {
    if (!this._lbStage) return;
    const lbModel = this._lbStage.querySelector('.rw__lb-model');
    if (!lbModel) return;
    const r = this._lbStage.getBoundingClientRect();
    const h = Math.max(160, Math.min(r.height, r.width / 0.5625));
    lbModel.style.setProperty('--rw-model-h', h.toFixed(1) + 'px');
    const img = lbModel.querySelector('img[data-model-image]');
    if (img) img.sizes = Math.round(h * 0.5625) + 'px';
  }

  _openLb() {
    if (this._zoomed) return;
    const hero = this._heroes[this._index];
    if (!hero) return;

    this._engage();
    this._clearHot();
    clearTimeout(this._lbTimer);
    this._lbStage.innerHTML = '';

    const wrap = document.createElement('div');
    wrap.className = 'rw__lb-model';
    const foot = hero.style.getPropertyValue('--rw-foot');
    if (foot) wrap.style.setProperty('--rw-foot', foot);

    const shadow = hero.querySelector('.rw__shadow')?.cloneNode(true);
    const figure = hero.querySelector('.rw__figure')?.cloneNode(true);
    if (shadow) wrap.appendChild(shadow);
    if (figure) {
      figure.querySelector('[data-rw-zoom]')?.remove();
      figure.querySelectorAll('[data-rw-pin]').forEach((pin) => {
        pin.tabIndex = 0;
      });
      figure.querySelectorAll('img[data-model-image]').forEach((img) => {
        img.setAttribute('loading', 'eager');
        img.classList.add('is-decoded');
      });
      wrap.appendChild(figure);
    }

    this._lbStage.appendChild(wrap);
    this._sizeLbModel();

    const word = this._lb.dataset.word || 'Look';
    this._lbKicker.textContent = `${word} 0${this._index + 1}`;
    this._lbName.textContent = hero.dataset.name || '';

    const a = hero.querySelector('.rw__figure')?.getBoundingClientRect();
    const b = wrap.querySelector('.rw__figure')?.getBoundingClientRect();

    if (!this._reduced && a && b && a.height > 0 && b.height > 0) {
      wrap.style.transformOrigin = '0 100%';
      wrap.style.transition = 'none';
      wrap.style.transform = `translate3d(${a.left - b.left}px, ${a.bottom - b.bottom}px, 0) scale(${a.height / b.height})`;
      void wrap.offsetWidth;
      wrap.style.transition = '';
      wrap.style.transform = '';
    }

    this._zoomed = true;
    this.classList.add('rw--zoom');
    this._lb.setAttribute('aria-hidden', 'false');
    if (this._lbClose) this._lbClose.focus({ preventScroll: true });
  }

  _closeLb(immediate = false) {
    if (!this._zoomed) return;
    this._zoomed = false;
    const wrap = this._lbStage.querySelector('.rw__lb-model');
    const heroFig = this._heroes[this._index]?.querySelector('.rw__figure');
    const insideLb = this._lb.contains(document.activeElement);

    if (!immediate && !this._reduced && wrap && heroFig) {
      const a = heroFig.getBoundingClientRect();
      const b = wrap.querySelector('.rw__figure')?.getBoundingClientRect();
      if (a.height > 0 && b && b.height > 0) {
        wrap.style.transformOrigin = '0 100%';
        wrap.style.transform = `translate3d(${a.left - b.left}px, ${a.bottom - b.bottom}px, 0) scale(${a.height / b.height})`;
      }
    }

    this.classList.remove('rw--zoom');
    this._lb.setAttribute('aria-hidden', 'true');
    clearTimeout(this._lbTimer);
    const clear = () => {
      this._lbStage.innerHTML = '';
    };
    if (immediate || this._reduced) clear();
    else this._lbTimer = setTimeout(clear, 950);

    if (insideLb && this._stage) this._stage.focus({ preventScroll: true });
  }

  /* Variant & Picker helpers */
  _getVariants(picker) {
    if (picker._variants) return picker._variants;
    const script = picker.querySelector('[data-rw-variants]');
    try {
      picker._variants = script ? JSON.parse(script.textContent) : [];
    } catch {
      picker._variants = [];
    }
    return picker._variants;
  }

  _syncPicker(card, initial = false) {
    const picker = card._picker || card.querySelector('[data-rw-picker]');
    if (!picker) return;
    card._picker = picker;

    const variants = this._getVariants(picker);
    const checked = [...picker.querySelectorAll('input[data-rw-option]:checked')];
    const selectedOpts = [];
    for (const inp of checked) {
      selectedOpts[Number(inp.dataset.rwOption)] = inp.value;
    }

    const match = variants.find((v) => selectedOpts.every((val, idx) => v.o[idx] === val));
    const confirmBtn = picker.querySelector('[data-rw-confirm]');
    const labelSpan = picker.querySelector('[data-rw-confirm-label]');

    // Update unavailable flags per value
    picker.querySelectorAll('input[data-rw-option]').forEach((inp) => {
      const optIdx = Number(inp.dataset.rwOption);
      const val = inp.value;
      const available = variants.some(
        (v) => v.a && v.o[optIdx] === val && selectedOpts.every((sv, i) => i === optIdx || v.o[i] === sv)
      );
      inp.closest('.rw__pill')?.classList.toggle('is-unavailable', !available);
    });

    if (match && match.a) {
      card.dataset.selected = String(match.id);
      if (confirmBtn) confirmBtn.disabled = false;
      if (labelSpan) labelSpan.textContent = labelSpan.dataset.add || 'Add to bag';
    } else {
      delete card.dataset.selected;
      if (confirmBtn) confirmBtn.disabled = true;
      if (labelSpan) labelSpan.textContent = this.dataset.msgSoldout || 'Sold out';
    }

    if (!initial) {
      card.dataset.touched = '1';
    }
  }

  _ensureSheetHost() {
    if (this._sheetHost) return this._sheetHost;
    const host = document.createElement('div');
    host.className = 'rw-sheet-host';

    const cs = getComputedStyle(this);
    const vars = [
      '--rw-panel', '--rw-text', '--rw-muted', '--rw-line', '--rw-accent', '--rw-on-accent',
      '--rw-btn-bg', '--rw-btn-fg', '--rw-btn-radius', '--rw-pill-radius', '--rw-bar-r',
      '--rw-thumb-radius', '--rw-pt-size', '--rw-price', '--rw-opt', '--rw-ease',
      '--rw-ease-sheet', '--rw-ease-spring'
    ];
    for (const v of vars) host.style.setProperty(v, cs.getPropertyValue(v));
    host.style.fontFamily = cs.fontFamily;
    host.style.color = cs.color;

    const scrim = document.createElement('button');
    scrim.type = 'button';
    scrim.className = 'rw__pick-scrim';
    scrim.setAttribute('data-rw-pick-close', '');
    scrim.tabIndex = -1;
    scrim.setAttribute('aria-hidden', 'true');
    host.appendChild(scrim);

    host.addEventListener('click', (e) => this._handleClick(e));
    host.addEventListener('change', (e) => {
      const inp = e.target.closest('input[data-rw-option]');
      if (!inp) return;
      this._engage();
      const picker = inp.closest('[data-rw-picker]');
      const card = picker?._card;
      if (card) this._syncPicker(card, false);
    });
    host.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        const prevCard = this._activeSheetCard;
        this._dockAllSheets();
        prevCard?.querySelector('[data-rw-add]')?.focus({ preventScroll: true });
      }
    });

    this._sheetHost = host;
    return host;
  }

  _openPicker(card) {
    if (card.classList.contains('is-added')) return;
    const picker = card._picker || card.querySelector('[data-rw-picker]');
    if (!picker) return;
    card._picker = picker;
    picker._card = card;

    const addBtn = card.querySelector('[data-rw-add]');

    if (this._isPhone) {
      this._dockAllSheets();
      const host = this._ensureSheetHost();
      if (!host.isConnected) document.body.appendChild(host);
      picker.hidden = false;
      host.appendChild(picker);
      void host.offsetWidth;
      host.classList.add('is-open');
      this.classList.add('rw--picking');
      this._activeSheetCard = card;
    } else {
      picker.hidden = false;
      const panel = card.closest('[data-rw-panel]');
      if (panel) this._revealCard(card, panel);
    }

    card.classList.add('is-picking');
    if (addBtn) addBtn.setAttribute('aria-expanded', 'true');
    const checked = picker.querySelector('input[data-rw-option]:checked') || picker.querySelector('input[data-rw-option]');
    if (checked) checked.focus({ preventScroll: true });
  }

  _closePicker(card) {
    const picker = card._picker || card.querySelector('[data-rw-picker]');
    if (!picker) return;
    if (picker.parentElement !== card) {
      card.appendChild(picker);
    }
    picker.hidden = true;
    card.classList.remove('is-picking');
    const addBtn = card.querySelector('[data-rw-add]');
    if (addBtn && !card.classList.contains('is-added')) {
      addBtn.setAttribute('aria-expanded', 'false');
    }
    if (this._activeSheetCard === card) {
      this._activeSheetCard = null;
      this.classList.remove('rw--picking');
      if (this._sheetHost) {
        this._sheetHost.classList.remove('is-open');
        this._sheetHost.remove();
      }
    }
  }

  _dockAllSheets() {
    if (this._activeSheetCard) {
      this._closePicker(this._activeSheetCard);
    }
    this.classList.remove('rw--picking');
    if (this._sheetHost) {
      this._sheetHost.classList.remove('is-open');
      this._sheetHost.remove();
    }
  }

  _markAdded(card) {
    card.classList.remove('is-loading');
    card.classList.add('is-added');
    this._closePicker(card);
    const addBtn = card.querySelector('[data-rw-add]');
    if (addBtn) {
      addBtn.setAttribute('aria-label', addBtn.dataset.addedLabel || 'Added to bag');
      addBtn.removeAttribute('aria-expanded');
    }
    if (this._isPhone && !this._reduced && typeof navigator.vibrate === 'function') {
      try { navigator.vibrate(12); } catch {}
    }
  }

  _checkPanelComplete(panel) {
    const cards = [...panel.querySelectorAll('.rw__item')];
    if (cards.length < 2) return;
    if (cards.every((c) => c.classList.contains('is-added'))) {
      panel.classList.add('is-complete');
      const msg = panel.querySelector('[data-rw-msg]');
      if (msg) msg.textContent = '';
    }
  }

  async _addSingle(card) {
    const panel = card.closest('[data-rw-panel]');
    const msg = panel?.querySelector('[data-rw-msg]');
    if (msg) msg.textContent = '';
    this._syncPicker(card, false);

    const variantId = Number(card.dataset.selected);
    if (!variantId) return;

    card.classList.add('is-loading');
    try {
      await StylingBag.add([{ id: variantId, quantity: 1 }]);
      this._markAdded(card);
      if (panel) this._checkPanelComplete(panel);
    } catch {
      card.classList.remove('is-loading');
      if (msg) msg.textContent = this.dataset.msgError || 'Couldn’t add to bag. Please try again.';
    }
  }

  async _addFullLook(panel) {
    if (panel.classList.contains('is-complete')) return;
    const cta = panel.querySelector('[data-rw-all]');
    if (!cta || cta.classList.contains('is-loading')) return;

    const msg = panel.querySelector('[data-rw-msg]');
    if (msg) msg.textContent = '';

    const remaining = [...panel.querySelectorAll('.rw__item')].filter((card) => {
      if (card.classList.contains('is-added')) return false;
      const confirm = (card._picker || card.querySelector('[data-rw-picker]'))?.querySelector('[data-rw-confirm]');
      return !confirm?.disabled;
    });

    const ready = [];
    const pending = [];
    for (const card of remaining) {
      if (card.dataset.variantId || (card.dataset.touched === '1' && card.dataset.selected)) {
        ready.push(card);
      } else {
        pending.push(card);
      }
    }

    if (ready.length > 0) {
      cta.classList.add('is-loading');
      ready.forEach((c) => c.classList.add('is-loading'));
      try {
        const payload = ready.map((c) => ({
          id: Number(c.dataset.variantId || c.dataset.selected),
          quantity: 1
        }));
        await StylingBag.add(payload);
        ready.forEach((c) => this._markAdded(c));
      } catch {
        ready.forEach((c) => c.classList.remove('is-loading'));
        if (msg) msg.textContent = this.dataset.msgError || 'Couldn’t add to bag. Please try again.';
      } finally {
        cta.classList.remove('is-loading');
      }
    }

    if (pending.length > 0) {
      if (this._isPhone) {
        this._openPicker(pending[0]);
      } else {
        pending.forEach((c) => this._openPicker(c));
        this._revealCard(pending[0], panel);
      }
      if (msg) {
        const tmpl = this.dataset.msgChoose || 'Pick a size for: [items]';
        const names = pending.map((c) => c.dataset.title || '').filter(Boolean).join(', ');
        msg.textContent = tmpl.replace('[items]', names);
      }
    }

    this._checkPanelComplete(panel);
  }

  _handleClick(e) {
    // 1. pick-close
    const pickClose = e.target.closest('[data-rw-pick-close]');
    if (pickClose) {
      const card = pickClose.closest('[data-rw-picker]')?._card || this._activeSheetCard;
      if (card) {
        this._closePicker(card);
        card.querySelector('[data-rw-add]')?.focus({ preventScroll: true });
      }
      return;
    }

    // 2. popup close button
    if (e.target.closest('[data-rw-zoom-close]')) {
      this._closeLb();
      return;
    }

    // 3. click on popup backdrop or stage beside model
    if (this._zoomed && e.target.closest('[data-rw-lb]') && !e.target.closest('.rw__lb-model')) {
      this._closeLb();
      return;
    }

    // 4. [data-rw-zoom]
    if (e.target.closest('[data-rw-zoom]')) {
      this._openLb();
      return;
    }

    // 5. next
    if (e.target.closest('[data-rw-next]')) {
      this._next();
      return;
    }

    // 6. prev
    if (e.target.closest('[data-rw-prev]')) {
      this._prev();
      return;
    }

    // 7. tick
    const tick = e.target.closest('[data-rw-tick]');
    if (tick) {
      this._go(Number(tick.dataset.rwTick));
      return;
    }

    // 8. autoplay toggle
    if (e.target.closest('[data-rw-auto]')) {
      if (!this._playing) this._engaged = false;
      this._play(!this._playing);
      return;
    }

    // 9. pin
    const pin = e.target.closest('[data-rw-pin]');
    if (pin) {
      this._engage();
      this._hot(pin.dataset.rwPin, true);
      return;
    }

    // 10. queue body [data-rw-go]
    const goBtn = e.target.closest('[data-rw-go]');
    if (goBtn) {
      const modelEl = goBtn.closest('[data-rw-model]');
      const body = this._bodies.find((b) => b.el === modelEl);
      if (body) {
        const k = this._rankOfBody(body);
        if (k === 0) this._openLb();
        else if (Math.abs(k) < 6) this._moveTo(Math.round(this._target) + k);
      }
      return;
    }

    // 11. size confirm
    const confirmBtn = e.target.closest('[data-rw-confirm]');
    if (confirmBtn) {
      const picker = confirmBtn.closest('[data-rw-picker]');
      const card = picker?._card || confirmBtn.closest('.rw__item');
      if (card) this._addSingle(card);
      return;
    }

    // 12. plus button
    const addBtn = e.target.closest('[data-rw-add]');
    if (addBtn) {
      const card = addBtn.closest('.rw__item');
      if (!card || card.classList.contains('is-added')) return;
      if (card.classList.contains('is-picking')) this._closePicker(card);
      else this._openPicker(card);
      return;
    }

    // 13. add full look
    const allBtn = e.target.closest('[data-rw-all]');
    if (allBtn) {
      const panel = allBtn.closest('[data-rw-panel]');
      if (panel) this._addFullLook(panel);
    }
  }

  _bindEvents() {
    // Capture-phase click suppression after drag
    this._on(this._stage, 'click', (e) => {
      if (performance.now() < this._suppressClickUntil) {
        e.preventDefault();
        e.stopPropagation();
      }
    }, { capture: true });

    // Delegated click router
    this._on(this, 'click', (e) => this._handleClick(e));

    // Panel engage, hover pause, hot-linking & option change
    if (this._panelWrap) {
      this._on(this._panelWrap, 'pointerenter', (e) => {
        if (e.pointerType === 'mouse') this._panelHover = true;
      });
      this._on(this._panelWrap, 'pointerleave', (e) => {
        if (e.pointerType === 'mouse') {
          this._panelHover = false;
          if (this._playing) this._restartAutoBar();
        }
      });
      this._on(this._panelWrap, 'click', (e) => {
        if (e.target.closest('button, a, input, select, label')) this._engage();
      });
      this._on(this._panelWrap, 'change', (e) => {
        this._engage();
        const inp = e.target.closest('input[data-rw-option]');
        if (inp) {
          const card = inp.closest('.rw__item') || inp.closest('[data-rw-picker]')?._card;
          if (card) this._syncPicker(card, false);
        }
      });
      this._on(this._panelWrap, 'pointerover', (e) => {
        if (e.pointerType !== 'mouse') return;
        const card = e.target.closest('.rw__item');
        if (card) this._hot(card.dataset.rwCard, false);
      });
      this._on(this._panelWrap, 'pointerout', (e) => {
        if (e.pointerType !== 'mouse') return;
        const card = e.target.closest('.rw__item');
        if (card && !card.contains(e.relatedTarget)) this._clearHot();
      });
    }

    // Keyboard navigation
    this._on(this._stage, 'keydown', (e) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        this._next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        this._prev();
      }
    });

    this._on(this, 'keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (this._activeSheetCard) {
        const prev = this._activeSheetCard;
        this._dockAllSheets();
        prev.querySelector('[data-rw-add]')?.focus({ preventScroll: true });
      } else if (this._zoomed) {
        this._closeLb();
      }
    });

    // Trackpad horizontal wheel
    this._on(this._stage, 'wheel', (e) => {
      if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
      e.preventDefault();
      const now = performance.now();
      if (now < this._wheelLockUntil) return;
      this._wheelAcc += e.deltaX;
      if (Math.abs(this._wheelAcc) > 45) {
        if (this._wheelAcc > 0) this._next();
        else this._prev();
        this._wheelAcc = 0;
        this._wheelLockUntil = now + 520;
      }
    }, { passive: false });

    // Pointer drag / swipe on stage
    let drag = null;
    const endDrag = (e, cancelled) => {
      if (!drag || e.pointerId !== drag.id) return;
      const wasDragging = this._dragging;
      const samples = drag.samples;
      const dx = e.clientX - drag.sx;
      const baseT = drag.t;
      drag = null;
      this._dragging = false;
      this.classList.remove('is-dragging');
      if (!wasDragging) return;

      this._suppressClickUntil = performance.now() + 60;
      let vx = 0;
      if (!cancelled && samples.length >= 2) {
        const first = samples[0];
        const last = samples[samples.length - 1];
        const dtMs = last.time - first.time;
        if (dtMs > 0) vx = (last.x - first.x) / dtMs;
      }
      const sign = -1;
      const from = Math.round(baseT);

      if (this._isPhone) {
        if (Math.abs(dx) > 30 || Math.abs(vx) > 0.3) {
          this._moveTo(from + sign * (dx > 0 ? 1 : -1));
        } else {
          this._moveTo(from);
        }
      } else {
        let i = Math.round(this._target + (sign * vx * 160) / (this._unit || 1));
        if (i === from && Math.abs(vx) > 0.3) {
          i = from + sign * (vx > 0 ? 1 : -1);
        }
        i = clamp(i, from - 2, from + 2);
        this._moveTo(i);
      }
    };

    this._on(this._stage, 'pointerdown', (e) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      if (this._zoomed) return;
      drag = {
        id: e.pointerId,
        sx: e.clientX,
        sy: e.clientY,
        t: this._target,
        samples: [{ x: e.clientX, time: performance.now() }]
      };
    });

    this._on(this._stage, 'pointermove', (e) => {
      // Custom cursor update
      if (this._cursorEl && e.pointerType === 'mouse') {
        const r = this._stage.getBoundingClientRect();
        this._tx = e.clientX - r.left;
        this._ty = e.clientY - r.top;
        if (!this._cOn) {
          this._cOn = true;
          this._cx = this._tx;
          this._cy = this._ty;
          this._cursorEl.style.transform = `translate3d(${this._cx.toFixed(1)}px, ${this._cy.toFixed(1)}px, 0)`;
          this._cursorEl.classList.add('is-on');
        }
        if (!this._dragging) {
          const overLink = !!e.target.closest('.rw__pin, .rw__hit');
          const overView = !!e.target.closest('.rw__zoom');
          this._cursorEl.classList.toggle('is-link', overLink);
          this._cursorEl.classList.toggle('is-view', !overLink && overView);
        }
        this._runCursorLoop();
      }

      if (!drag || e.pointerId !== drag.id) return;
      if (e.pointerType === 'mouse' && (e.buttons & 1) === 0) {
        endDrag(e, false);
        return;
      }
      const dx = e.clientX - drag.sx;
      const dy = e.clientY - drag.sy;
      if (!this._dragging) {
        if (Math.abs(dy) > 10 && Math.abs(dy) >= Math.abs(dx)) {
          drag = null;
          return;
        }
        if (Math.abs(dx) > 8 && Math.abs(dx) > 1.2 * Math.abs(dy)) {
          this._dragging = true;
          this.classList.add('is-dragging');
          try { this._stage.setPointerCapture(e.pointerId); } catch {}
        } else {
          return;
        }
      }
      drag.samples.push({ x: e.clientX, time: performance.now() });
      if (drag.samples.length > 6) drag.samples.shift();

      this._target = drag.t - dx / (this._unit || 1);
      this._setStill(false);
      this._kick();
    });

    this._on(this._stage, 'pointerup', (e) => endDrag(e, false));
    this._on(this._stage, 'pointercancel', (e) => endDrag(e, true));

    if (this._cursorEl) {
      this._on(this._stage, 'pointerleave', (e) => {
        if (e.pointerType !== 'mouse') return;
        this._cOn = false;
        this._cursorEl.classList.remove('is-on', 'is-link', 'is-view');
      });
    }

    // Global resize & visibility
    this._on(window, 'resize', () => {
      clearTimeout(this._resizeTimer);
      this._resizeTimer = setTimeout(() => {
        this._measure();
        this._renderAll();
      }, 120);
    });

    this._on(document, 'visibilitychange', () => {
      if (document.hidden) {
        this._stopRaf();
      } else if (this._visible) {
        this._kick();
        if (this._playing) this._restartAutoBar();
      }
    });
  }

  _runCursorLoop() {
    if (this._cursorRaf || !this._cursorEl) return;
    const step = () => {
      this._cursorRaf = 0;
      if (!this._cOn) return;
      const factor = this._reduced ? 1 : 0.18;
      this._cx += (this._tx - this._cx) * factor;
      this._cy += (this._ty - this._cy) * factor;
      this._cursorEl.style.transform = `translate3d(${this._cx.toFixed(1)}px, ${this._cy.toFixed(1)}px, 0)`;
      if (Math.hypot(this._tx - this._cx, this._ty - this._cy) >= 0.2) {
        this._cursorRaf = requestAnimationFrame(step);
      } else {
        this._cx = this._tx;
        this._cy = this._ty;
        this._cursorEl.style.transform = `translate3d(${this._cx.toFixed(1)}px, ${this._cy.toFixed(1)}px, 0)`;
      }
    };
    this._cursorRaf = requestAnimationFrame(step);
  }
}

export function registerRunwaySection() {
  if (!customElements.get('runway-section')) {
    customElements.define('runway-section', RunwaySection);
  }
}
