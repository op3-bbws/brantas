/* =====================================================================
   SIPANDU — UI KIT: ikon SVG, toast, bottom sheet, komponen kalender
   ===================================================================== */
window.UI = (function () {
  'use strict';

  /* ---------- ikon SVG (garis tipis ala iOS) ---------- */
  const I = {
    home: '<path d="M3.5 10.6 12 3.5l8.5 7.1V20a1 1 0 0 1-1 1h-5v-6h-5v6h-5a1 1 0 0 1-1-1z"/>',
    clip: '<rect x="5" y="4.5" width="14" height="16.5" rx="2.5"/><path d="M9 4.5a3 3 0 0 1 6 0M9 11h6M9 15h4"/>',
    camera: '<path d="M8.2 7l1.5-2.4h4.6L15.8 7"/><rect x="3" y="7" width="18" height="13" rx="3"/><circle cx="12" cy="13.3" r="3.6"/>',
    clock: '<circle cx="12" cy="12" r="8.4"/><path d="M12 7.4V12l3.2 2.1"/>',
    map: '<path d="M9 4.4 3.5 6.3v13.3L9 17.7l6 2 5.5-1.9V4.5L15 6.4z"/><path d="M9 4.4v13.3M15 6.4v13.3"/>',
    grid: '<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
    user: '<circle cx="12" cy="8" r="3.7"/><path d="M4.8 20.2c1.3-3.9 4.1-5.7 7.2-5.7s5.9 1.8 7.2 5.7"/>',
    chevl: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
    chevr: '<path d="M9.5 5.5 16 12l-6.5 6.5"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    off: '<path d="M3.8 4 20.2 20M5 10.5a12.5 12.5 0 0 1 6-3M2.5 6.8A17 17 0 0 1 8 4.3M16.3 7.5a12.5 12.5 0 0 1 2.9 3M8.8 13.9a7 7 0 0 1 6.4-.1"/><circle cx="12" cy="18.5" r="1" fill="currentColor" stroke="none"/>',
    check: '<path d="M4.5 12.6 9.7 17.8 19.5 7"/>',
    flip: '<path d="M4.3 8.5A8.3 8.3 0 0 1 18 6.2l1.7 1.6M20 3.5v4.5h-4.5M19.7 15.5A8.3 8.3 0 0 1 6 17.8l-1.7-1.6M4 20.5V16h4.5"/>',
    bolt: '<path d="M13.2 2.2 4.8 13.4h5.4L10.2 21.8l8.6-11.4h-5.6z" fill="currentColor" stroke="none"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    compass: '<circle cx="12" cy="12" r="8.4"/><path d="m15.2 8.8-2 4.4-4.4 2 2-4.4z"/>',
    cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 9.8h17M8 3.2v3.6M16 3.2v3.6"/>',
    send: '<path d="M4.4 11.8 20 4.6l-4.6 15.2-3.8-6.4z"/><path d="M11.6 13.4 20 4.6"/>',
    rotate: '<rect x="7.5" y="4" width="9" height="16" rx="2"/><path d="M3.5 8.5A9 9 0 0 1 6 5.5M20.5 15.5a9 9 0 0 1-2.5 3"/>',
    pin: '<path d="M12 21.2S5.6 15 5.6 10.4a6.4 6.4 0 0 1 12.8 0C18.4 15 12 21.2 12 21.2z"/><circle cx="12" cy="10.4" r="2.4"/>',
    cloud: '<path d="M7 18.5a4.5 4.5 0 0 1-.4-9A6 6 0 0 1 18 10.6a3.9 3.9 0 0 1-.6 7.9z"/>',
    dl: '<path d="M12 4v10M8 10.5l4 4 4-4M5 19.5h14"/>',
    logout: '<path d="M14.5 8.5V6a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v-2.5M9.5 12H20M17 8.8l3.2 3.2-3.2 3.2"/>',
    drop: '<path d="M12 3.2S5.8 10 5.8 14.2a6.2 6.2 0 0 0 12.4 0C18.2 10 12 3.2 12 3.2z"/>',
    layers: '<path d="m12 3.5 9 4.7-9 4.7-9-4.7z"/><path d="m4.6 12.6 7.4 3.9 7.4-3.9M4.6 16.4l7.4 3.9 7.4-3.9"/>',
    lock: '<rect x="6" y="10.5" width="12" height="9.5" rx="2.5"/><path d="M8.6 10.5V8a3.4 3.4 0 0 1 6.8 0v2.5"/>',
    timer: '<circle cx="12" cy="13" r="7.6"/><path d="M12 9.5V13l2.4 1.6M9.5 2.8h5"/>',
    alert: '<path d="M12 4 2.8 19.6h18.4z"/><path d="M12 10v4M12 16.8v.4"/>',
    info: '<circle cx="12" cy="12" r="8.4"/><path d="M12 11v5M12 7.8v.4"/>',
    brand: '<circle cx="12" cy="12" r="9.2" fill="#0B3B78" stroke="none"/><rect x="8.2" y="6.6" width="7.6" height="1.6" rx=".8" fill="#fff" stroke="none"/><rect x="9.3" y="9.4" width="1.5" height="4.6" rx=".75" fill="#fff" stroke="none"/><rect x="11.25" y="9.4" width="1.5" height="4.6" rx=".75" fill="#fff" stroke="none"/><rect x="13.2" y="9.4" width="1.5" height="4.6" rx=".75" fill="#fff" stroke="none"/><rect x="8.2" y="14.4" width="7.6" height="1.5" rx=".75" fill="#fff" stroke="none"/><path d="M5.4 18.2c1.65-1.5 3.2-1.5 4.85 0s3.2 1.5 4.85 0 3.2-1.5 4.85 0" stroke="#F7941D" stroke-width="1.5" fill="none"/>'
  };
  const ic = (n, s = 22) =>
    `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${I[n] || ''}</svg>`;

  /* ---------- toast ---------- */
  let toastT = null;
  function toast(msg) {
    const t = document.getElementById('toast');
    t.innerHTML = msg;
    t.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove('show'), 2600);
  }

  /* ---------- bottom sheet (iOS style) ---------- */
  function closeSheet() {
    const bg = document.getElementById('sheet-bg');
    const sh = document.getElementById('sheet');
    if (!sh || sh.classList.contains('hidden')) return;
    sh.classList.remove('open');
    bg.classList.remove('open');
    setTimeout(() => { sh.classList.add('hidden'); bg.classList.add('hidden'); }, 320);
  }
  function sheet({ title, html, actions = [] }) {
    const bg = document.getElementById('sheet-bg');
    const sh = document.getElementById('sheet');
    sh.querySelector('.sheet-title').innerHTML = title || '';
    sh.querySelector('.sheet-body').innerHTML = html || '';
    const act = sh.querySelector('.sheet-actions');
    act.innerHTML = actions.map((a, i) => `<button class="btn ${a.cls || ''}" data-i="${i}">${a.label}</button>`).join('');
    act.style.display = actions.length ? 'flex' : 'none';
    actions.forEach((a, i) => {
      act.querySelector('[data-i="' + i + '"]').onclick = () => {
        const keep = a.onClick && a.onClick();
        if (!keep) closeSheet();
      };
    });
    bg.classList.remove('hidden');
    sh.classList.remove('hidden');
    requestAnimationFrame(() => requestAnimationFrame(() => {
      bg.classList.add('open');
      sh.classList.add('open');
    }));
    bg.onclick = closeSheet;
  }

  /* ---------- format ---------- */
  const pad = (n) => String(n).padStart(2, '0');
  const fmtLong = (ds) => new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(ds + 'T00:00:00'));
  const fmtShort = (ds) => {
    if (!window.DATA) return ds;
    if (ds === DATA.TISO) return 'Hari ini';
    if (ds === DATA.addDays(-1)) return 'Kemarin';
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' }).format(new Date(ds + 'T00:00:00'));
  };
  const hb = (ts) => new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(ts));
  const initials = (name) => (name || '?').split(' ').filter((w) => /^[A-Za-z]/.test(w)).slice(0, 2).map((w) => w[0].toUpperCase()).join('');

  /* ---------- KALENDER PROFESIONAL ---------- */
  const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const DOW = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
  const DOT = { full: 'd-full', part: 'd-part', miss: 'd-miss', task: 'd-task' };

  /**
   * calendar(hostEl, {y, m, marks, selected, onSelect, onMonthChange})
   * marks: {'2026-11-05': {done:'full|part|miss|task|none', count:n}}
   */
  function calendar(host, opts) {
    const { y, m } = opts;
    const first = new Date(y, m, 1);
    const lead = (first.getDay() + 6) % 7; // Senin = awal pekan
    const dim = new Date(y, m + 1, 0).getDate();
    const tiso = DATA.TISO;
    let html = `<div class="cal-head">
      <div class="cal-title">${MONTHS[m]} ${y}</div>
      <div class="cal-nav">
        <button data-nav="-1" aria-label="Bulan sebelumnya">${ic('chevl', 16)}</button>
        <button data-nav="0" class="cal-today">Hari ini</button>
        <button data-nav="1" aria-label="Bulan berikutnya">${ic('chevr', 16)}</button>
      </div></div>
      <div class="cal-grid">` +
      DOW.map((d) => `<div class="cal-dow">${d}</div>`).join('');
    for (let i = 0; i < lead; i++) html += '<div class="cal-cell dim"></div>';
    for (let d = 1; d <= dim; d++) {
      const ds = y + '-' + pad(m + 1) + '-' + pad(d);
      const mk = (opts.marks && opts.marks[ds]) || {};
      const dot = mk.done && DOT[mk.done] ? `<i class="${DOT[mk.done]}"></i>` : '';
      const cls = ['cal-cell', ds === tiso ? 'today' : '', ds === opts.selected ? 'sel' : ''].join(' ');
      html += `<div class="${cls}" data-date="${ds}"><span class="cal-num">${d}</span><span class="cal-dots">${dot}</span></div>`;
    }
    html += `</div><div class="cal-legend">
      <span><i class="lg d-full"></i>Lengkap</span>
      <span><i class="lg d-part"></i>Sebagian</span>
      <span><i class="lg d-miss"></i>Belum lapor</span>
      <span><i class="lg d-task"></i>Terjadwal</span>
    </div>`;
    host.innerHTML = html;
    host.querySelectorAll('[data-nav]').forEach((b) => b.onclick = () => {
      const n = +b.dataset.nav;
      let ny = y, nm = m;
      if (n === 0) { ny = +tiso.slice(0, 4); nm = +tiso.slice(5, 7) - 1; }
      else { nm += n; if (nm < 0) { nm = 11; ny--; } if (nm > 11) { nm = 0; ny++; } }
      opts.onMonthChange && opts.onMonthChange(ny, nm);
    });
    host.querySelectorAll('.cal-cell[data-date]').forEach((c) => c.onclick = () => opts.onSelect && opts.onSelect(c.dataset.date));
  }

  return { ic, toast, sheet, closeSheet, pad, fmtLong, fmtShort, hb, initials, calendar };
})();
