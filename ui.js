// Lapisan interaksi UI WASPADA (tidak mengubah logika app.js)
(() => {
  const $ = s => document.querySelector(s);
  const root = document.documentElement;
  const safe = fn => { try { return fn(); } catch (e) {} };

  // Mode gelap
  const btnTheme = $('#themeToggle');
  const setTheme = t => { root.dataset.theme = t; btnTheme.textContent = t === 'dark' ? '☀️' : '🌙'; safe(() => localStorage.setItem('waspada-theme', t)); };
  setTheme(safe(() => localStorage.getItem('waspada-theme')) || 'light');
  btnTheme.addEventListener('click', () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark'));

  // Progres & status langkah
  const tabs = [...document.querySelectorAll('.tab-btn')];
  let last = -1;
  const sync = () => {
    const i = tabs.findIndex(t => t.classList.contains('active'));
    if (i === last) return; last = i;
    tabs.forEach((t, k) => t.classList.toggle('done', k < i));
    $('#progress-fill').style.width = ((i + 1) / tabs.length * 100) + '%';
    tabs[i].scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  };
  new MutationObserver(sync).observe($('.tab-nav'), { attributes: true, subtree: true, attributeFilter: ['class'] });
  sync();

  // Validasi visual + tanda terisi
  const form = $('#waspadaForm');
  form.addEventListener('input', e => {
    const el = e.target;
    if (el.type === 'range') return;
    el.classList.toggle('filled', !!el.value.trim());
    if (el.value.trim()) el.classList.remove('invalid');
  });
  document.addEventListener('click', e => {
    if (!e.target.closest('#btnNext, .tab-btn')) return;
    const el = document.activeElement;
    if (el && el.required && !el.value.trim()) {
      el.classList.add('invalid', 'shake');
      setTimeout(() => el.classList.remove('shake'), 450);
    }
  });

  // Slider berwarna sesuai tingkat
  const slider = $('#potensiUlang');
  const colors = ['#16a34a', '#84cc16', '#d97706', '#f97316', '#dc2626'];
  const paint = () => {
    slider.style.setProperty('--pct', ((slider.value - 1) / 4 * 100) + '%');
    slider.style.setProperty('--lvl', colors[slider.value - 1]);
  };
  slider.addEventListener('input', paint); paint();

  // Warna kartu risiko
  const riskSel = $('#tingkatRisiko');
  riskSel.addEventListener('change', () => { $('#card-risiko-badge').closest('.card-stat').dataset.risk = riskSel.value; });

  // Efek ripple pada tombol
  document.addEventListener('pointerdown', e => {
    const b = e.target.closest('.btn-custom'); if (!b || b.disabled) return;
    const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height);
    const s = document.createElement('span'); s.className = 'ripple';
    s.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    b.appendChild(s); setTimeout(() => s.remove(), 600);
  });

  // Pratinjau BAP langsung
  const modal = $('#previewModal'), stage = $('#preview-stage');
  const fit = () => {
    const c = stage.firstElementChild; if (!c) return;
    const s = Math.min(1, (stage.clientWidth || 750) / 750);
    c.style.transform = `scale(${s})`; c.style.transformOrigin = 'top left';
    stage.style.height = (c.offsetHeight * s) + 'px';
  };
  const open = () => {
    const c = $('#capture-area').cloneNode(true);
    c.removeAttribute('id'); c.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
    stage.replaceChildren(c); modal.classList.add('open'); fit();
  };
  const close = () => modal.classList.remove('open');
  $('#btnPreview').addEventListener('click', open);
  $('#previewClose').addEventListener('click', close);
  modal.addEventListener('click', e => { if (e.target === modal) close(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  window.addEventListener('resize', fit);
  $('#pvDownload').addEventListener('click', () => $('#btnDownload').click());
  $('#pvShare').addEventListener('click', () => $('#btnShareWa').click());
})();
