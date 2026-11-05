/* =====================================================================
   SIPANDU — DATA DEMO (mock)
   Semua data di bawah adalah CONTOH untuk prototipe.
   Ganti dengan fetch() ke API/Supabase saat integrasi nyata.
   ===================================================================== */
window.DATA = (function () {
  'use strict';

  /* ---------- util ---------- */
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(s) {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  const TODAY = new Date();
  const TISO = iso(TODAY);
  const addDays = (n) => { const x = new Date(TODAY); x.setDate(x.getDate() + n); return iso(x); };
  function addMin(hm, m) {
    const p = hm.split('.'); let t = (+p[0]) * 60 + (+p[1]) + m;
    t = ((t % 1440) + 1440) % 1440;
    return pad(Math.floor(t / 60)) + '.' + pad(t % 60);
  }
  const CUACA = ['Cerah', 'Berawan', 'Hujan Ringan', 'Hujan Deras'];

  /* ---------- pengguna demo (1 akun per peran) ---------- */
  const USERS = {
    ppa: {
      id: 'ppa-01', role: 'ppa', roleName: 'PPA — Operator Pintu Air',
      name: 'Agus Setiawan', nip: '19870412 201001 1 004',
      unit: 'UPT Pemeliharaan Saluran — BWSDA',
      scope: '3 Pintu Air dalam tanggung jawab',
      items: ['BA.12', 'BA.13', 'BA.14']
    },
    pekarya: {
      id: 'pek-01', role: 'pekarya', roleName: 'Pekarya — Penjaga Saluran',
      name: 'Budi Hartono', nip: '19910208 201303 1 011',
      unit: 'Seksi Pemeliharaan Saluran — BWSDA',
      scope: '3 Ruas Saluran dalam tanggung jawab',
      items: ['Primer Kiri (KM 0+000–2+500)', 'Sekunder Srada II', 'Tersier T.04/B']
    },
    pengamat: {
      id: 'sp-01', role: 'pengamat', roleName: 'Staf Pengamat',
      name: 'Siti Rahmawati, S.T.', nip: '19850930 201203 2 002',
      unit: 'Seksi Pengaturan & Penyuluhan — BWSDA',
      scope: '1 D.I. — D.I. Srada (1.240 ha)',
      petugas: 26
    }
  };

  const TEAM = [
    'Sutrisno', 'Wahyu Nugroho', 'Endang Saputra', 'Retno Wulandari', 'Joko Purnomo',
    'Slamet Riyadi', 'Dwi Lestari', 'Ahmad Fauzi', 'Sugiyanto', 'Nur Hidayat',
    'Tri Susanto', 'Parto', 'Sukirman', 'Yulianto', 'Sri Mulyani', 'Bambang Hermanto',
    'Wagimin', 'Sunarto', 'Eko Prasetyo', 'Lilis Suryani', 'Darsono', 'Marno',
    'Agus Wibowo', 'Sarwo Edy', 'Tumini', 'Hadi Susilo'
  ];

  const TASK_TPL = {
    ppa: [
      { t: 'Pengaturan pintu sorog BA.12', c: 'Operasi Pintu Air', v: '2 bukaan × 25 cm' },
      { t: 'Pembersihan sampah depan pintu BA.13', c: 'Babat / Pembersihan', v: '± 150 m²' },
      { t: 'Pengecatan ulang sorog BA.12', c: 'Pemeliharaan Rutin', v: '12 m²' },
      { t: 'Pengamatan muka air BA.14 (tiap 3 jam)', c: 'Pengamatan', v: '8× pengamatan' },
      { t: 'Pelumasan roda giral BA.13', c: 'Pemeliharaan Rutin', v: '1 set' }
    ],
    pekarya: [
      { t: 'Babat pembersihan tanggul Primer Kiri', c: 'Babat / Pembersihan', v: '± 1.250 m²' },
      { t: 'Perbaikan lereng tanggul Sekunder Srada II', c: 'Perbaikan', v: '45 m³' },
      { t: 'Pengerukan sedimen Tersier T.04/B', c: 'Babat / Pembersihan', v: '80 m³' },
      { t: 'Patroli kondisi Primer Kiri', c: 'Patroli', v: '2,5 km' },
      { t: 'Potong rumput lereng Sekunder Srada II', c: 'Babat / Pembersihan', v: '600 m²' }
    ]
  };
  const TIMES = ['07.00', '07.30', '08.00', '08.30', '09.00', '10.00', '13.00', '13.30'];

  /* ---------- tugas harian per peran (terjadwal) ---------- */
  function tasksFor(role, ds) {
    if (role === 'pengamat') return [];
    const r = mulberry32(hash(role + ds));
    const n = 1 + Math.floor(r() * 2.4); // 1..3 tugas
    const start = Math.floor(r() * TASK_TPL[role].length);
    const out = [];
    for (let i = 0; i < n; i++) {
      const tpl = TASK_TPL[role][(start + i) % TASK_TPL[role].length];
      let loc;
      if (role === 'ppa') {
        const ba = (tpl.t.match(/BA\.\d+/) || [null])[0];
        loc = 'Pintu Air ' + (ba || USERS.ppa.items[i % 3]);
      } else {
        const t = tpl.t;
        loc = t.indexOf('Primer Kiri') >= 0 ? USERS.pekarya.items[0]
          : t.indexOf('Sekunder') >= 0 ? USERS.pekarya.items[1]
          : t.indexOf('Tersier') >= 0 ? USERS.pekarya.items[2]
          : USERS.pekarya.items[i % 3];
      }
      out.push({
        id: ds + '-t' + i,
        time: TIMES[Math.floor(r() * TIMES.length)],
        title: tpl.t, cat: tpl.c, vol: tpl.v,
        loc
      });
    }
    return out.sort((a, b) => a.time.localeCompare(b.time));
  }

  /* ---------- riwayat laporan per peran (90 hari, seed stabil) ---------- */
  function reportsFor(role, ds) {
    if (role === 'pengamat') return [];
    if (ds > TISO) return [];
    const r = mulberry32(hash('rep' + role + ds));
    const tasks = tasksFor(role, ds);
    const out = [];
    tasks.forEach((tk, i) => {
      const p = r();
      if (p < 0.16) return; // sesekali petugas tidak melapor (untuk demo kalender "belum lapor")
      const steps = p < 0.30 ? [0] : p < 0.62 ? [0, 100] : [0, 50, 100];
      out.push({
        id: ds + '-r' + i, date: ds, time: tk.time,
        task: tk.title, cat: tk.cat, loc: tk.loc, vol: tk.v,
        cuaca: CUACA[Math.floor(r() * 4)],
        progress: steps.includes(100) ? 100 : steps.includes(50) ? 50 : 0,
        photos: steps.map((s) => ({
          step: s,
          time: addMin(tk.time, s === 0 ? 0 : s === 50 ? 120 : 180) // contoh nyata: 08.00 → 10.00 → 11.00
        })),
        status: 'synced',
        ket: p < 0.45 ? '' : 'Pekerjaan sesuai jadwal, volume sesuai rencana anggaran biaya.'
      });
    });
    return out;
  }

  /* ---------- data tim (khusus Staf Pengamat) ---------- */
  function pickBelum(ds, n) {
    const r = mulberry32(hash('belum' + ds));
    const arr = TEAM.slice();
    const out = [];
    for (let i = 0; i < n && arr.length; i++) out.push(arr.splice(Math.floor(r() * arr.length), 1)[0]);
    return out;
  }
  function teamSummary(ds) {
    const r = mulberry32(hash('team' + ds));
    const past = ds <= TISO;
    const petugas = 26;
    const laporan = past ? 15 + Math.floor(r() * 10) : 0; // 15..24 dari 26
    const foto = laporan ? laporan * 2 + Math.floor(r() * laporan + 1) : 0;
    return {
      petugas, laporan, foto,
      belum: past && laporan < petugas ? pickBelum(ds, petugas - laporan) : [],
      vol: past ? (1.2 + r() * 2.4).toFixed(2).replace('.', ',') + ' rb m³/m²' : '—',
      bars: past ? [
        { k: 'Operasi Pintu Air', p: 60 + Math.floor(r() * 40) },
        { k: 'Babat / Pembersihan', p: 40 + Math.floor(r() * 55) },
        { k: 'Perbaikan', p: 30 + Math.floor(r() * 60) },
        { k: 'Patroli', p: 70 + Math.floor(r() * 30) }
      ] : []
    };
  }
  function teamTasks(ds) {
    const r = mulberry32(hash('ttask' + ds));
    const n = 4 + Math.floor(r() * 4);
    const isT = ds === TISO, past = ds < TISO;
    const out = [];
    for (let i = 0; i < n; i++) {
      const role = r() < 0.5 ? 'ppa' : 'pekarya';
      const tpl = TASK_TPL[role][Math.floor(r() * TASK_TPL[role].length)];
      const st = past ? 'Selesai' : isT ? (r() < 0.5 ? 'Selesai' : r() < 0.8 ? 'Berlangsung' : 'Terjadwal') : 'Terjadwal';
      out.push({
        id: ds + '-tt' + i,
        time: TIMES[Math.floor(r() * TIMES.length)],
        title: tpl.t, cat: tpl.c,
        loc: role === 'ppa' ? ('Pintu Air ' + USERS.ppa.items[Math.floor(r() * 3)]) : USERS.pekarya.items[Math.floor(r() * 3)],
        by: TEAM[Math.floor(r() * TEAM.length)],
        status: st
      });
    }
    return out.sort((a, b) => a.time.localeCompare(b.time));
  }
  function teamReports(ds) {
    if (ds > TISO) return [];
    const r = mulberry32(hash('trep' + ds));
    const tt = teamTasks(ds);
    const out = [];
    tt.forEach((t, i) => {
      if (r() < 0.3) return;
      const nPh = r() < 0.6 ? 3 : 2;
      out.push({
        id: ds + '-tr' + i, date: ds, time: t.time,
        task: t.title, cat: t.cat, loc: t.loc, vol: '—',
        cuaca: CUACA[Math.floor(r() * 4)],
        progress: nPh === 3 ? 100 : 50,
        photos: [{ step: 0, time: t.time },
                 { step: 50, time: addMin(t.time, 95) },
                 { step: 100, time: addMin(t.time, 180) }].slice(0, nPh),
        status: 'synced', by: t.by, ket: ''
      });
    });
    return out;
  }

  /* ---------- cache riwayat ---------- */
  let _hist = {};
  function historyFor(role) {
    if (_hist[role]) return _hist[role];
    const out = [];
    for (let i = 90; i >= 0; i--) {
      const ds = addDays(-i);
      if (role === 'pengamat') out.push(...teamReports(ds));
      else out.push(...reportsFor(role, ds));
    }
    _hist[role] = out;
    return out;
  }

  /* ---------- tanda kalender ---------- */
  function monthMarks(role, y, m) { // m: 0-11
    const marks = {};
    const dim = new Date(y, m + 1, 0).getDate();
    for (let d = 1; d <= dim; d++) {
      const ds = y + '-' + pad(m + 1) + '-' + pad(d);
      if (role === 'pengamat') {
        const s = teamSummary(ds);
        marks[ds] = { done: ds > TISO ? 'task' : s.laporan >= 22 ? 'full' : s.laporan > 0 ? 'part' : 'miss', count: s.laporan };
      } else {
        const t = tasksFor(role, ds), rp = reportsFor(role, ds);
        let done = 'none';
        if (ds > TISO) done = t.length ? 'task' : 'none';
        else if (t.length === 0) done = rp.length ? 'full' : 'none';
        else if (rp.length === 0) done = 'miss';
        else done = rp.length >= t.length ? 'full' : 'part';
        marks[ds] = { done, count: rp.length };
      }
    }
    return marks;
  }

  /* ---------- GeoJSON demo (area sekitar Sleman/Bantul — bukan data resmi) ---------- */
  const geo = {
    namaDI: 'D.I. Srada',
    infoDI: 'Kab. Sleman, D.I. Yogyakarta — 1.240 ha (data demo)',
    di: {
      name: 'D.I. Srada',
      polygon: [
        [-7.727, 110.452], [-7.726, 110.478], [-7.737, 110.492], [-7.760, 110.489],
        [-7.771, 110.470], [-7.768, 110.450], [-7.749, 110.441]
      ]
    },
    river: { name: 'Sungai Gadjah Wong (demo)', coords: [[-7.729, 110.466], [-7.741, 110.470], [-7.752, 110.475], [-7.764, 110.478]] },
    gates: [
      { id: 'BA.12', name: 'Pintu Air BA.12', pos: [-7.7330, 110.4680], kondisi: 'Normal', sorog: '3 pintu', lastReport: 'Hari ini 08.14 — Pengaturan bukaan 25 cm' },
      { id: 'BA.13', name: 'Pintu Air BA.13', pos: [-7.7460, 110.4721], kondisi: 'Siaga', sorog: '2 pintu', lastReport: 'Hari ini 07.32 — Pembersihan sampah depan pintu' },
      { id: 'BA.14', name: 'Pintu Air BA.14', pos: [-7.7580, 110.4766], kondisi: 'Normal', sorog: '2 pintu', lastReport: 'Kemarin 15.40 — Pengamatan muka air' }
    ],
    saluran: [
      {
        id: 'PRI-K', name: 'Saluran Primer Kiri', kondisi: 'Baik', panjang: '2,5 km', baku: 'Q 2,5 m³/dtk',
        coords: [[-7.7330, 110.4680], [-7.7345, 110.4600], [-7.7362, 110.4530], [-7.7385, 110.4478]]
      },
      {
        id: 'SEK-S2', name: 'Saluran Sekunder Srada II', kondisi: 'Rusak Ringan', panjang: '1,8 km', baku: 'Q 1,2 m³/dtk',
        coords: [[-7.7460, 110.4721], [-7.7490, 110.4655], [-7.7520, 110.4600], [-7.7548, 110.4552]]
      },
      {
        id: 'TER-T04B', name: 'Saluran Tersier T.04/B', kondisi: 'Rusak Berat', panjang: '0,9 km', baku: 'Q 0,4 m³/dtk',
        coords: [[-7.7520, 110.4600], [-7.7560, 110.4570], [-7.7590, 110.4530]]
      }
    ]
  };

  function geoFor(role) {
    if (role === 'ppa') return { gates: geo.gates, judul: 'Lokasi tugas: 3 Pintu Air' };
    if (role === 'pekarya') return { saluran: geo.saluran, judul: 'Ruas tugas: 3 Saluran' };
    return { di: geo.di, river: geo.river, gates: geo.gates, saluran: geo.saluran, judul: 'Cakupan: 1 D.I. — ' + geo.namaDI };
  }

  function reverseGeo(lat, lng) {
    if (lat < -7.71 && lat > -7.78 && lng > 110.43 && lng < 110.50)
      return 'Jl. Raya Kalasan–Tirtomartani, Sinduadi, Sleman, D.I. Yogyakarta';
    return 'Di luar cakupan D.I. (demo)';
  }

  return {
    USERS, TEAM, CUACA, TASK_TPL, TODAY, TISO,
    iso, pad, addDays, addMin,
    tasksFor, reportsFor, historyFor,
    teamSummary, teamTasks, teamReports, monthMarks,
    geo, geoFor, reverseGeo
  };
})();
