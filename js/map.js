/* =====================================================================
   SIPANDU — PETA PER-ROLE (Leaflet via CDN, offline setelah cache SW)
   - Staf Pengamat : 1 D.I. (poligon) + sungai + pintu air + saluran
   - PPA           : marker pintu air yang menjadi tanggung jawabnya
   - Pekarya       : ruas saluran (garis) yang menjadi tanggung jawabnya
   Data demo — bukan geo-data resmi.
   ===================================================================== */
window.MapMod = (function () {
  'use strict';
  let map = null, inited = false;

  const kondisiColor = (k) => k === 'Baik' ? '#34C759' : k === 'Rusak Ringan' ? '#FF9500' : '#FF3B30';
  const gateColor = (k) => k === 'Normal' ? '#34C759' : k === 'Siaga' ? '#FF9500' : '#FF3B30';

  function init() {
    if (inited) return;
    const host = document.getElementById('map-canvas');
    inited = true;
    if (!window.L) {
      host.innerHTML = '<div class="map-fallback">' + UI.ic('cloud', 28) +
        '<p>Peta memerlukan koneksi internet pada pembukaan pertama<br>(Leaflet & peta dasar dimuat via CDN, lalu di-cache Service Worker).</p></div>';
      return;
    }
    map = L.map(host, { zoomControl: false, attributionControl: true });
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '&copy; OpenStreetMap' });
    const sat = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', { maxZoom: 19, attribution: 'Tiles &copy; Esri' });
    osm.addTo(map);
    L.control.layers({ 'Peta Dasar': osm, 'Citra Satelit': sat }, {}, { position: 'topright' }).addTo(map);
    build();
    setTimeout(() => map.invalidateSize(), 120);
  }

  function refresh() { if (map) setTimeout(() => map.invalidateSize(), 60); }

  function build() {
    const role = App.state.user.role;
    const g = DATA.geo;
    if (role === 'pengamat') buildPengamat(g);
    else if (role === 'ppa') buildPPA(g);
    else buildPekarya(g);
  }

  /* ---------- Staf Pengamat: 1 D.I. penuh ---------- */
  function buildPengamat(g) {
    const di = L.polygon(g.di.polygon, {
      color: '#0B3B78', weight: 2.5, fillColor: '#124A93', fillOpacity: 0.08, dashArray: '7 6'
    }).addTo(map);
    di.bindPopup('<b>D.I. Srada</b><br><span class="pop-s">Cakupan pengawasan Anda — 1 D.I.<br>Kab. Sleman • 1.240 ha (data demo)</span>');
    L.polyline(g.river.coords, { color: '#2E7CD6', weight: 5, opacity: 0.7 })
      .addTo(map).bindPopup('<b>' + g.river.name + '</b><br><span class="pop-s">Sumber air baku D.I.</span>');
    g.saluran.forEach((s) => {
      L.polyline(s.coords, { color: '#7FB3F0', weight: 3, opacity: 0.85, dashArray: '3 6' })
        .addTo(map).bindPopup('<b>' + s.name + '</b><br><span class="pop-s">' + s.panjang + ' • Kondisi: ' + s.kondisi + '</span>');
    });
    g.gates.forEach((gt) => {
      L.circleMarker(gt.pos, { radius: 6, color: '#0B3B78', weight: 2, fillColor: gateColor(gt.kondisi), fillOpacity: 1 })
        .addTo(map).bindPopup('<b>' + gt.name + '</b><br><span class="pop-s">Status: ' + gt.kondisi + '</span>');
    });
    map.fitBounds(di.getBounds().pad(0.12));
    addLegend(
      '<div class="lg-t">Legenda — D.I. Srada</div>' +
      '<div class="lg-row"><i class="sw" style="background:rgba(18,74,147,.25);border:2px dashed #0B3B78"></i>Batas D.I. (1 D.I.)</div>' +
      '<div class="lg-row"><i class="sw" style="background:#2E7CD6;height:4px"></i>Sungai</div>' +
      '<div class="lg-row"><i class="sw" style="background:#7FB3F0;height:3px"></i>Saluran</div>' +
      '<div class="lg-row"><i class="sw dot" style="background:#34C759"></i>Pintu air normal</div>' +
      '<div class="lg-row"><i class="sw dot" style="background:#FF9500"></i>Pintu air siaga</div>');
  }

  /* ---------- PPA: pintu air yang jadi tugasnya ---------- */
  function buildPPA(g) {
    g.gates.forEach((gt) => {
      const icon = L.divIcon({
        className: '',
        html: '<div class="gate-pin" style="--pc:' + gateColor(gt.kondisi) + '"><span>' + gt.id + '</span></div>',
        iconSize: [50, 50], iconAnchor: [25, 25], popupAnchor: [0, -26]
      });
      L.marker(gt.pos, { icon }).addTo(map).on('click', () => gateCard(gt));
    });
    const b = L.latLngBounds(g.gates.map((x) => x.pos));
    map.fitBounds(b.pad(0.45));
    addLegend(
      '<div class="lg-t">Legenda — Pintu Air</div>' +
      '<div class="lg-row"><i class="sw dot" style="background:#34C759"></i>Normal</div>' +
      '<div class="lg-row"><i class="sw dot" style="background:#FF9500"></i>Siaga</div>' +
      '<div class="lg-row"><i class="sw dot" style="background:#FF3B30"></i>Waspada</div>');
  }

  /* ---------- Pekarya: ruas saluran yang jadi tugasnya ---------- */
  function buildPekarya(g) {
    g.saluran.forEach((s) => {
      const ln = L.polyline(s.coords, { color: kondisiColor(s.kondisi), weight: 7, opacity: 0.95, lineCap: 'round' }).addTo(map);
      ln.on('click', () => segCard(s));
      ln.bindTooltip(s.name, { sticky: true, className: 'seg-tip' });
    });
    const b = L.latLngBounds(g.saluran.flatMap((s) => s.coords));
    map.fitBounds(b.pad(0.25));
    addLegend(
      '<div class="lg-t">Legenda — Kondisi Saluran</div>' +
      '<div class="lg-row"><i class="sw" style="background:#34C759;height:6px;border-radius:3px"></i>Baik</div>' +
      '<div class="lg-row"><i class="sw" style="background:#FF9500;height:6px;border-radius:3px"></i>Rusak ringan</div>' +
      '<div class="lg-row"><i class="sw" style="background:#FF3B30;height:6px;border-radius:3px"></i>Rusak berat</div>');
  }

  /* ---------- kartu detail (bottom sheet, iOS) ---------- */
  function gateCard(gt) {
    UI.sheet({
      title: gt.name,
      html:
        '<div class="dt-chips"><span class="chip ' + (gt.kondisi === 'Normal' ? 'chip-green' : 'chip-orange') + '">' + gt.kondisi + '</span>' +
        '<span class="chip chip-gray">' + gt.sorog + '</span></div>' +
        '<div class="dt-row">' + UI.ic('pin', 16) + ' ' + gt.pos[0].toFixed(5) + ', ' + gt.pos[1].toFixed(5) + '</div>' +
        '<div class="dt-row">' + UI.ic('clock', 16) + ' Laporan terakhir: ' + gt.lastReport + '</div>' +
        '<div class="dt-note">PPA hanya melihat pintu air yang menjadi tugasnya.</div>',
      actions: [
        { label: 'Buat Laporan di ' + gt.id, cls: 'btn-primary', onClick: () => { App.newReportFor('Pintu Air ' + gt.id); } },
        { label: 'Tutup', cls: 'btn-ghost' }
      ]
    });
  }
  function segCard(s) {
    UI.sheet({
      title: s.name,
      html:
        '<div class="dt-chips"><span class="chip ' + (s.kondisi === 'Baik' ? 'chip-green' : s.kondisi === 'Rusak Ringan' ? 'chip-orange' : 'chip-red') + '">' + s.kondisi + '</span>' +
        '<span class="chip chip-gray">' + s.panjang + '</span><span class="chip chip-gray">' + s.baku + '</span></div>' +
        '<div class="dt-row">' + UI.ic('pin', 16) + ' Ruas ' + s.id + ' — koordinat ujung: ' + s.coords[0].map((v) => v.toFixed(4)).join(', ') + '</div>' +
        '<div class="dt-note">Pekarya hanya melihat ruas saluran yang menjadi tugasnya.</div>',
      actions: [
        { label: 'Buat Laporan Ruas Ini', cls: 'btn-primary', onClick: () => { App.newReportFor(s.name); } },
        { label: 'Tutup', cls: 'btn-ghost' }
      ]
    });
  }

  /* ---------- legenda ---------- */
  function addLegend(html) {
    const Legend = L.Control.extend({
      options: { position: 'bottomleft' },
      onAdd() {
        const div = L.DomUtil.create('div', 'map-legend');
        div.innerHTML = html;
        L.DomEvent.disableClickPropagation(div);
        return div;
      }
    });
    new Legend().addTo(map);
  }

  return { init, refresh };
})();
