/* Mohammed Abbakar — Portfolio v3 */
(function () {
  'use strict';
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Language ----------
  const langBtn = document.getElementById('langBtn');
  const translatable = Array.from(document.querySelectorAll('[data-fr]'));
  translatable.forEach(el => { el.dataset.en = el.innerHTML; });
  let lang = 'en';

  // ---------- Hand-drawn underline under highlighted words ----------
  function decorateScribbles() {
    document.querySelectorAll('.scribble').forEach(s => {
      if (s.querySelector('svg')) return;
      s.insertAdjacentHTML('beforeend',
        '<svg viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true">' +
        '<path d="M3 13 C 40 5, 120 3, 197 8 M 30 17 C 80 12, 140 12, 182 14"/></svg>');
    });
  }
  decorateScribbles();

  // ---------- Theme tile ----------
  const themeTile = document.getElementById('themeTile');
  const themeText = themeTile.querySelector('.theme-text');
  const THEME_TEXT = {
    en: { light: 'Press this tile for the dark mode.', dark: 'Press this tile for the light mode.' },
    fr: { light: 'Appuyez sur cette tuile pour le mode sombre.', dark: 'Appuyez sur cette tuile pour le mode clair.' }
  };
  function paintThemeTile() {
    const t = root.getAttribute('data-theme');
    themeText.textContent = THEME_TEXT[lang][t];
    themeTile.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
  }
  function setTheme(next) {
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('ma3-theme', next); } catch (e) {}
    paintThemeTile();
  }
  themeTile.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    if (!reduceMotion) {
      themeTile.removeAttribute('data-spin');
      void themeTile.offsetWidth;
      themeTile.setAttribute('data-spin', '');
    }
    if (!document.startViewTransition || reduceMotion) { setTheme(next); return; }
    // The new theme grows as a circle out of the tile that was pressed
    const r = themeTile.getBoundingClientRect();
    const x = r.left + r.width / 2, y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    const t = document.startViewTransition(() => setTheme(next));
    t.ready.then(() => {
      root.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 700, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' }
      );
    });
  });

  function applyLang(next, animate) {
    const swap = () => {
      translatable.forEach(el => { el.innerHTML = el.dataset[next]; });
      root.lang = next;
      lang = next;
      langBtn.textContent = next === 'en' ? 'FR' : 'EN';
      langBtn.setAttribute('aria-label', next === 'en' ? 'Passer en français' : 'Switch to English');
      paintThemeTile();
      decorateScribbles();
      placePill();
      document.dispatchEvent(new CustomEvent('ma:lang', { detail: next }));
      document.body.classList.remove('switching');
    };
    if (animate && !reduceMotion) {
      document.body.classList.add('switching');
      setTimeout(swap, 180);
    } else swap();
  }
  langBtn.addEventListener('click', () => {
    const next = lang === 'en' ? 'fr' : 'en';
    applyLang(next, true);
    try { localStorage.setItem('ma3-lang', next); } catch (e) {}
  });
  let savedLang = null;
  try { savedLang = localStorage.getItem('ma3-lang'); } catch (e) {}
  if (savedLang === 'fr') applyLang('fr', false); else paintThemeTile();

  // ---------- Rail: highlight the current section ----------
  const links = Array.from(document.querySelectorAll('.rail a'));
  const sections = links.map(a => document.querySelector(a.getAttribute('href')));
  function onScroll() {
    const mid = window.innerHeight * 0.4;
    let current = 0;
    sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top <= mid) current = i; });
    if (window.innerHeight + window.scrollY >= document.body.scrollHeight - 4) current = sections.length - 1;
    links.forEach((a, i) => {
      a.classList.toggle('is-active', i === current);
      if (i === current) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
    placePill();
  }
  // The dark pill slides to the active link
  function placePill() {
    const pill = document.querySelector('.rail-pill');
    const active = document.querySelector('.rail a.is-active');
    if (!pill || !active) return;
    const vertical = getComputedStyle(active).writingMode.startsWith('vertical');
    if (vertical) {
      pill.style.left = ''; pill.style.width = '';
      pill.style.top = active.offsetTop + 'px';
      pill.style.height = active.offsetHeight + 'px';
    } else {
      pill.style.top = ''; pill.style.height = '';
      pill.style.left = active.offsetLeft + 'px';
      pill.style.width = active.offsetWidth + 'px';
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', placePill);
  // Web fonts change the link sizes once they load, so re-measure then
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(placePill);
  onScroll();

  // ---------- Scroll reveal, staggered inside each group ----------
  const revealEls = Array.from(document.querySelectorAll('[data-reveal]'));
  const groups = new Map();
  revealEls.forEach(el => {
    const g = groups.get(el.parentElement) || [];
    g.push(el); groups.set(el.parentElement, g);
    el.style.setProperty('--d', (Math.min(g.length - 1, 5) * 0.09) + 's');
  });
  if ('IntersectionObserver' in window && !reduceMotion) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('in'));
  }

  // ---------- Soft spotlight that follows the cursor on tiles ----------
  if (window.matchMedia('(hover: hover)').matches && !reduceMotion) {
    document.querySelectorAll('.tile, .story').forEach(el => {
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        el.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
      el.addEventListener('pointerleave', () => {
        el.style.removeProperty('--mx');
        el.style.removeProperty('--my');
      });
    });
  }

  // ---------- Project image preview (lightbox) ----------
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lbImg');
  const lbTitle = document.getElementById('lbTitle');
  const lbLink = document.getElementById('lbLink');
  document.querySelectorAll('.card-thumb').forEach(btn => {
    const card = btn.closest('.card');
    const title = () => card.querySelector('.card-link').textContent.trim();
    btn.setAttribute('aria-label', (lang === 'fr' ? 'Agrandir l\'image : ' : 'Enlarge image: ') + title());
    btn.addEventListener('click', () => {
      lbImg.src = btn.dataset.img;
      lbImg.alt = title();
      lbTitle.textContent = title();
      lbLink.href = btn.dataset.url;
      if (typeof lb.showModal === 'function') lb.showModal();
      else window.open(btn.dataset.img, '_blank');
    });
  });
  document.getElementById('lbClose').addEventListener('click', () => lb.close());
  lb.addEventListener('click', e => { if (e.target === lb) lb.close(); });

  // ---------- Copy email ----------
  const copyBtn = document.getElementById('copyMail');
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      const text = copyBtn.dataset.copy;
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch (e) {
        const ta = document.createElement('textarea');
        ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { ok = document.execCommand('copy'); } catch (e2) {}
        ta.remove();
      }
      if (!ok) return;
      copyBtn.classList.add('is-done');
      clearTimeout(copyBtn._t);
      copyBtn._t = setTimeout(() => copyBtn.classList.remove('is-done'), 1600);
    });
  }

  // ---------- Process: from raw data to a decision ----------
  (function setupProcess() {
    const box = document.querySelector('.process');
    if (!box) return;
    const steps = Array.from(box.querySelectorAll('.step'));
    const panels = Array.from(box.querySelectorAll('.step-panel'));
    const body = document.getElementById('specBody');
    const file = document.getElementById('specFile');
    const playBtn = document.getElementById('procPlay');
    const prevBtn = document.getElementById('procPrev');
    const nextBtn = document.getElementById('procNext');
    const DUR = [7000, 7500, 7000, 6500, 8000];

    const T = {
      en: {
        q: 'Why are our deliveries late, and what should we fix first?',
        needs: [['Decision', 'What to fix first'], ['Audience', 'Operations team'], ['Metric', 'Late deliveries by cause'], ['Deliverable', 'A one-page Power BI report']],
        rows: 'Showing 6 of 566 late deliveries',
        log: ['1 duplicate removed', '2 labels unified', '1 date reformatted', '1 missing wait filled (median)'],
        chart: '<b>Late deliveries by cause</b>, 566 in total',
        causes: ['Weather', 'None recorded', 'Traffic', 'Mechanical'],
        axis: 'Axis starts at zero: the causes really are this close.',
        big: 'of late deliveries are weather-related: the largest share, but only just.',
        recT: 'Recommendation',
        rec: 'Start with preventive maintenance. Mechanical failures bring some of the longest waits (about 36 min), and it is the cause the team can actually control.',
        confT: 'Confidence',
        conf: 'Medium. The causes are close, so I would re-check with next quarter\u2019s data.'
      },
      fr: {
        q: 'Pourquoi nos livraisons sont-elles en retard, et que corriger en premier ?',
        needs: [['Décision', 'Quoi corriger en premier'], ['Public', 'Équipe opérations'], ['Indicateur', 'Retards par cause'], ['Livrable', 'Un rapport Power BI d\u2019une page']],
        rows: '6 lignes affichées sur 566 retards',
        log: ['1 doublon supprimé', '2 libellés harmonisés', '1 date reformatée', '1 attente manquante (médiane)'],
        chart: '<b>Retards par cause</b>, 566 au total',
        causes: ['Météo', 'Non renseigné', 'Trafic', 'Panne'],
        axis: 'L\u2019axe part de zéro : les causes sont vraiment aussi proches.',
        big: 'des retards sont liés à la météo : la plus grande part, mais de peu.',
        recT: 'Recommandation',
        rec: 'Commencer par la maintenance préventive. Les pannes entraînent parmi les attentes les plus longues (environ 36 min), et c\u2019est la cause que l\u2019équipe maîtrise vraiment.',
        confT: 'Niveau de confiance',
        conf: 'Moyen. Les causes sont proches, je revérifierais avec les données du trimestre suivant.'
      }
    };
    const L = () => T[root.lang === 'fr' ? 'fr' : 'en'];

    let idx = 0, playing = false, ended = false, visible = false, started = false;
    let t0 = 0, elapsed = 0, raf = 0, token = 0;
    const sleep = ms => new Promise(r => setTimeout(r, ms));

    async function type(el, text, my, speed) {
      if (reduceMotion) { el.textContent = text; return; }
      el.textContent = '';
      for (let i = 0; i < text.length; i++) {
        if (my !== token) return;
        el.textContent += text[i];
        await sleep(speed);
      }
    }

    const RAW = [
      ['1042', '2025-03-02', 'Weather', '41'],
      ['1043', '<span class="fix-old">03/02/2025</span><span class="fix-new">2025-03-02</span>', '<span class="fix-old">traffic </span><span class="fix-new">Traffic</span>', '38'],
      ['1044', '2025-03-02', 'Mechanical', '<span class="fix-old">null</span><span class="fix-new">35</span>'],
      ['1044', '2025-03-02', 'Mechanical', 'null', 'dup'],
      ['1045', '2025-03-03', '<span class="fix-old">weather</span><span class="fix-new">Weather</span>', '35'],
      ['1046', '2025-03-03', 'None', '29']
    ];
    const BAD = { '1-1': 1, '1-2': 1, '2-3': 1, '4-2': 1 };
    function table(markBad) {
      const rows = RAW.map((r, i) => {
        const cells = r.slice(0, 4).map((v, k) => {
          const bad = markBad && BAD[i + '-' + k] ? ' class="bad"' : '';
          const raw = markBad ? v : v.replace(/<span class="fix-new">.*?<\/span>/, '').replace(/<\/?span[^>]*>/g, '');
          return `<td${bad}>${raw}</td>`;
        }).join('');
        const dup = markBad && r[4] === 'dup' ? ' class="dup"' : '';
        return `<tr${dup} style="animation-delay:${0.08 * i}s">${cells}</tr>`;
      }).join('');
      return `<table class="sp-table"><thead><tr style="opacity:1;animation:none"><th>id</th><th>date</th><th>cause</th><th>wait_min</th></tr></thead><tbody>${rows}</tbody></table>`;
    }

    async function paint(i, instant) {
      const my = ++token;
      const s = L();
      body.classList.remove('is-cleaning');
      const files = ['brief.md', 'query.sql', 'clean.py', 'delays_by_cause.pbix', 'recommendation.md'];
      file.textContent = files[i];
      const fast = instant || reduceMotion;

      if (i === 0) {
        body.innerHTML = `<div class="sp-ask"><p class="sp-bubble"><span class="q"></span><span class="sp-caret"></span></p><div class="sp-need"></div></div>`;
        await type(body.querySelector('.q'), s.q, my, fast ? 0 : 28);
        if (my !== token) return;
        body.querySelector('.sp-need').innerHTML = s.needs.map((n, k) =>
          `<div style="animation-delay:${fast ? 0 : 0.12 * k}s"><small>${n[0]}</small>${n[1]}</div>`).join('');
      }
      if (i === 1) {
        body.innerHTML = `<pre class="sp-code"></pre><div class="sp-rows"></div>`;
        const code = "SELECT id, date, cause, wait_min\nFROM logistics.deliveries\nWHERE status = 'late';";
        const pre = body.querySelector('.sp-code');
        await type(pre, code, my, fast ? 0 : 24);
        if (my !== token) return;
        pre.innerHTML = code.replace(/\b(SELECT|FROM|WHERE)\b/g, '<b>$1</b>');
        if (!fast) await sleep(250);
        if (my !== token) return;
        body.querySelector('.sp-rows').innerHTML = table(false) + `<p class="spec-note" style="margin-top:.8rem;color:#8F8F8F;font-size:.72rem">${s.rows}</p>`;
      }
      if (i === 2) {
        body.innerHTML = table(true) + `<div class="sp-log"></div>`;
        if (!fast) await sleep(1300);
        if (my !== token) return;
        body.classList.add('is-cleaning');
        body.querySelector('.sp-log').innerHTML = s.log.map((l, k) => `<span style="animation-delay:${fast ? 0 : 0.35 + 0.15 * k}s">${l}</span>`).join('');
      }
      if (i === 3) {
        const vals = [151, 147, 135, 133];
        body.innerHTML = `<p class="sp-chart-title">${s.chart}</p><div class="sp-bars">` +
          vals.map((v, k) => `<div class="sp-bar${k === 0 ? ' top' : ''}"><span>${s.causes[k]}</span><span class="sp-track"><span class="sp-fill" style="--w:${(v / 151 * 100).toFixed(1)}%;animation-delay:${fast ? 0 : 0.12 * k}s"></span></span><b data-v="${v}">${fast ? v : 0}</b></div>`).join('') +
          `</div><p class="sp-axis">${s.axis}</p>`;
        if (!fast) {
          const nums = Array.from(body.querySelectorAll('b[data-v]'));
          const start = performance.now();
          const tick = now => {
            if (my !== token) return;
            const p = Math.min(1, (now - start) / 1000);
            const e = 1 - Math.pow(1 - p, 3);
            nums.forEach(n => { n.textContent = Math.round(+n.dataset.v * e); });
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      }
      if (i === 4) {
        body.innerHTML = `<div class="sp-decide"><p class="sp-big">0%</p><p class="sp-lead">${s.big}</p>
          <div class="sp-card"><small>${s.recT}</small>${s.rec}</div>
          <div class="sp-card" style="animation-delay:.75s"><small>${s.confT}</small>${s.conf}</div></div>`;
        const big = body.querySelector('.sp-big');
        if (fast) { big.textContent = '27%'; return; }
        const start = performance.now();
        const tick = now => {
          if (my !== token) return;
          const p = Math.min(1, (now - start) / 900);
          big.textContent = Math.round(27 * (1 - Math.pow(1 - p, 3))) + '%';
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }

    function select(i, opts = {}) {
      idx = Math.max(0, Math.min(steps.length - 1, i));
      steps.forEach((s, k) => {
        const on = k === idx;
        s.setAttribute('aria-selected', on ? 'true' : 'false');
        s.tabIndex = on ? 0 : -1;
        s.classList.toggle('is-done', k < idx);
        s.style.setProperty('--fill', k < idx ? 1 : 0);
      });
      panels.forEach((p, k) => { p.hidden = k !== idx; });
      prevBtn.disabled = idx === 0;
      nextBtn.disabled = idx === steps.length - 1;
      elapsed = 0; t0 = performance.now();
      playBtn.style.setProperty('--t', 0);
      paint(idx, opts.instant);
      if (opts.focus) steps[idx].focus();
    }

    function setState() {
      box.classList.toggle('is-paused', !playing && !ended);
      box.classList.toggle('is-ended', ended);
      playBtn.setAttribute('aria-label', ended ? 'Replay' : playing ? 'Pause' : 'Play');
    }
    function loop(now) {
      if (!playing) return;
      if (visible) {
        elapsed += now - t0;
        const t = Math.min(1, elapsed / DUR[idx]);
        playBtn.style.setProperty('--t', t);
        steps[idx].style.setProperty('--fill', t);
        if (t >= 1) {
          if (idx < steps.length - 1) select(idx + 1);
          else { playing = false; ended = true; steps[idx].classList.add('is-done'); setState(); return; }
        }
      }
      t0 = now;
      raf = requestAnimationFrame(loop);
    }
    function play() {
      if (ended) { ended = false; select(0); }
      playing = true; t0 = performance.now(); setState();
      cancelAnimationFrame(raf); raf = requestAnimationFrame(loop);
    }
    function pause() { playing = false; cancelAnimationFrame(raf); setState(); }

    steps.forEach((s, k) => {
      s.addEventListener('click', () => { pause(); ended = false; setState(); select(k); });
      s.addEventListener('keydown', e => {
        let n = null;
        if (e.key === 'ArrowRight') n = idx + 1;
        if (e.key === 'ArrowLeft') n = idx - 1;
        if (e.key === 'Home') n = 0;
        if (e.key === 'End') n = steps.length - 1;
        if (n === null) return;
        e.preventDefault(); pause(); ended = false; setState(); select(n, { focus: true });
      });
    });
    prevBtn.addEventListener('click', () => { pause(); ended = false; setState(); select(idx - 1); });
    nextBtn.addEventListener('click', () => { pause(); ended = false; setState(); select(idx + 1); });
    playBtn.addEventListener('click', () => { playing ? pause() : play(); });
    document.addEventListener('ma:lang', () => paint(idx, true));

    select(0, { instant: true });
    setState();
    if (reduceMotion) { box.classList.add('is-paused'); return; }
    const io = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      if (visible && !started) { started = true; select(0); play(); }
    }, { threshold: 0.35 });
    io.observe(box);
  })();

  // ---------- Scroll-linked shuffle for project and story cards ----------
  (function setupShuffle() {
    if (reduceMotion) return;
    const groups = [
      Array.from(document.querySelectorAll('.cards .card')),
      Array.from(document.querySelectorAll('.story-grid .story'))
    ].filter(g => g.length);
    if (!groups.length) return;

    // Stable pseudo-random numbers so every visit shuffles the same way
    const rnd = n => { const x = Math.sin(n * 91.7 + 13.3) * 43758.5453; return x - Math.floor(x); };
    const ease = t => 1 - Math.pow(1 - t, 3);
    let items = [];

    function measure() {
      items = [];
      groups.forEach((cards, g) => {
        const parent = cards[0].parentElement;
        const cols = getComputedStyle(parent).gridTemplateColumns.split(' ').length;
        const small = innerWidth < 700;
        cards.forEach((el, i) => {
          const col = i % cols;
          const mid = (cols - 1) / 2;
          const seed = g * 10 + i;
          const spread = small ? 36 : 120;
          items.push({
            el, col,
            dx: (col - mid) * spread + (rnd(seed) - 0.5) * (small ? 50 : 90),
            dy: 70 + rnd(seed + 3) * (small ? 60 : 120),
            dr: (rnd(seed + 7) - 0.5) * (small ? 14 : 22)
          });
        });
      });
      update();
    }

    let ticking = false;
    function update() {
      ticking = false;
      const vh = innerHeight;
      items.forEach(it => {
        const top = it.el.getBoundingClientRect().top;
        const start = vh * 1.02;                  // card just below the screen: fully scattered
        const end = vh * (0.62 - it.col * 0.05);  // card well inside: in place (later columns settle a bit later)
        const p = Math.min(1, Math.max(0, (start - top) / (start - end)));
        const k = 1 - ease(p);
        const s = it.el.style;
        if (k < 0.001) {
          s.removeProperty('--sx'); s.removeProperty('--sy'); s.removeProperty('--sr');
          s.removeProperty('--ss'); s.removeProperty('--so');
          return;
        }
        s.setProperty('--sx', (it.dx * k).toFixed(1) + 'px');
        s.setProperty('--sy', (it.dy * k).toFixed(1) + 'px');
        s.setProperty('--sr', (it.dr * k).toFixed(2) + 'deg');
        s.setProperty('--ss', (1 - 0.08 * k).toFixed(3));
        s.setProperty('--so', (1 - 0.55 * k).toFixed(3));
      });
    }
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', measure);
    measure();
  })();

  // ---------- Key numbers: count up once, open on hover / focus / tap ----------
  (function setupStats() {
    const box = document.querySelector('.stats');
    if (!box) return;
    const stats = Array.from(box.querySelectorAll('.stat'));
    const canHover = window.matchMedia('(hover: hover) and (min-width: 861px)');

    function open(stat) {
      stats.forEach(s => {
        const on = s === stat;
        s.classList.toggle('is-open', on);
        s.querySelector('.stat-top').setAttribute('aria-expanded', on ? 'true' : 'false');
      });
      box.classList.toggle('has-open', !!stat);
    }
    stats.forEach(s => {
      const btn = s.querySelector('.stat-top');
      s.addEventListener('mouseenter', () => { if (canHover.matches) open(s); });
      s.addEventListener('focusin', () => { if (canHover.matches) open(s); });
      btn.addEventListener('click', () => open(s.classList.contains('is-open') && !canHover.matches ? null : s));
    });
    box.addEventListener('mouseleave', () => { if (canHover.matches) open(null); });
    box.addEventListener('focusout', e => { if (canHover.matches && !box.contains(e.relatedTarget)) open(null); });

    // Count up when the strip first comes into view
    const counts = Array.from(box.querySelectorAll('.count'));
    if (reduceMotion || !('IntersectionObserver' in window)) return;
    counts.forEach(c => { c.textContent = '0'; });
    const io = new IntersectionObserver(entries => {
      if (!entries[0].isIntersecting) return;
      io.disconnect();
      counts.forEach((c, i) => {
        const to = +c.dataset.to;
        const delay = i * 120, dur = 1100;
        const start = performance.now() + delay;
        const tick = now => {
          const p = Math.min(1, Math.max(0, (now - start) / dur));
          c.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.5 });
    io.observe(box);
  })();
})();
