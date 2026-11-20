// Traffic test: moves a known number of bytes through the hidden link so the
// totals LayerV reports can be checked. Download = fetch the 1 MiB random file
// N times (cache-busted). Upload = POST 512 KiB random pieces (nginx answers 405
// after reading them, which is fine: the bytes still crossed the link).
(() => {
  'use strict';
  const MIB = 1048576;
  const CHUNK_URL = 'chunk-1mib.bin';
  const UP_PIECE = 512 * 1024; // under nginx's default 1m body limit
  const $ = (id) => document.getElementById(id);

  let controller = null;
  const totals = { req: 0, down: 0, downWire: 0, wireKnown: true, up: 0, t0: 0 };

  const fmt = (n) => `${n.toLocaleString('en-US')} bytes (${(n / MIB).toFixed(2)} MiB)`;
  function render() {
    $('r-req').textContent = totals.req.toLocaleString('en-US');
    $('r-down').textContent = fmt(totals.down);
    $('r-down-wire').textContent = totals.down === 0 ? '—'
      : totals.wireKnown ? fmt(totals.downWire) : 'not reported by this browser';
    $('r-up').textContent = fmt(totals.up);
    if (totals.t0) $('r-time').textContent = `${((performance.now() - totals.t0) / 1000).toFixed(1)} s`;
  }
  function setBusy(busy) {
    $('down-go').disabled = busy;
    $('up-go').disabled = busy;
    $('stop').disabled = !busy;
  }
  function begin(label) {
    controller = new AbortController();
    if (!totals.t0) {
      totals.t0 = performance.now();
      $('r-start').textContent = new Date().toISOString().replace('T', ' ').slice(0, 19);
    }
    $('status').textContent = label;
    setBusy(true);
    return controller.signal;
  }
  function finish(msg) {
    controller = null;
    setBusy(false);
    $('status').textContent = msg;
    render();
  }

  async function download(mib) {
    const signal = begin(`Downloading ${mib} MiB…`);
    try {
      for (let i = 0; i < mib; i++) {
        const url = `${CHUNK_URL}?n=${Date.now()}-${i}`;
        const res = await fetch(url, { cache: 'no-store', credentials: 'same-origin', signal });
        if (!res.ok) throw new Error(`HTTP ${res.status} on piece ${i + 1}`);
        const buf = await res.arrayBuffer();
        totals.req++;
        totals.down += buf.byteLength;
        const entry = performance.getEntriesByName(new URL(url, location.href).href).pop();
        if (entry && entry.transferSize > 0) totals.downWire += entry.transferSize;
        else totals.wireKnown = false;
        $('status').textContent = `Downloading… ${i + 1} of ${mib} MiB`;
        render();
      }
      finish(`Done: downloaded ${mib} MiB.`);
    } catch (e) {
      finish(e.name === 'AbortError' ? 'Stopped.' : `Stopped early: ${e.message}. Has the link’s time run out?`);
    }
  }

  async function upload(mib) {
    const signal = begin(`Uploading ${mib} MiB…`);
    const piece = new Uint8Array(UP_PIECE);
    // getRandomValues caps at 64 KiB per call.
    for (let o = 0; o < UP_PIECE; o += 65536) crypto.getRandomValues(piece.subarray(o, o + 65536));
    const pieces = (mib * MIB) / UP_PIECE;
    try {
      for (let i = 0; i < pieces; i++) {
        const res = await fetch(`upload-sink?n=${Date.now()}-${i}`, {
          method: 'POST', body: piece, cache: 'no-store', credentials: 'same-origin', signal,
          headers: { 'Content-Type': 'application/octet-stream' },
        });
        // 405/404 are expected from a static server; anything that's a redirect
        // to a login/expired page or a 5xx means the link is gone.
        if (res.status >= 500 || res.redirected) throw new Error(`HTTP ${res.status} on piece ${i + 1}`);
        await res.arrayBuffer().catch(() => {});
        totals.req++;
        totals.up += UP_PIECE;
        $('status').textContent = `Uploading… ${((i + 1) * UP_PIECE / MIB).toFixed(1)} of ${mib} MiB`;
        render();
      }
      finish(`Done: uploaded ${mib} MiB.`);
    } catch (e) {
      finish(e.name === 'AbortError' ? 'Stopped.' : `Stopped early: ${e.message}. Has the link’s time run out?`);
    }
  }

  $('down-go').addEventListener('click', () => download(Number($('down-mib').value)));
  $('up-go').addEventListener('click', () => upload(Number($('up-mib').value)));
  $('stop').addEventListener('click', () => controller && controller.abort());
  setBusy(false);
  $('stop').disabled = true;
  render();
  if ($('autostart').checked) download(Number($('down-mib').value));
})();
