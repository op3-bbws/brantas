/* =====================================================================
   SIPANDU — IndexedDB (antrean offline) + simulasi sinkronisasi
   Alur nyata nanti: queue -> POST ke Supabase -> Sheets (lihat blueprint).
   ===================================================================== */
window.DB = (function () {
  'use strict';
  let dbp = null;

  function open() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      const rq = indexedDB.open('sipandu-db', 1);
      rq.onupgradeneeded = (e) => {
        const d = e.target.result;
        if (!d.objectStoreNames.contains('queue')) d.createObjectStore('queue', { keyPath: 'id' });
        if (!d.objectStoreNames.contains('reports')) d.createObjectStore('reports', { keyPath: 'id' });
      };
      rq.onsuccess = () => res(rq.result);
      rq.onerror = () => rej(rq.error);
    });
    return dbp;
  }
  async function tx(store, mode) {
    const d = await open();
    return d.transaction(store, mode).objectStore(store);
  }
  const wrap = (rq) => new Promise((res, rej) => {
    rq.onsuccess = () => res(rq.result);
    rq.onerror = () => rej(rq.error);
  });

  return {
    put: (s, v) => tx(s, 'readwrite').then((st) => wrap(st.put(v))),
    del: (s, k) => tx(s, 'readwrite').then((st) => wrap(st.delete(k))),
    all: (s) => tx(s, 'readonly').then((st) => wrap(st.getAll())),
    count: (s) => tx(s, 'readonly').then((st) => wrap(st.count())),
    clear: (s) => tx(s, 'readwrite').then((st) => wrap(st.clear()))
  };
})();

/* Simulasi pengiriman: saat online, isi antrian dipindah ke reports.
   Pada sistem nyata: POST ke Supabase REST / GAS Web App. */
window.Sync = {
  busy: false,
  demoOffline: false, // toggle di halaman Profil (untuk demo antrian offline)
  async pump(silent) {
    if (this.busy || this.demoOffline) return 0;
    if (!navigator.onLine) return 0;
    this.busy = true;
    try {
      const items = await DB.all('queue');
      let n = 0;
      for (const it of items) {
        await new Promise((r) => setTimeout(r, 650)); // simulasi latensi jaringan
        it.status = 'synced';
        it.syncedAt = new Date().toISOString();
        await DB.put('reports', it);
        await DB.del('queue', it.id);
        n++;
      }
      if (n && !silent && window.UI) UI.toast(n + ' laporan tersinkronisasi');
      if (window.App && App.refreshQueueBadge) App.refreshQueueBadge();
      if (window.App && App.rerenderCurrent && !silent) App.rerenderCurrent();
      return n;
    } finally {
      this.busy = false;
    }
  }
};
window.addEventListener('online', () => { if (window.Sync) Sync.pump(); });
