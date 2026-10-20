const FONT = "'Roboto Condensed','Arial Narrow',Arial,sans-serif";
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const $ = id => document.getElementById(id);
let items = []; // {name, img, code, canvas}
let logoImg = null, badgeImg = null;

function randomCode() {
  const a = new Uint32Array(14);
  crypto.getRandomValues(a);
  return Array.from(a, n => CHARS[n % CHARS.length]).join('');
}

function syncFromDate() {
  const v = $('date').value;
  if (!v) return;
  const [y, m, d] = v.split('-').map(Number);
  $('dateText').value = `${MONTHS[m - 1]} ${d}, ${y}`;
  $('day').value = DAYS[new Date(y, m - 1, d).getDay()];
}

function draw(it) {
  const img = it.img, land = img.width >= img.height;
  const W = land ? 2560 : 1920, H = land ? 1920 : 2560, S = 1920;
  const c = it.canvas;
  c.width = W; c.height = H;
  const g = c.getContext('2d');

  // cover-fit photo
  const sc = Math.max(W / img.width, H / img.height);
  const dw = img.width * sc, dh = img.height * sc;
  g.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);

  g.textBaseline = 'alphabetic';
  g.textAlign = 'left';
  g.fillStyle = '#fff';
  g.shadowColor = 'rgba(0,0,0,.35)';
  g.shadowBlur = S * 0.004;

  const left = 0.026 * S;
  const rightStrip = 0.07 * S;           // space kept clear for the vertical code
  const brandMax = 0.30 * S;

  // time (large, bottom-left), shrunk to fit if too long
  g.font = `500 ${0.135 * S}px ${FONT}`;
  const tw = Math.min(g.measureText($('time').value).width, 0.45 * S);
  g.fillText($('time').value, left, H - 0.105 * S, 0.45 * S);

  // yellow divider placed right after the time
  const divX = left + tw + 0.03 * S;
  g.shadowBlur = 0;
  g.fillStyle = '#f5b800';
  g.fillRect(divX, H - 0.20 * S, 0.005 * S, 0.105 * S);

  // date + day placed after the divider, fitted to the free width
  const dateX = divX + 0.03 * S;
  const dateMax = Math.max(0.1 * S, W - dateX - rightStrip);
  g.fillStyle = '#fff';
  g.shadowBlur = S * 0.004;
  g.font = `400 ${0.034 * S}px ${FONT}`;
  g.fillText($('dateText').value, dateX, H - 0.169 * S, dateMax);
  g.fillText($('day').value, dateX, H - 0.098 * S, dateMax);

  // measure bottom-right label so the address never runs into it
  const lh = 0.045 * S;
  const lw = logoImg ? Math.min(brandMax, logoImg.width / logoImg.height * lh) : 0;
  g.font = `700 ${0.040 * S}px ${FONT}`;
  const brandW = logoImg ? lw : Math.min(g.measureText($('brand').value).width, brandMax);
  const addrMax = Math.max(0.1 * S, W - 0.033 * S - brandW - 0.05 * S);

  // address
  g.font = `400 ${0.034 * S}px ${FONT}`;
  g.fillText($('address').value, 0.033 * S, H - 0.040 * S, addrMax);

  // vertical reference code (right edge, reads bottom to top)
  // right strip, bottom to top: badge icon, code, strip text
  const sx = W - 0.012 * S;
  const bs = badgeImg ? 0.026 * S : 0;
  const gap = 0.012 * S;
  g.font = `400 ${0.022 * S}px ${FONT}`;
  const code = it.code;
  const cw = g.measureText(code).width;
  const txt = $('sideText').value;
  const tMax = Math.max(0, H * 0.7 - bs - cw - 2 * gap);
  const tw2 = txt ? Math.min(g.measureText(txt).width, tMax) : 0;
  const total = bs + (bs ? gap : 0) + cw + (tw2 ? gap * 2 + tw2 : 0);
  let y = H * 0.43 + total / 2;
  if (badgeImg) {
    g.drawImage(badgeImg, sx - bs, y - bs, bs, bs);
    y -= bs + gap;
  }
  g.save();
  g.fillStyle = 'rgba(255,255,255,.85)';
  g.textAlign = 'left';
  g.translate(sx - 0.007 * S, y);
  g.rotate(-Math.PI / 2);
  g.fillText(code, 0, 0);
  if (tw2) g.fillText(txt, cw + gap * 2, 0, tw2);
  g.restore();

  // bottom-right label
  g.textAlign = 'right';
  g.fillStyle = '#fff';
  g.font = `400 ${0.022 * S}px ${FONT}`;
  g.fillText('Photo by', W - 0.012 * S, H - 0.068 * S);
  if (logoImg) {
    g.shadowBlur = 0;
    g.drawImage(logoImg, W - 0.012 * S - lw, H - 0.027 * S - lh * 0.85, lw, lh);
  } else {
    g.font = `700 ${0.040 * S}px ${FONT}`;
    g.fillText($('brand').value, W - 0.012 * S, H - 0.027 * S, brandMax);
  }
}

function redrawAll() { items.forEach(draw); scheduleSave(); }

function save(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}

function render() {
  const grid = $('grid');
  grid.innerHTML = '';
  scheduleSave();
  items.forEach((it, i) => {
    const card = document.createElement('div');
    card.className = 'card';
    card.appendChild(it.canvas);
    const row = document.createElement('div');
    row.className = 'row';

    const b1 = document.createElement('button');
    b1.textContent = 'New code';
    b1.onclick = () => { it.code = randomCode(); draw(it); scheduleSave(); };

    const b2 = document.createElement('button');
    b2.textContent = 'Download';
    b2.onclick = () => it.canvas.toBlob(b => save(b, it.name), 'image/jpeg', 0.92);

    const b3 = document.createElement('button');
    b3.textContent = 'Remove';
    b3.onclick = () => { items.splice(i, 1); render(); };

    row.append(b1, b2, b3);
    card.appendChild(row);
    grid.appendChild(card);
  });
}

$('files').addEventListener('change', e => {
  [...e.target.files].forEach(f => {
    const img = new Image();
    img.onload = () => {
      const it = {
        name: f.name.replace(/\.[^.]+$/, '') + '_stamped.jpg',
        img, blob: f, code: randomCode(), canvas: document.createElement('canvas')
      };
      items.push(it);
      draw(it);
      render();
    };
    img.src = URL.createObjectURL(f);
  });
  e.target.value = '';
});

['time', 'dateText', 'day', 'address', 'brand'].forEach(id =>
  $(id).addEventListener('input', redrawAll));
$('date').addEventListener('input', () => { syncFromDate(); redrawAll(); });
$('regen').onclick = () => { items.forEach(it => it.code = randomCode()); redrawAll(); };
$('clear').onclick = () => { items = []; render(); };

// ---------- Offline ZIP writer (no external library) ----------
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function buildZip(files) { // files: [{name, data: Uint8Array}], stored without compression
  const enc = new TextEncoder(), now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const parts = [], central = [];
  let offset = 0;
  for (const f of files) {
    const name = enc.encode(f.name), crc = crc32(f.data), size = f.data.length;
    const lh = new DataView(new ArrayBuffer(30));
    lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, 20, true); lh.setUint16(6, 0x0800, true);
    lh.setUint16(8, 0, true); lh.setUint16(10, dosTime, true); lh.setUint16(12, dosDate, true);
    lh.setUint32(14, crc, true); lh.setUint32(18, size, true); lh.setUint32(22, size, true);
    lh.setUint16(26, name.length, true); lh.setUint16(28, 0, true);
    parts.push(new Uint8Array(lh.buffer), name, f.data);

    const ch = new DataView(new ArrayBuffer(46));
    ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, 20, true); ch.setUint16(6, 20, true);
    ch.setUint16(8, 0x0800, true); ch.setUint16(10, 0, true); ch.setUint16(12, dosTime, true);
    ch.setUint16(14, dosDate, true); ch.setUint32(16, crc, true); ch.setUint32(20, size, true);
    ch.setUint32(24, size, true); ch.setUint16(28, name.length, true); ch.setUint32(42, offset, true);
    central.push(new Uint8Array(ch.buffer), name);
    offset += 30 + name.length + size;
  }
  const cdSize = central.reduce((n, p) => n + p.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true); end.setUint16(8, files.length, true);
  end.setUint16(10, files.length, true); end.setUint32(12, cdSize, true); end.setUint32(16, offset, true);
  return new Blob([...parts, ...central, new Uint8Array(end.buffer)], { type: 'application/zip' });
}

$('dlAll').onclick = async () => {
  if (!items.length) return;
  const files = [];
  const used = new Set();
  for (const it of items) {
    const blob = await new Promise(r => it.canvas.toBlob(r, 'image/jpeg', 0.92));
    let name = it.name, n = 1;
    while (used.has(name)) name = it.name.replace(/\.jpg$/, `_${n++}.jpg`);
    used.add(name);
    files.push({ name, data: new Uint8Array(await blob.arrayBuffer()) });
  }
  save(buildZip(files), 'stamped_photos.zip');
};

function loadSlot(inputId, setter) {
  $(inputId).addEventListener('change', e => {
    const f = e.target.files[0];
    if (!f) { setter(null, null); redrawAll(); return; }
    const im = new Image();
    im.onload = () => { setter(im, f); redrawAll(); };
    im.src = URL.createObjectURL(f);
  });
}
loadSlot('logoFile', (im, f) => { logoImg = im; logoBlob = f; });
loadSlot('badgeFile', (im, f) => { badgeImg = im; badgeBlob = f; });
$('sideText').addEventListener('input', redrawAll);

// ---------- Save / restore (IndexedDB) ----------
const SETTING_IDS = ['time', 'date', 'dateText', 'day', 'address', 'brand', 'sideText'];
let logoBlob = null, badgeBlob = null, saveTimer = null, restored = false;

function openDB() {
  return new Promise((res, rej) => {
    const r = indexedDB.open('photoStampDB', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
}
async function dbSet(k, v) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const t = db.transaction('kv', 'readwrite');
    t.objectStore('kv').put(v, k);
    t.oncomplete = res;
    t.onerror = () => rej(t.error);
  });
}
async function dbGet(k) {
  const db = await openDB();
  return new Promise((res, rej) => {
    const q = db.transaction('kv').objectStore('kv').get(k);
    q.onsuccess = () => res(q.result);
    q.onerror = () => rej(q.error);
  });
}
function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveState, 400);
}
async function saveState() {
  if (!restored) return;
  try {
    const settings = {};
    SETTING_IDS.forEach(id => settings[id] = $(id).value);
    await dbSet('state', {
      settings,
      photos: items.map(it => ({ name: it.name, blob: it.blob, code: it.code })),
      logo: logoBlob,
      badge: badgeBlob
    });
  } catch (e) { console.warn('Save failed', e); }
}
function loadImg(blob) {
  return new Promise(res => {
    const im = new Image();
    im.onload = () => res(im);
    im.src = URL.createObjectURL(blob);
  });
}
async function restore() {
  try {
    const st = await dbGet('state');
    if (!st) { syncFromDate(); return; }
    SETTING_IDS.forEach(id => { if (st.settings[id] !== undefined) $(id).value = st.settings[id]; });
    if (st.logo) { logoBlob = st.logo; logoImg = await loadImg(st.logo); }
    if (st.badge) { badgeBlob = st.badge; badgeImg = await loadImg(st.badge); }
    for (const p of st.photos || []) {
      const img = await loadImg(p.blob);
      items.push({ name: p.name, img, blob: p.blob, code: p.code, canvas: document.createElement('canvas') });
    }
    items.forEach(draw);
    render();
  } catch (e) {
    console.warn('Restore failed', e);
    syncFromDate();
  } finally {
    restored = true;
  }
}
$('resetSaved').onclick = async () => {
  if (!confirm('Delete the saved setup and photos?')) return;
  restored = false;
  const db = await openDB();
  const t = db.transaction('kv', 'readwrite');
  t.objectStore('kv').clear();
  t.oncomplete = () => location.reload();
};

restore();