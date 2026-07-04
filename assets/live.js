/* The living site: hydrate races / builds / memos / now from Parth OS.
   Reads ONLY status='live' rows via the anon key (RLS-gated, public-safe).
   Fails silently — the static baseline is always the floor. */
(async function () {
  const URL = 'https://kvylsvvscpdzcbwqqaxm.supabase.co';
  const KEY = 'sb_publishable_4kKPuq9w15zHeRTQKdgp4Q_aRyuBbye';
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  let rows;
  try {
    const r = await fetch(URL + '/rest/v1/portfolio_queue?status=eq.live&select=kind,title,hook,detail,date_label,link,meta,published_at&order=published_at.desc.nullslast', {
      headers: { apikey: KEY, Authorization: 'Bearer ' + KEY }
    });
    if (!r.ok) return;
    rows = await r.json();
  } catch (e) { return; }
  if (!Array.isArray(rows) || rows.length === 0) return;

  const body = document.body;

  /* RAILS — new races slot into the log (newest first, after any future rows) */
  if (body.classList.contains('p-rails')) {
    const races = document.querySelector('.races');
    if (races) {
      const items = rows.filter(x => x.kind === 'race');
      const anchor = [...races.children].find(el => !el.classList.contains('future'));
      for (const x of items.reverse()) {
        const m = x.meta || {};
        const el = document.createElement('div');
        el.className = 'race rv in' + (m.future ? ' future' : '');
        el.innerHTML =
          '<div class="race-top"><span class="rname">' + esc(x.title) + '</span><span class="rtime">' + esc(x.date_label || '') + '</span></div>' +
          '<div class="rbar"><b style="width:' + esc(m.width || '100%') + ';"></b></div>' +
          (x.detail ? '<p class="rnote">' + esc(x.detail) + '</p>' : '');
        if (m.future) races.insertBefore(el, races.firstChild);
        else races.insertBefore(el, anchor || null);
      }
    }
  }

  /* BUILDS — new projects prepend to the ledger */
  if (body.classList.contains('p-builds')) {
    const list = document.querySelector('.rows');
    if (list) {
      const items = rows.filter(x => x.kind === 'build');
      const CLS = { live: 'live', build: 'build', run: 'run', killed: 'killed' };
      for (const x of items.reverse()) {
        const m = x.meta || {};
        const cls = CLS[m.status] || 'live';
        const label = m.label || { live: 'shipped & live', build: 'in build', run: 'running', killed: 'killed on purpose' }[cls];
        const el = document.createElement('div');
        el.className = 'row ' + cls + ' rv in';
        el.innerHTML =
          '<div class="row-top"><span class="name">' + esc(x.title) + '</span><span class="status">&#9679; ' + esc(label) + '</span></div>' +
          '<div class="bar" role="img" aria-label="Status: ' + esc(label) + '"><b style="width:' + esc(m.width || '60%') + ';"></b></div>' +
          (x.detail ? '<p class="note">' + esc(x.detail) + '</p>' : '') +
          (x.link ? '<p class="meta">&rarr; <a href="' + esc(x.link) + '">' + esc(x.link.replace(/^https?:\/\//, '')) + '</a></p>' : '');
        list.insertBefore(el, list.firstChild);
      }
    }
  }

  /* LENS — published memos fill the shelf */
  if (body.classList.contains('p-lens')) {
    const shelf = document.querySelector('.shelf');
    const memos = rows.filter(x => x.kind === 'memo');
    if (shelf && memos.length) {
      shelf.innerHTML = '<p class="big" style="margin:0 0 12px;">The shelf, so far.</p>' + memos.map(x =>
        '<p style="margin:7px 0; font-weight:700;">' +
        (x.link ? '<a href="' + esc(x.link) + '" style="color:currentColor;">&rarr; ' + esc(x.title) + '</a>' : '&rarr; ' + esc(x.title)) +
        (x.date_label ? ' <span style="font-family:\'Space Mono\',monospace; font-size:11px; font-weight:700; opacity:.7;">&middot; ' + esc(x.date_label) + '</span>' : '') +
        '</p>').join('');
      shelf.style.textAlign = 'left';
      shelf.style.borderStyle = 'solid';
    }
  }

  /* INDEX — the latest 'now' line under the identity strip */
  if (body.classList.contains('p-index')) {
    const now = rows.find(x => x.kind === 'now');
    const strip = document.querySelector('.idstrip');
    if (now && strip) {
      const el = document.createElement('p');
      el.className = 'idstrip rv in';
      el.style.marginTop = '8px';
      el.style.opacity = '1';
      el.innerHTML = '<span style="color:var(--dred);">now &middot;</span> ' + esc(now.title);
      strip.insertAdjacentElement('afterend', el);
    }
  }
})();
