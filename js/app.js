/* =====================================================================
   SIPANDU — APLIKASI UTAMA
   Router hash sederhana, shell per-peran, halaman:
   Beranda • Laporan (rantai foto 0/50/100) • Riwayat • Dashboard
   (kalender profesional + rekap kerja) • Peta • Profil
   Navigasi: tab-bar bawah (mobile, auto-hide saat scroll) &
   sidebar (desktop ≥1900px).
   ===================================================================== */
window.App = (function () {
  'use strict';
  const $ = (id) => document.getElementById(id);

  const state = {
    user: null, page: 'home', draft: null,
    lastY: 0, calY: null, calM: null, calSel: null,
    installEvt: null
  };

  /* ================= SESI & LOGIN ================= */
  const saveSess = () => localStorage.setItem('sipandu-user', JSON.stringify(state.user));
  function loadSess() { try { return JSON.parse(localStorage.getItem('sipandu-user')); } catch (e) { return null; } }

  function bindLogin() {
    let sel = null;
    const cards = document.querySelectorAll('.role-card');
    const btn = $('btn-login');
    if (window.UI) {
      const lb = document.querySelector('.logo-badge');
      if (lb) lb.innerHTML = UI.ic('brand', 64);
      $('rc-ppa').innerHTML = UI.ic('pin', 22);
      $('rc-pek').innerHTML = UI.ic('layers', 22);
      $('rc-spg').innerHTML = UI.ic('grid', 22);
    }
    cards.forEach((c) => c.onclick = () => {
      cards.forEach((x) => x.classList.remove('sel'));
      c.classList.add('sel');
      sel = c.dataset.role;
      btn.disabled = false;
    });
    btn.onclick = () => sel && loginAs(sel);
  }

  function loginAs(role) {
    state.user = JSON.parse(JSON.stringify(DATA.USERS[role]));
    saveSess();
    enterApp();
    UI.toast('Selamat bekerja, ' + state.user.name.split(' ')[0] + ' — mode ' + state.user.roleName.split('—')[0].trim());
  }
  function enterApp() {
    $('screen-login').classList.add('hidden');
    $('screen-app').classList.remove('hidden');
    buildShell();
    go(state.user.role === 'pengamat' ? 'dash' : 'home');
    Sync.pump(true);
    refreshQueueBadge();
  }
  function logout() {
    localStorage.removeItem('sipandu-user');
    localStorage.removeItem('sipandu-draft');
    location.reload();
  }

  /* ================= SHELL & NAVIGASI ================= */
  function tabs() {
    const r = state.user.role;
    return r === 'pengamat'
      ? [{ id: 'dash', t: 'Dashboard', ic: 'grid' }, { id: 'riwayat', t: 'Riwayat', ic: 'clock' }, { id: 'peta', t: 'Peta', ic: 'map' }, { id: 'profil', t: 'Profil', ic: 'user' }]
      : [{ id: 'home', t: 'Beranda', ic: 'home' }, { id: 'laporan', t: 'Laporan', ic: 'clip' }, { id: 'kamera', t: 'Kamera', ic: 'camera', act: 1 }, { id: 'riwayat', t: 'Riwayat', ic: 'clock' }, { id: 'peta', t: 'Peta', ic: 'map' }];
  }
  function buildShell() {
    const ts = tabs();
    $('tabbar').innerHTML = ts.map((t) =>
      `<button class="tab ${t.act ? 'cam' : ''}" data-page="${t.id}">
        <span class="tab-ic">${UI.ic(t.ic, 24)}</span>
        <span class="tab-l">${t.t}</span>
        ${t.id === 'riwayat' ? '<span class="badge hidden" id="tab-badge"></span>' : ''}
      </button>`).join('');
    $('side-nav').innerHTML = ts.map((t) =>
      `<button class="snav" data-page="${t.id}">${UI.ic(t.ic, 22)}<span>${t.t}</span></button>`).join('');
    $('side-user').innerHTML =
      `<div class="avatar">${UI.initials(state.user.name)}</div>
       <div class="su-box"><div class="su-n">${state.user.name}</div><div class="su-r">${state.user.roleName}</div></div>`;
    document.querySelectorAll('#tabbar .tab, #side-nav .snav').forEach((b) => {
      b.onclick = () => { const p = b.dataset.page; p === 'kamera' ? quickCamera() : go(p); };
    });
    $('side-brand').innerHTML = UI.ic('brand', 34) + '<div><div class="sb-t">SIPANDU</div><div class="sb-s">Kementerian PUPR</div></div>';
  }

  function go(page) {
    if (state.user.role === 'pengamat' && (page === 'home' || page === 'laporan')) page = 'dash';
    state.page = page;
    document.querySelectorAll('.page').forEach((p) => p.classList.remove('active'));
    $('page-' + page).classList.add('active');
    document.querySelectorAll('#tabbar .tab, #side-nav .snav').forEach((b) => b.classList.toggle('active', b.dataset.page === page));
    if (page === 'home') renderHome();
    else if (page === 'laporan') renderLaporan();
    else if (page === 'riwayat') renderRiwayat();
    else if (page === 'dash') renderDash();
    else if (page === 'peta') renderPeta();
    else if (page === 'profil') renderProfil();
    $('main').scrollTop = 0;
    $('tabbar').classList.remove('hide');
    if (page === 'peta' && window.MapMod) MapMod.refresh();
  }
  const rerenderCurrent = () => go(state.page);

  /* auto-hide tab-bar saat scroll (mobile) */
  function bindScroll() {
    const main = $('main');
    main.addEventListener('scroll', () => {
      const y = main.scrollTop;
      if (y > state.lastY + 6 && y > 90) $('tabbar').classList.add('hide');
      else if (y < state.lastY - 6) $('tabbar').classList.remove('hide');
      state.lastY = y;
      const h = document.querySelector('.app-head');
      if (h) h.classList.toggle('scrolled', y > 8);
    }, { passive: true });
  }

  /* ================= KOMPONEN KECIL ================= */
  const stat = (ic, k, v, s) =>
    `<div class="stat"><span class="stat-ic">${UI.ic(ic, 20)}</span><span class="stat-v">${v}</span><span class="stat-k">${k}</span>${s ? `<span class="stat-s">${s}</span>` : ''}</div>`;

  function head(kicker, title) {
    return `<div class="app-head"><div class="head-row">
      <div><div class="kicker">${kicker}</div><h1 class="h-title">${title}</h1></div>
      <button class="avatar" data-prof="1">${UI.initials(state.user.name)}</button>
    </div></div>`;
  }

  /* ================= BERANDA ================= */
  function renderHome() {
    const u = state.user, ds = DATA.TISO;
    const tasks = DATA.tasksFor(u.role, ds);
    const mine = DATA.reportsFor(u.role, ds);
    const h = new Date().getHours();
    const greet = h < 11 ? 'Selamat pagi' : h < 15 ? 'Selamat siang' : h < 18 ? 'Selamat sore' : 'Selamat malam';
    DB.count('queue').then((q) => {
      $('page-home').innerHTML = head(greet + ',', u.name) +
        `<div class="scope-card"><div class="sc-ic">${UI.ic(u.role === 'ppa' ? 'pin' : u.role === 'pekarya' ? 'layers' : 'grid', 20)}</div>
          <div><div class="sc-t">${u.scope}</div><div class="sc-s">${u.items.join(' • ')}</div></div></div>
        <div class="stat-grid">
          ${stat('clip', 'Tugas Hari Ini', tasks.length, 'kegiatan')}
          ${stat('check', 'Laporan Hari Ini', mine.length, 'terkirim')}
          ${stat('camera', 'Foto Terkumpul', mine.reduce((a, x) => a + x.photos.length, 0), 'bukti foto')}
          ${stat('off', 'Antrian Offline', q, 'laporan')}
        </div>
        <div class="qa-grid">
          <button class="qa" data-qa="laporan"><span class="qa-ic">${UI.ic('plus', 22)}</span><span>Buat Laporan</span></button>
          <button class="qa" data-qa="kamera"><span class="qa-ic">${UI.ic('camera', 22)}</span><span>Kamera</span></button>
          <button class="qa" data-qa="peta"><span class="qa-ic">${UI.ic('map', 22)}</span><span>Peta Tugas</span></button>
          <button class="qa" data-qa="riwayat"><span class="qa-ic">${UI.ic('clock', 22)}</span><span>Riwayat</span></button>
        </div>
        <div class="card"><div class="card-t">${UI.ic('cal', 18)} Tugas Hari Ini</div>
          ${tasks.length ? tasks.map((t) => rowTask(t)).join('') : '<div class="empty">Tidak ada penugasan hari ini</div>'}
        </div>
        <div class="note-card">${UI.ic('info', 18)}<span>Laporan wajib menyertakan foto progres <b>0% → 50% → 100%</b>. Foto 50% disarankan selfie pekerjaan (gunakan countdown).</span></div>`;
      $('page-home').querySelectorAll('[data-qa]').forEach((b) => b.onclick = () => b.dataset.qa === 'kamera' ? quickCamera() : go(b.dataset.qa));
      $('page-home').querySelectorAll('[data-task]').forEach((b) => b.onclick = () => {
        const t = tasks.find((x) => x.id === b.dataset.task);
        startDraft(t || null);
      });
    });
  }
  function rowTask(t) {
    return `<button class="row" data-task="${t.id}">
      <span class="tl-time small">${t.time}</span>
      <span class="row-main"><span class="row-t">${t.title}</span><span class="row-s">${t.cat} • ${t.loc}</span></span>
      <span class="chev">${UI.ic('chevr', 18)}</span></button>`;
  }

  /* ================= LAPORAN (rantai foto 0/50/100) ================= */
  function persistDraft() { try { localStorage.setItem('sipandu-draft', JSON.stringify(state.draft)); } catch (e) { /* penuh */ } }
  function loadDraft() { try { state.draft = JSON.parse(localStorage.getItem('sipandu-draft')); } catch (e) { state.draft = null; } }

  function startDraft(task) {
    const u = state.user;
    state.draft = {
      taskId: task ? task.id : null,
      task: task ? task.title : 'Pekerjaan pemeliharaan lapangan',
      cat: task ? task.cat : 'Pemeliharaan Rutin',
      loc: task ? task.loc : (u.role === 'ppa' ? 'Pintu Air ' + u.items[0] : u.role === 'pekarya' ? u.items[0] : 'Wilayah D.I.'),
      vol: task ? task.vol : '',
      cuaca: 'Cerah', ket: '', sel: '0', photos: {},
      startedAt: new Date().toISOString()
    };
    persistDraft();
    go('laporan');
  }
  function newReportFor(loc) { // dari peta
    startDraft(null);
    state.draft.loc = loc;
    persistDraft();
    go('laporan');
  }

  function openCamera(step) {
    const d = state.draft;
    Cam.open({
      step, label: d.task,
      onShot: (img, meta) => {
        d.photos[step] = { img, meta };
        d.sel = step;
        persistDraft();
        go('laporan');
        UI.toast('Foto ' + step + '% tersimpan pada laporan (' + meta.orient + ', kompas ' + meta.heading + '°)');
      }
    });
  }
  function quickCamera() {
    if (!state.draft) startDraft(DATA.tasksFor(state.user.role, DATA.TISO)[0] || null);
    openCamera(state.draft.sel || '0');
  }

  function renderLaporan() {
    const el = $('page-laporan');
    const d = state.draft;
    if (!d) {
      const tasks = DATA.tasksFor(state.user.role, DATA.TISO);
      el.innerHTML = head('Laporan Harian', 'Buat Laporan') +
        `<div class="card"><div class="card-t">${UI.ic('clip', 18)} Pilih pekerjaan hari ini</div>
        ${tasks.length ? tasks.map((t, i) => `<button class="row" data-pick="${i}">
            <span class="row-ic">${UI.ic('clip', 20)}</span>
            <span class="row-main"><span class="row-t">${t.title}</span><span class="row-s">${t.time} • ${t.cat} • ${t.loc}</span></span>
            <span class="chev">${UI.ic('chevr', 18)}</span></button>`).join('')
          : '<div class="empty">Belum ada penugasan hari ini</div>'}
        <button class="btn btn-ghost btn-block" id="btn-generic">Laporan tanpa penugasan</button></div>`;
      el.querySelectorAll('[data-pick]').forEach((b) => b.onclick = () => startDraft(tasks[+b.dataset.pick]));
      $('btn-generic').onclick = () => startDraft(null);
      return;
    }
    const slot = (s) => {
      const p = d.photos[s];
      return `<div class="ph-slot ${p ? 'has' : ''}" data-step="${s}">
        ${p ? `<img src="${p.img}" alt="Foto ${s}%">` : ''}
        <span class="ph-badge">${s}%</span>
        ${p ? `<span class="ph-time">${UI.hb(p.meta.ts)}</span>` : `<span class="ph-add">${UI.ic('camera', 22)}</span>`}
      </div>`;
    };
    el.innerHTML = head('Laporan Harian', 'Laporan Progres') +
      `<div class="card"><div class="card-t">${UI.ic('clip', 18)} Pekerjaan</div>
        <div class="task-t">${d.task}</div><div class="task-s">${d.loc}${d.vol ? ' • ' + d.vol : ''}</div></div>
      <div class="card">
        <div class="card-t">${UI.ic('camera', 18)} Rantai Foto Progres</div>
        <div class="chain">${slot('0')}${slot('50')}${slot('100')}</div>
        <div class="chain-note">0% kondisi awal → 50% proses (selfie pekerjaan) → 100% hasil akhir. Setiap foto diberi watermark waktu, GPS & kompas otomatis; orientasi landscape/portrait mengikuti posisi ponsel.</div>
        <div class="seg" id="seg-step">
          ${['0', '50', '100'].map((s) => `<button data-s="${s}" class="${d.sel === s ? 'on' : ''}">${s}%${d.photos[s] ? ' ✓' : ''}</button>`).join('')}
        </div>
        <button class="btn btn-primary btn-block" id="btn-cam">${UI.ic('camera', 20)} Buka Kamera — Foto ${d.sel}%</button>
      </div>
      <div class="card">
        <div class="card-t">${UI.ic('clip', 18)} Detail Kegiatan</div>
        <div class="field"><label>Cuaca saat pekerjaan</label>
          <div class="seg" id="seg-cuaca">${DATA.CUACA.map((c) => `<button class="${d.cuaca === c ? 'on' : ''}">${c}</button>`).join('')}</div></div>
        <div class="field"><label>Volume realisasi</label><input id="f-vol" value="${d.vol || ''}" placeholder="cth: 1.250 m²"></div>
        <div class="field"><label>Keterangan</label><textarea id="f-ket" rows="3" placeholder="Kondisi lapangan, hambatan, tindak lanjut…">${d.ket || ''}</textarea></div>
      </div>
      <button class="btn btn-primary btn-block btn-send" id="btn-send">${UI.ic('send', 20)} Simpan & Kirim Laporan</button>
      <button class="btn btn-ghost btn-block" id="btn-cancel">Batalkan laporan ini</button>`;

    el.querySelectorAll('#seg-step button').forEach((b) => b.onclick = () => { d.sel = b.dataset.s; persistDraft(); renderLaporan(); });
    el.querySelectorAll('#seg-cuaca button').forEach((b) => b.onclick = () => { d.cuaca = b.textContent; persistDraft(); renderLaporan(); });
    el.querySelectorAll('.ph-slot').forEach((sl) => sl.onclick = () => {
      const s = sl.dataset.step;
      d.sel = s; persistDraft();
      openCamera(s);
    });
    $('btn-cam').onclick = () => openCamera(d.sel);
    $('f-vol').oninput = (e) => { d.vol = e.target.value; persistDraft(); };
    $('f-ket').oninput = (e) => { d.ket = e.target.value; persistDraft(); };
    $('btn-send').onclick = submitReport;
    $('btn-cancel').onclick = () => UI.sheet({
      title: 'Batalkan laporan?',
      html: '<p>Draft dan foto progres pada laporan ini akan dihapus.</p>',
      actions: [
        { label: 'Hapus draft', cls: 'btn-danger', onClick: () => { state.draft = null; localStorage.removeItem('sipandu-draft'); go('home'); } },
        { label: 'Kembali', cls: 'btn-ghost' }
      ]
    });
  }

  async function submitReport() {
    const d = state.draft;
    if (!d.photos['0'] || !d.photos['100']) {
      UI.sheet({
        title: 'Foto belum lengkap',
        html: '<p>Laporan wajib memiliki foto <b>0%</b> (kondisi awal) dan <b>100%</b> (hasil akhir). Foto <b>50%</b> disarankan sebagai selfie pekerjaan — gunakan fitur countdown.</p>',
        actions: [{ label: 'Mengerti', cls: 'btn-primary' }]
      });
      return;
    }
    const steps = Object.keys(d.photos).sort((a, b) => +a - +b);
    const rep = {
      id: 'u' + Date.now(), date: DATA.TISO,
      time: UI.hb(d.startedAt), task: d.task, cat: d.cat, loc: d.loc,
      vol: d.vol, cuaca: d.cuaca, ket: d.ket || '',
      progress: steps.includes('100') ? 100 : steps.includes('50') ? 50 : 0,
      photos: steps.map((s) => ({ step: +s, time: UI.hb(d.photos[s].meta.ts), img: d.photos[s].img })),
      status: 'queued'
    };
    await DB.put('queue', rep);
    state.draft = null;
    localStorage.removeItem('sipandu-draft');
    refreshQueueBadge();
    UI.toast(navigator.onLine && !Sync.demoOffline ? 'Laporan terkirim — menyinkronkan…' : 'Laporan masuk antrian offline');
    Sync.pump(true);
    go('riwayat');
  }

  /* ================= RIWAYAT ================= */
  async function renderRiwayat() {
    const el = $('page-riwayat');
    const mine = await DB.all('reports');
    const q = await DB.all('queue');
    const demo = DATA.historyFor(state.user.role);
    const all = [...q, ...mine, ...demo].sort((a, b) => (b.date + (b.time || '')).localeCompare(a.date + (a.time || '')));
    el.innerHTML = head('Riwayat', 'Riwayat Laporan') +
      `<div class="mchips">
        <div class="mchip c-blue"><span>${mine.filter((x) => x.status === 'synced').length + demo.length}</span>Terkirim</div>
        <div class="mchip c-orange"><span>${q.length}</span>Antrian</div>
      </div>
      <div class="card list">
        ${all.length ? all.map((r, i) => riwRow(r, i)).join('') : '<div class="empty">Belum ada laporan</div>'}
      </div>`;
    el.querySelectorAll('[data-riw]').forEach((b) => b.onclick = () => riwDetail(all[+b.dataset.riw]));
    refreshQueueBadge();
  }
  function riwRow(r, i) {
    const st = r.status === 'synced'
      ? '<span class="chip chip-green">Terkirim</span>'
      : '<span class="chip chip-orange">Antrian</span>';
    const ph = (r.photos || []).map((p) => p.img
      ? `<img src="${p.img}" alt="foto ${p.step}%">`
      : `<span class="ph-demo">${UI.ic('camera', 14)}</span>`).join('');
    return `<button class="row" data-riw="${i}">
      <span class="row-ic">${UI.ic('clip', 20)}</span>
      <span class="row-main">
        <span class="row-t">${r.task}</span>
        <span class="row-s">${UI.fmtShort(r.date)} • ${r.time || ''} • ${r.loc || ''}${r.by ? ' • ' + r.by : ''}</span>
        <span class="ph-strip">${ph}</span>
      </span>
      <span class="row-side">${st}<span class="prg">${r.progress || 0}%</span></span>
    </button>`;
  }
  function riwDetail(r) {
    const ph = (r.photos || []).map((p) =>
      `<div class="dt-ph">${p.img
        ? `<img src="${p.img}" alt="foto ${p.step}%">`
        : `<div class="ph-demo big">${UI.ic('camera', 26)}<span>Foto demo</span></div>`}
        <div class="dt-ph-m"><b>${p.step}%</b> • ${p.time}</div></div>`).join('');
    UI.sheet({
      title: r.task,
      html:
        `<div class="dt-chips">
          <span class="chip chip-blue">${r.progress || 0}%</span>
          <span class="chip chip-gray">${r.cat || 'Kegiatan'}</span>
          ${r.cuaca ? `<span class="chip chip-gray">${r.cuaca}</span>` : ''}
          ${r.status === 'synced' ? '<span class="chip chip-green">Terkirim</span>' : '<span class="chip chip-orange">Antrian offline</span>'}
        </div>
        <div class="dt-row">${UI.ic('pin', 16)} ${r.loc || '—'}</div>
        <div class="dt-row">${UI.ic('cal', 16)} ${UI.fmtLong(r.date)} • ${r.time || ''}</div>
        ${r.vol ? `<div class="dt-row">${UI.ic('clip', 16)} Volume: ${r.vol}</div>` : ''}
        ${r.by ? `<div class="dt-row">${UI.ic('user', 16)} Pelapor: ${r.by}</div>` : ''}
        ${r.ket ? `<p class="dt-ket">${r.ket}</p>` : ''}
        <div class="dt-phs">${ph}</div>`,
      actions: [{ label: 'Tutup', cls: 'btn-ghost' }]
    });
  }

  /* ================= DASHBOARD PENGAMAT (kalender + rekap) ================= */
  function renderDash() {
    const el = $('page-dash');
    const ds = DATA.TISO;
    if (state.calY == null) { state.calY = +ds.slice(0, 4); state.calM = +ds.slice(5, 7) - 1; }
    state.calSel = state.calSel || ds;
    const sum = DATA.teamSummary(ds);
    DB.count('queue').then((q) => {
      el.innerHTML = head('Dashboard Pengawasan', 'Dashboard') +
        `<div class="stat-grid s4">
          ${stat('user', 'Petugas', sum.petugas, 'aktif')}
          ${stat('check', 'Laporan Hari Ini', sum.laporan, 'dari ' + sum.petugas)}
          ${stat('camera', 'Foto Terkumpul', sum.foto, 'bukti lapangan')}
          ${stat('off', 'Antrian Sync', q, 'perangkat')}
        </div>
        <div class="card"><div class="card-t">${UI.ic('cal', 18)} Kalender Kinerja</div><div id="cal-host"></div></div>
        <div id="day-detail"></div>`;
      drawCal();
      drawDay();
    });
  }
  function drawCal() {
    const marks = DATA.monthMarks('pengamat', state.calY, state.calM);
    UI.calendar($('cal-host'), {
      y: state.calY, m: state.calM, marks, selected: state.calSel,
      onMonthChange: (y, m) => { state.calY = y; state.calM = m; drawCal(); },
      onSelect: (ds) => { state.calSel = ds; drawCal(); drawDay(); }
    });
  }
  function drawDay() {
    const ds = state.calSel;
    const tasks = DATA.teamTasks(ds);
    const sum = DATA.teamSummary(ds);
    $('day-detail').innerHTML =
      `<div class="card">
        <div class="card-t">${UI.ic('clock', 18)} Tugas & History — ${UI.fmtLong(ds)}</div>
        <div class="timeline">${tasks.map(tlRow).join('')}</div>
      </div>
      <div class="card">
        <div class="card-t">${UI.ic('grid', 18)} Rekap Kerja — ${UI.fmtLong(ds)}</div>
        <div class="stat-grid s2">
          ${stat('check', 'Laporan Masuk', sum.laporan, 'dari ' + sum.petugas + ' petugas')}
          ${stat('camera', 'Foto Terkumpul', sum.foto, 'bukti lapangan')}
          ${stat('drop', 'Volume Realisasi', sum.vol, 'seluruh kegiatan')}
          ${stat('alert', 'Belum Lapor', sum.belum.length, 'petugas')}
        </div>
        ${sum.bars.length ? `<div class="bars">${sum.bars.map((b) =>
          `<div class="bar"><span class="bar-k">${b.k}</span><span class="bar-track"><span class="bar-fill" style="width:${b.p}%"></span></span><span class="bar-p">${b.p}%</span></div>`).join('')}</div>` : ''}
        ${sum.belum.length ? `<div class="belum"><div class="belum-t">Petugas belum melapor:</div><div class="belum-chips">${sum.belum.map((n) => `<span class="chip chip-red">${n}</span>`).join('')}</div></div>` : ''}
      </div>`;
  }
  function tlRow(t) {
    const cls = t.status === 'Selesai' ? 'chip-green' : t.status === 'Berlangsung' ? 'chip-blue' : 'chip-gray';
    return `<div class="tl-item">
      <div class="tl-time">${t.time}</div>
      <div class="tl-dot ${t.status === 'Selesai' ? 'ok' : ''}"></div>
      <div class="tl-main"><div class="tl-t">${t.title}</div><div class="tl-s">${t.loc} • ${t.by}</div></div>
      <span class="chip ${cls}">${t.status}</span></div>`;
  }

  /* ================= PETA ================= */
  function renderPeta() {
    const g = DATA.geoFor(state.user.role);
    const icon = state.user.role === 'ppa' ? 'pin' : state.user.role === 'pekarya' ? 'layers' : 'map';
    $('page-peta').innerHTML = head('Peta Tugas', 'Peta') +
      `<div class="scope-card"><div class="sc-ic">${UI.ic(icon, 20)}</div>
        <div><div class="sc-t">${g.judul}</div><div class="sc-s">${state.user.role === 'pengamat' ? DATA.geo.infoDI : 'Ketuk marker / garis untuk detail & buat laporan'}</div></div></div>
      <div class="map-card"><div id="map-canvas"></div></div>`;
    MapMod.init();
  }

  /* ================= PROFIL ================= */
  function renderProfil() {
    const u = state.user;
    $('page-profil').innerHTML = head('Akun', 'Profil') +
      `<div class="card prof">
        <div class="avatar big">${UI.initials(u.name)}</div>
        <div class="prof-t">${u.name}</div><div class="prof-s">${u.roleName}</div>
        <div class="prof-meta">${u.unit}<br>NIP ${u.nip}</div>
      </div>
      <div class="card list">
        <div class="row"><span class="row-ic">${UI.ic('pin', 20)}</span><span class="row-main"><span class="row-t">Cakupan tugas</span><span class="row-s">${u.scope}</span></span></div>
        <div class="row"><span class="row-ic">${UI.ic('cloud', 20)}</span><span class="row-main"><span class="row-t">Status jaringan</span><span class="row-s" id="net-stat"></span></span></div>
        <button class="row" id="btn-install"><span class="row-ic">${UI.ic('dl', 20)}</span><span class="row-main"><span class="row-t">Instal aplikasi (PWA)</span><span class="row-s">Tambahkan ke layar utama</span></span><span class="chev">${UI.ic('chevr', 18)}</span></button>
      </div>
      <div class="card list">
        <div class="row"><span class="row-ic">${UI.ic('off', 20)}</span><span class="row-main"><span class="row-t">Mode offline (demo)</span><span class="row-s">Tahan laporan di antrian meski online</span></span><span class="row-side"><span class="ios-sw ${Sync.demoOffline ? 'on' : ''}" id="sw-off"></span></span></div>
        <button class="row" id="btn-logout"><span class="row-ic danger">${UI.ic('logout', 20)}</span><span class="row-main"><span class="row-t danger">Keluar / Ganti akun</span></span></button>
      </div>
      <div class="ver">SIPANDU v1.0.0 — Prototipe PWA<br>Data disimpan lokal di perangkat (demo)</div>`;
    $('net-stat').textContent = navigator.onLine ? 'Online — sinkronisasi aktif' : 'Offline — laporan masuk antrian';
    $('sw-off').onclick = () => {
      Sync.demoOffline = !Sync.demoOffline;
      $('sw-off').classList.toggle('on', Sync.demoOffline);
      UI.toast(Sync.demoOffline ? 'Mode offline demo AKTIF — laporan ditahan di antrian' : 'Mode offline demo MATI — mencoba sinkron…');
      if (!Sync.demoOffline) Sync.pump();
    };
    $('btn-install').onclick = async () => {
      if (state.installEvt) {
        state.installEvt.prompt();
        state.installEvt = null;
      } else {
        UI.sheet({
          title: 'Instal ke Layar Utama',
          html: '<p><b>iPhone/iPad (Safari):</b> tombol Bagikan → "Tambahkan ke Layar Utama".<br><br><b>Android (Chrome):</b> menu ⋮ → "Instal aplikasi" / "Tambahkan ke layar utama".<br><br>Setelah terinstal, aplikasi berjalan layar penuh seperti aplikasi native.</p>',
          actions: [{ label: 'Mengerti', cls: 'btn-primary' }]
        });
      }
    };
    $('btn-logout').onclick = logout;
  }

  /* ================= BADGE ANTRIAN ================= */
  async function refreshQueueBadge() {
    const b = $('tab-badge');
    if (!b) return;
    const n = await DB.count('queue');
    b.textContent = n;
    b.classList.toggle('hidden', !n);
  }

  /* ================= BOOT ================= */
  function boot() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
    }
    window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); state.installEvt = e; });
    loadDraft();
    bindLogin();
    bindScroll();
    document.addEventListener('click', (e) => {
      const a = e.target.closest('[data-prof]');
      if (a) go('profil');
    });
    const sess = loadSess();
    if (sess && DATA.USERS[sess.role]) {
      state.user = sess;
      enterApp();
    }
    setInterval(() => Sync.pump(true), 30000);
    window.addEventListener('online', () => renderNet());
    window.addEventListener('offline', () => renderNet());
    function renderNet() {
      const n = $('net-stat');
      if (n && state.page === 'profil') n.textContent = navigator.onLine ? 'Online — sinkronisasi aktif' : 'Offline — laporan masuk antrian';
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  return {
    state, go, loginAs, refreshQueueBadge, rerenderCurrent, newReportFor, quickCamera
  };
})();
