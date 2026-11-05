/* =====================================================================
   SIPANDU — KAMERA FULLSCREEN
   Fitur: preview penuh, watermark ala Timemark (GPS+waktu+alamat+kompas),
   countdown selfie (off/3/5/10 dtk), switch kamera depan/belakang,
   torch, auto-rotate landscape/portrait (layout + watermark mengikuti),
   kunci orientasi, konfirmasi foto (Ulangi / Gunakan).
   ===================================================================== */
window.Cam = (function () {
  'use strict';
  const $ = (id) => document.getElementById(id);

  let stream = null, facing = 'environment', cd = 0, cdTimer = null;
  let step = '0', label = '', onShot = null;
  let gps = null, gpsDemo = false;
  let heading = 245, headingMode = 'demo';
  let liveInt = null, torch = false;

  const isLand = () => (screen.orientation && screen.orientation.type)
    ? screen.orientation.type.startsWith('landscape')
    : (window.innerWidth > window.innerHeight);

  /* ---------- format waktu (selalu WIB untuk demo) ---------- */
  const fmtClock = (d) => new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(d);
  const fmtDate = (d) => new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
  const dirName = (h) => ['Utara', 'Timur Laut', 'Timur', 'Tenggara', 'Selatan', 'Barat Daya', 'Barat', 'Barat Laut'][Math.round(h / 45) % 8];
  const coordTxt = () => gps ? gps.lat.toFixed(6) + ', ' + gps.lng.toFixed(6) + '  ±' + gps.acc + ' m' : 'GPS: menunggu sinyal…';
  const headingTxt = () => Math.round(heading) + '° ' + dirName(heading);

  /* ---------- orientasi otomatis ---------- */
  function refreshOrient() { $('camera').classList.toggle('cam-land', isLand()); }

  /* ---------- buka/tutup ---------- */
  async function open(opts) {
    step = opts.step; label = opts.label || ''; onShot = opts.onShot || null;
    $('cam-title').textContent = 'Foto Progres ' + step + '%';
    $('cam-hint').textContent = 'Foto tersimpan sebagai bukti progres ' + step + '% pada laporan';
    $('wm-step').textContent = 'LAPORAN ' + step + '% — ' + (label || 'PEKERJAAN LAPANGAN').toUpperCase();
    $('camera').classList.remove('hidden');
    document.body.classList.add('lock');
    refreshOrient();
    requestGeo();
    bindCompass();
    startLive();
    await startStream();
    tryFull(true);
  }
  function close() {
    cancelCd(); stopLive(); stopTracks(); tryFull(false);
    $('camera').classList.add('hidden');
    $('cam-confirm').classList.remove('open');
    $('cam-error').classList.add('hidden');
    document.body.classList.remove('lock');
  }

  async function startStream() {
    stopTracks();
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      const v = $('cam-video');
      v.srcObject = stream;
      await v.play().catch(() => {});
      $('cam-error').classList.add('hidden');
      torch = false; $('cam-flash').classList.remove('on');
    } catch (err) {
      showErr(err);
    }
  }
  function stopTracks() { if (stream) { stream.getTracks().forEach((t) => t.stop()); stream = null; } }
  function showErr(err) {
    $('cam-error').classList.remove('hidden');
    $('cam-err-detail').textContent =
      (err && err.name ? err.name : 'Error') +
      ' — kamera tidak dapat diakses. Berikan izin kamera pada browser, dan pastikan situs dibuka via HTTPS (GitHub Pages) atau localhost. Di iOS: gunakan Safari → Berbagi → Tambahkan ke Layar Utama.';
  }

  /* ---------- GPS + alamat (geocode balik demo) ---------- */
  function requestGeo() {
    if (!navigator.geolocation) { demoGeo(); return; }
    navigator.geolocation.getCurrentPosition((p) => {
      gps = {
        lat: p.coords.latitude, lng: p.coords.longitude,
        acc: Math.max(1, Math.round(p.coords.accuracy || 5)),
        alt: p.coords.altitude != null ? Math.round(p.coords.altitude) : 132
      };
      gpsDemo = false;
      $('wm-addr').textContent = DATA.reverseGeo(gps.lat, gps.lng);
      updateLive();
    }, () => demoGeo(), { enableHighAccuracy: true, timeout: 8000, maximumAge: 20000 });
  }
  function demoGeo() {
    if (gps) return;
    gps = { lat: -7.7412, lng: 110.4688, acc: 5, alt: 132 };
    gpsDemo = true;
    $('wm-addr').textContent = DATA.reverseGeo(gps.lat, gps.lng) + ' — GPS demo (izinkan lokasi)';
    updateLive();
  }

  /* ---------- kompas ---------- */
  function bindCompass() {
    if (bindCompass._b) return;
    bindCompass._b = true;
    const h = (e) => {
      let hd = null;
      if (typeof e.webkitCompassHeading === 'number') hd = e.webkitCompassHeading;
      else if (typeof e.alpha === 'number') hd = 360 - e.alpha;
      if (hd != null && isFinite(hd)) { heading = (hd + 360) % 360; headingMode = 'sensor'; }
    };
    window.addEventListener('deviceorientationabsolute', h, true);
    window.addEventListener('deviceorientation', h, true);
  }

  /* ---------- overlay watermark langsung (pratinjau) ---------- */
  function startLive() {
    stopLive(); updateLive();
    liveInt = setInterval(() => {
      if (headingMode === 'demo') heading = (heading + 0.4) % 360; // kompas demo bergerak halus
      updateLive();
    }, 500);
  }
  function stopLive() { if (liveInt) { clearInterval(liveInt); liveInt = null; } }
  function updateLive() {
    const now = new Date();
    $('wm-time').textContent = fmtClock(now) + ' WIB';
    $('wm-date').textContent = fmtDate(now);
    $('wm-coords').textContent = coordTxt();
    $('wm-alt').textContent = 'Alt ' + (gps ? gps.alt + ' m dpl' : '—') + (headingMode === 'demo' ? '  •  Kompas demo' : '');
    $('wm-compass').textContent = headingTxt();
  }

  /* ---------- WATERMARK pada foto (ala Timemark) ---------- */
  function rr(x, px, py, w, h, r) {
    if (x.roundRect) { x.beginPath(); x.roundRect(px, py, w, h, r); }
    else { x.beginPath(); x.rect(px, py, w, h); }
  }
  function drawPin(x, px, py, s) {
    x.beginPath();
    x.arc(px, py, 6.2 * s, Math.PI * 0.8, Math.PI * 2.2);
    x.lineTo(px, py + 10 * s);
    x.closePath(); x.fill();
    const keep = x.fillStyle;
    x.fillStyle = 'rgba(0,0,0,.6)';
    x.beginPath(); x.arc(px, py - 1.4 * s, 2.3 * s, 0, 7); x.fill();
    x.fillStyle = keep;
  }
  function drawWM(x, w, h) {
    const s = Math.min(w, h) / 420, pad = 18 * s;
    const F = (wt, sz) => wt + ' ' + sz + 'px -apple-system,"Segoe UI",Roboto,"Helvetica Neue",sans-serif';
    // gradien bawah
    const gh = h * 0.26;
    let g = x.createLinearGradient(0, h - gh * 1.35, 0, h);
    g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.42, 'rgba(0,0,0,.5)'); g.addColorStop(1, 'rgba(0,0,0,.82)');
    x.fillStyle = g; x.fillRect(0, h - gh * 1.35, w, gh * 1.35);
    // gradien atas
    g = x.createLinearGradient(0, 0, 0, 110 * s);
    g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    x.fillStyle = g; x.fillRect(0, 0, w, 110 * s);
    x.textBaseline = 'alphabetic';

    // kiri-atas: brand + chip laporan
    x.textAlign = 'left';
    x.fillStyle = 'rgba(255,255,255,.95)';
    x.font = F('800', 13 * s);
    x.fillText('SIPANDU • KEMENTERIAN PUPR', pad, 34 * s);
    const st = 'LAPORAN ' + step + '% — ' + (label || 'PEKERJAAN LAPANGAN').toUpperCase();
    x.font = F('700', 11.5 * s);
    const tw = x.measureText(st).width;
    x.fillStyle = 'rgba(247,148,29,.94)';
    rr(x, pad, 44 * s, tw + 18 * s, 22 * s, 11 * s); x.fill();
    x.fillStyle = '#fff';
    x.fillText(st, pad + 9 * s, 59.5 * s);

    // kanan-atas: kompas
    const ct = headingTxt();
    x.font = F('700', 13 * s);
    const cw = x.measureText(ct).width;
    x.fillStyle = 'rgba(0,0,0,.45)';
    rr(x, w - cw - 30 * s, pad, cw + 20 * s, 24 * s, 12 * s); x.fill();
    x.fillStyle = '#fff';
    x.fillText(ct, w - pad - 10 * s, pad + 16.5 * s);

    // kanan-bawah: waktu besar + tanggal (ala Timemark)
    const now = new Date();
    x.textAlign = 'right';
    x.fillStyle = '#fff';
    x.font = F('800', 30 * s);
    x.fillText(fmtClock(now) + ' WIB', w - pad, h - pad - 26 * s);
    x.font = F('600', 14.5 * s);
    x.fillStyle = 'rgba(255,255,255,.92)';
    x.fillText(fmtDate(now), w - pad, h - pad);

    // kiri-bawah: pin + koordinat + alt + alamat
    x.textAlign = 'left';
    let y = h - pad;
    x.font = F('600', 13 * s);
    x.fillStyle = 'rgba(255,255,255,.92)';
    x.fillText($('wm-addr').textContent, pad, y);
    y -= 21 * s;
    x.font = F('700', 13.5 * s); x.fillStyle = '#fff';
    x.fillText('Alt ' + (gps ? gps.alt + ' m dpl' : '—'), pad, y);
    y -= 21 * s;
    drawPin(x, pad + 5 * s, y - 4.5 * s, s);
    x.fillText(coordTxt(), pad + 14 * s, y);
  }

  /* ---------- tangkap + konfirmasi ---------- */
  function captureNow() {
    const v = $('cam-video');
    if (!stream || !v.videoWidth) { if (window.UI) UI.toast('Kamera belum siap — coba lagi'); return; }
    const w = v.videoWidth, h = v.videoHeight;
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    if (facing === 'user') { x.translate(w, 0); x.scale(-1, 1); }
    x.drawImage(v, 0, 0, w, h);
    x.setTransform(1, 0, 0, 1, 0, 0);
    drawWM(x, w, h);
    $('cam-shot').src = c.toDataURL('image/jpeg', 0.9);
    $('cam-confirm').classList.add('open');
  }
  function makeThumb(dataUrl, maxW) {
    return new Promise((res) => {
      const im = new Image();
      im.onload = () => {
        const sc = Math.min(1, maxW / im.width);
        const c = document.createElement('canvas');
        c.width = Math.round(im.width * sc);
        c.height = Math.round(im.height * sc);
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.78));
      };
      im.src = dataUrl;
    });
  }
  async function usePhoto() {
    const full = $('cam-shot').src;
    const thumb = await makeThumb(full, 720);
    const meta = {
      step, ts: new Date().toISOString(),
      lat: gps ? gps.lat : null, lng: gps ? gps.lng : null, acc: gps ? gps.acc : null,
      address: $('wm-addr').textContent,
      heading: Math.round(heading), dir: dirName(heading),
      orient: isLand() ? 'landscape' : 'portrait', facing, demo: gpsDemo
    };
    close();
    onShot && onShot(thumb, meta, full);
  }

  /* ---------- countdown selfie ---------- */
  function shutter() {
    if (cdTimer) { cancelCd(); return; } // tekan lagi = batal
    if (cd > 0) {
      let n = cd;
      const el = $('cam-count');
      el.classList.remove('hidden');
      const tick = () => {
        if (n <= 0) { cancelCd(); captureNow(); return; }
        el.textContent = n;
        el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop');
        n--;
      };
      tick();
      cdTimer = setInterval(tick, 1000);
    } else captureNow();
  }
  function cancelCd() {
    if (cdTimer) { clearInterval(cdTimer); cdTimer = null; }
    $('cam-count').classList.add('hidden');
  }

  /* ---------- torch / switch / kunci orientasi ---------- */
  async function toggleTorch() {
    if (!stream) return;
    const tr = stream.getVideoTracks()[0];
    try {
      await tr.applyConstraints({ advanced: [{ torch: !torch }] });
      torch = !torch;
      $('cam-flash').classList.toggle('on', torch);
    } catch (e) {
      if (window.UI) UI.toast('Lampu kilat tidak didukung perangkat ini');
    }
  }
  async function switchCam() {
    facing = facing === 'environment' ? 'user' : 'environment';
    $('cam-video').classList.toggle('mirror', facing === 'user');
    await startStream();
  }
  async function lockOrient() {
    try {
      if (screen.orientation && screen.orientation.lock) {
        await screen.orientation.lock(isLand() ? 'landscape' : 'portrait');
        if (window.UI) UI.toast('Orientasi layar dikunci');
      } else if (window.UI) UI.toast('Kunci orientasi tidak didukung browser ini');
    } catch (e) { if (window.UI) UI.toast('Kunci orientasi tidak didukung browser ini'); }
  }
  async function tryFull(on) {
    try {
      if (on && !document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      } else if (!on && document.fullscreenElement) {
        await document.exitFullscreen();
      }
    } catch (e) { /* diabaikan — iOS Safari tidak mendukung */ }
  }

  /* ---------- init ---------- */
  function init() {
    refreshOrient();
    window.addEventListener('resize', refreshOrient);
    window.addEventListener('orientationchange', refreshOrient);
    if (screen.orientation && screen.orientation.addEventListener) {
      screen.orientation.addEventListener('change', refreshOrient);
    }
    if (window.UI) {
      $('cam-close').innerHTML = UI.ic('x', 20);
      $('cam-orient').innerHTML = UI.ic('rotate', 20);
      $('cam-flash').innerHTML = UI.ic('bolt', 20);
      $('cam-switch').innerHTML = UI.ic('flip', 20);
    }
    $('cam-close').onclick = close;
    $('cam-err-close').onclick = close;
    $('cam-shutter').onclick = shutter;
    $('cam-flash').onclick = toggleTorch;
    $('cam-switch').onclick = switchCam;
    $('cam-orient').onclick = lockOrient;
    $('cam-retake').onclick = () => $('cam-confirm').classList.remove('open');
    $('cam-use').onclick = usePhoto;
    document.querySelectorAll('#cd-chips button').forEach((b) => b.onclick = () => {
      cd = +b.dataset.cd;
      document.querySelectorAll('#cd-chips button').forEach((x) => x.classList.toggle('on', x === b));
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  return { open, close, isLand };
})();
