/* Click & Connect: slide banner for notices + documents/process details (reads Firestore: updates, data/matrix_config) */
(function () {
  if (!window.db) return;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const D1 = 864e5, day = d => new Date(d + 'T00:00:00').getTime();
  const fmt = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
  let U = [], CARDS = [], ix = 0;
  function status(u) {
    const now = Date.now(), end = day(u.endDate) + D1, st = u.startDate ? day(u.startDate) : null;
    if (now >= end) return { k: 'closed', rank: 9, c: '#8a8196', n: '✕', unit: 'khatam', ring: 0, ago: Math.floor((now - end) / D1) };
    if (st && now < st) { const d = Math.ceil((st - now) / D1); return { k: 'up', rank: 3, c: '#9B00D2', n: d, unit: 'din me shuru', ring: .15, pct: 0 }; }
    const d = Math.floor((end - now) / D1), tot = st ? Math.max(1, Math.round((end - st) / D1)) : 30, ring = Math.min(1, Math.max(.06, d / tot)), pct = st ? Math.min(100, Math.max(2, (now - st) / (end - st) * 100)) : null;
    if (d === 0) return { k: 'today', rank: 0, c: '#DD603E', n: '!', unit: 'aaj last', hot: 1, ring: .06, pct };
    if (d <= 3) return { k: 'soon', rank: 1, c: '#e69500', n: d, unit: 'din baaki', hot: 1, ring, pct };
    return { k: 'live', rank: 2, c: '#009a00', n: d, unit: 'din baaki', ring, pct };
  }
  const isNew = u => { const t = u.createdAt && u.createdAt.toDate ? u.createdAt.toDate().getTime() : (u.verifiedAt ? Date.parse(u.verifiedAt) : 0); return !!t && Date.now() - t < 3 * D1; };
  const bd = (u, s) => { const b = []; if (isNew(u)) b.push('<span class="ccu-bd new">NEW</span>');
    b.push(s.k === 'closed' ? '<span class="ccu-bd exp">EXPIRED</span>' : s.k === 'up' ? '<span class="ccu-bd up">UPCOMING</span>' : s.k === 'today' ? '<span class="ccu-bd hot">LAST DAY</span>' : s.k === 'soon' ? '<span class="ccu-bd soon">ENDING SOON</span>' : '<span class="ccu-bd act"><i></i>ACTIVE</span>');
    return `<div class="ccu-bds">${b.join('')}</div>`; };
  const listAll = () => U.filter(u => u.endDate).map(u => ({ u, s: status(u) })).filter(x => x.s.k !== 'closed' || x.s.ago <= 7).sort((a, b) => a.s.rank - b.s.rank || a.u.endDate.localeCompare(b.u.endDate));
  const list = () => U.filter(u => u.endDate).map(u => ({ u, s: status(u) })).filter(x => x.s.k !== 'closed')
    .sort((a, b) => a.s.rank - b.s.rank || a.u.endDate.localeCompare(b.u.endDate));
  const SP = document.createElement('div'); SP.id = 'ccuSpace';
  let st = 'dock';
  const TH = { Scholarship: ['#9B00D2', '#FE28AF', 'graduation-cap'], Exam: ['#0077BE', '#00b4d8', 'pen-to-square'], Job: ['#00873f', '#2fd17a', 'briefcase'], Certificate: ['#DD603E', '#ffa53d', 'certificate'], Yojana: ['#d98200', '#ffcf33', 'hand-holding-heart'], Other: ['#6c4cff', '#FE28AF', 'bullhorn'] };
  const th = u => TH[u.category] || TH.Other;
  const cardOf = u => CARDS.find(c => (c.title || c.name) === u.cardTitle) || {};
  const docsOf = u => cardOf(u).documents || [];
  const chipTxt = s => s.k === 'closed' ? s.ago + ' din pehle band' : s.k === 'today' ? 'Aaj last!' : s.k === 'up' ? s.n + ' din me shuru' : s.n + ' din baaki';
  const dates = u => (u.startDate ? fmt(u.startDate) + ' se ' : 'Last date: ') + fmt(u.endDate) + (u.startDate ? ' tak' : '');
  const IC = [['aadhaar|aadhar|आधार', 'id-card'], ['photo|फोटो|passport size', 'camera'], ['income|आय', 'file-invoice-dollar'], ['bank|passbook|खाता', 'building-columns'], ['sign|हस्ताक्षर', 'signature'], ['caste|jati|जाति|obc|\\bsc\\b|\\bst\\b', 'users'], ['residen|niwas|निवास|domicile', 'house'], ['mobile|phone|मोबाइल|otp', 'mobile-screen'], ['mark|result|10th|12th|degree|certificate|प्रमाण', 'graduation-cap'], ['ration|राशन', 'wheat-awn'], ['\\bpan\\b', 'credit-card'], ['email|ईमेल', 'envelope']];
  const dIcon = n => (IC.find(([k]) => new RegExp(k, 'i').test(n)) || [0, 'file-lines'])[1];
  function ring(w, on) { w.querySelectorAll('.fg').forEach(f => { f.style.strokeDashoffset = on ? f.dataset.o : f.getAttribute('stroke-dasharray'); }); }
  function setVars(i) {
    const w = document.getElementById('ccUpd'), e = w && w._L && w._L[i]; if (!e) return;
    const t = th(e.u); w.style.setProperty('--c', t[0]); w.style.setProperty('--c2', t[1]); w.style.setProperty('--u', e.s.c);
  }
  function setSt(s) {
    const w = document.getElementById('ccUpd'); if (!w) return; st = s;
    w.classList.remove('pop', 'open'); if (s !== 'dock') w.classList.add(s);
    if (s === 'pop') paintHu(0); else { ix = 0; setVars(0); paintDock(0); }
    ring(w, s !== 'dock');
  }
  function paintDock(i) {
    const w = document.getElementById('ccUpd'), e = w && w._L && w._L[i]; if (!e || !w.querySelector('.ccu-dtitle')) return;
    const { u, s } = e; w.querySelector('.ccu-dicon i').className = 'fas fa-' + th(u)[2];
    w.querySelector('.ccu-dtitle').innerHTML = `<small>${esc((u.category || 'Update').toUpperCase())} · ${esc(fmt(u.endDate))}</small><b>${esc(u.title)}</b>`;
    w.querySelector('.ccu-chip').textContent = chipTxt(s); w.querySelector('.ccu-dbd').innerHTML = ''; w.querySelector('.ccu-dicon').classList.toggle('isnew', isNew(u));
  }
  setInterval(() => { const w = document.getElementById('ccUpd'); if (!w || !w._L || w._L.length < 2 || st !== 'dock' || w.classList.contains('away') || w.matches(':hover') || document.querySelector('.ccu-ov')) return; ix = (ix + 1) % w._L.length; setVars(ix); paintDock(ix); }, 4500);
  function place() {
    const w = document.getElementById('ccUpd'); if (!w) return;
    const nav = document.querySelector('.top-navbar'), m = document.querySelector('.main-content') || document.body, r = m.getBoundingClientRect();
    w.style.setProperty('--cx', (r.left + r.width / 2) + 'px');
    w.style.setProperty('--ty', ((nav ? Math.max(0, nav.getBoundingClientRect().bottom) : 0) + 8) + 'px');
  }
  function mount() {
    let w = document.getElementById('ccUpd');
    if (!w) {
      w = document.createElement('div'); w.id = 'ccUpd'; w.className = 'ccu-island';
      document.body.appendChild(w);
      const nav = document.querySelector('.top-navbar');
      nav ? nav.insertAdjacentElement('afterend', SP) : (document.querySelector('.main-content') || document.body).prepend(SP);
      w.addEventListener('click', e => {
        const row = e.target.closest('.ccu-row');
        if (row && w._A) { setSt('dock'); return show({ u: w._A[+row.dataset.i].u }); }
        const x = e.target.closest('[data-x]')?.dataset.x, cur = w._L && w._L[ix];
        if (x === 'det') { setSt('dock'); return show({ u: cur.u }); }
        if (x === 'docs') { setSt('dock'); return show({ u: cur.u, focus: 'docs' }); }
        if (x === 'later' || x === 'close') return setSt('dock');
        if (x === 'open' || e.target.closest('.ccu-dockrow')) return setSt('open');
      });
      w.addEventListener('animationend', e => { if (e.target.matches('.ccu-tbar') && st === 'pop') { const n = w._L.length; ix < n - 1 ? paintHu(ix + 1) : setSt('dock'); } });
      w.addEventListener('touchstart', e => { w._t = e.touches[0]; }, { passive: true });
      w.addEventListener('touchend', e => { const t = w._t; if (!t || st === 'dock') return; const dx = e.changedTouches[0].clientX - t.clientX, dy = e.changedTouches[0].clientY - t.clientY; if (Math.abs(dx) > 70 || dy < -40) setSt('dock'); w._t = null; }, { passive: true });
      place();
    }
    return w;
  }
  function paintHu(i) {
    const w = document.getElementById('ccUpd'), L = w._L; if (!L || !L[i]) return;
    const { u, s } = L[i], t = th(u), C = 141.4, n = L.length, card = cardOf(u), dn = docsOf(u).length; ix = i; setVars(i);
    w.querySelector('.ccu-hui').innerHTML = `${bd(u, s)}<div class="ccu-hrow"><div class="ccu-ic"><svg viewBox="0 0 50 50"><circle class="bg" cx="25" cy="25" r="22.5"/><circle class="fg" cx="25" cy="25" r="22.5" stroke-dasharray="${C}" style="stroke-dashoffset:${C}" data-o="${(C * (1 - s.ring)).toFixed(1)}"/></svg><i class="fas fa-${t[2]}"></i></div>
    <div class="ccu-ht" data-x="det"><small><em>Click & Connect</em> · ${esc((u.category || 'Update').toUpperCase())} · abhi</small><b>${esc(u.title)}</b></div><button class="ccu-xb" data-x="open" aria-label="Sab updates"><i class="fas fa-chevron-down"></i></button></div>
    <div class="ccu-meta"><span><i class="fas fa-calendar-day"></i> ${esc(dates(u))}</span><span class="u"><i class="fas fa-hourglass-half"></i> ${esc(chipTxt(s))}</span>${u.fee || card.fee ? `<span><i class="fas fa-indian-rupee-sign"></i> ${esc(u.fee || card.fee)}</span>` : ''}${dn ? `<span><i class="fas fa-folder-open"></i> ${dn} documents</span>` : ''}</div>
    <div class="ccu-acts"><button data-x="det">Details dekhein</button>${dn ? '<button class="g" data-x="docs"><i class="fas fa-list-check"></i> Documents</button>' : ''}<button class="g" data-x="later">Baad me</button>${n > 1 ? `<span class="ccu-pg">${L.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</span>` : ''}</div><i class="ccu-tbar"></i>`;
    requestAnimationFrame(() => requestAnimationFrame(() => { if (st !== 'dock') ring(w, true); }));
  }
  function draw() {
    const L = list(), w = mount();
    SP.style.display = w.style.display = L.length ? '' : 'none';
    if (!L.length) return;
    w._L = L; const A = listAll(); w._A = A; const s = L[0].s, n = L.length;
    w.innerHTML = `${n > 1 ? '<div class="ccu-peek p1"></div><div class="ccu-peek p2"></div>' : ''}<div class="ccu-in">
    <div class="ccu-dk"><div class="ccu-dki"><span class="ccu-dbd"></span><button class="ccu-dockrow" aria-label="Updates kholein"><span class="ccu-dicon"><i class="fas fa-bullhorn"></i></span><span class="ccu-dtitle"></span><span class="ccu-chip">${esc(chipTxt(s))}</span>${n > 1 ? `<span class="ccu-count">+${n - 1}</span>` : ''}<i class="fas fa-chevron-down ccu-chev"></i></button></div></div>
    <div class="ccu-hu"><div class="ccu-hui"></div></div>
    <div class="ccu-panel"><div class="ccu-pin"><div class="ccu-ph"><span>Taaza updates · ${n} chalu</span><button class="ccu-xb" data-x="close" aria-label="Band karein"><i class="fas fa-chevron-up"></i></button></div><div class="ccu-list">${A.map(({ u, s }, i) => { const t = th(u); return `<button class="ccu-row${s.k === 'closed' ? ' exp' : ''}" data-i="${i}" style="--c:${t[0]};--c2:${t[1]};--u:${s.c};--i:${i}"><span class="ccu-mr"><svg viewBox="0 0 40 40"><circle class="bg" cx="20" cy="20" r="16"/><circle class="fg" cx="20" cy="20" r="16" stroke-dasharray="100.5" style="stroke-dashoffset:100.5" data-o="${(100.5 * (1 - s.ring)).toFixed(1)}"/></svg><b>${s.n}</b></span><span class="ccu-rt"><small>${esc(u.category || 'Update')}</small><b>${esc(u.title)}</b><span>${esc(dates(u))}</span></span>${bd(u, s)}<i class="fas fa-arrow-right"></i></button>`; }).join('')}</div></div></div></div>`;
    if (st === 'pop') paintHu(Math.min(ix, n - 1)); else { ix = Math.min(ix, n - 1); setVars(ix); paintDock(ix); }
    if (st !== 'dock') requestAnimationFrame(() => ring(w, true));
  }
  function maybePop() {
    const L = list(); if (!L.length) return;
    const sig = L.map(x => x.u.id + x.u.endDate).join('|');
    if (sessionStorage.ccuSig !== sig) { sessionStorage.ccuSig = sig; setTimeout(() => { const w = document.getElementById('ccUpd'); if (w && st === 'dock' && !w.classList.contains('away')) setSt('pop'); }, 1300); }
  }
  let ly = 0;
  document.addEventListener('scroll', e => {
    const w = document.getElementById('ccUpd'); if (!w || w.contains(e.target)) return;
    const t = (e.target === document || e.target === document.documentElement) ? document.scrollingElement : e.target;
    if (!t || t.clientWidth < 500 || t.clientHeight < 300 || t.scrollHeight <= t.clientHeight + 40) return;
    const y = t.scrollTop;
    if (y > ly + 6 && y > 40) { if (st !== 'dock') setSt('dock'); w.classList.add('away'); } else if (y < ly - 6 || y <= 40) w.classList.remove('away');
    ly = y; place();
  }, true);
  window.addEventListener('resize', place);
  document.addEventListener('click', e => { const w = document.getElementById('ccUpd'); if (w && st !== 'dock' && !w.contains(e.target)) setSt('dock'); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && st !== 'dock') setSt('dock'); });

  function ics(u) {
    const d = u.endDate.replace(/-/g, ''), t = `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:${u.id || d}@clickconnect\r\nDTSTART;VALUE=DATE:${d}\r\nSUMMARY:Last date: ${u.title}\r\nDESCRIPTION:${u.sourceUrl || ''}\r\nBEGIN:VALARM\r\nTRIGGER:-P2D\r\nACTION:DISPLAY\r\nDESCRIPTION:Last date nazdeek\r\nEND:VALARM\r\nEND:VEVENT\r\nEND:VCALENDAR`;
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([t], { type: 'text/calendar' })); a.download = 'last-date.ics'; a.click();
  }
  function show({ u, card, focus }) {
    card = card || (u && cardOf(u)) || {};
    const t = u ? th(u) : TH.Other, s = u ? status(u) : null;
    const docs = (card.documents || []).map(x => x.split('|').map(z => z.trim())), steps = card.process || [];
    const reqs = docs.map(d => !/optional|ऑप्शनल|vaikalp/i.test(d[1] || ''));
    const tl = u ? [['Form shuru', u.startDate], ['Last date', u.endDate], ...(u.extra || []).map(x => x.split('|').map(z => z.trim()))].filter(r => r[1]) : [];
    const title = u ? u.title : (card.title || card.name || '');
    const key = 'ccuDocs:' + (u ? (u.id || u.title) : title); let saved = []; try { saved = JSON.parse(localStorage[key] || '[]'); } catch (e) {}
    const o = document.createElement('div'); o.className = 'ccu-ov';
    o.innerHTML = `<div class="ccu-modal" style="--c:${t[0]};--c2:${t[1]}"><button class="ccu-x" aria-label="Band karein"><i class="fas fa-xmark"></i></button>
    <div class="ccm-hero"><i class="fas fa-${t[2]} ic"></i><small>${esc(u ? (u.category || 'Update') : 'Service')}${u && u.verifiedAt ? ' · Verified ' + esc(fmt(u.verifiedAt.slice(0, 10))) : ''}</small><h2>${esc(title)}</h2>${s ? `<span class="ccm-pill">${s.k === 'closed' ? 'Expired · ' : ''}${esc(chipTxt(s))}</span>` : ''}</div>
    ${u && u.summary ? `<p>${esc(u.summary)}</p>` : ''}
    ${tl.length ? `<h4>Important dates</h4><div class="ccu-tl">${tl.map(r => `<div><span>${esc(r[0])}</span><b>${esc(fmt(r[1]))}</b></div>`).join('')}</div>` : ''}
    ${(u && u.fee) || card.fee ? `<h4>Fee</h4><p>${esc((u && u.fee) || card.fee)}</p>` : ''}${card.eligibility ? `<h4>Eligibility</h4><p>${esc(card.eligibility)}</p>` : ''}
    ${docs.length ? `<div class="ccd" id="ccd"><div class="ccd-top"><div class="ccd-ring"><svg viewBox="0 0 56 56"><circle class="bg" cx="28" cy="28" r="25"/><circle class="fg" cx="28" cy="28" r="25"/></svg><b></b></div><div><h4>Document Wallet</h4><p>Jo ghar par ready ho, use tap karke tick karein</p></div></div>
      <div class="ccd-grid">${docs.map((d, i) => `<button type="button" class="ccd-card${reqs[i] ? ' req' : ''}${saved.includes(i) ? ' on' : ''}"><span class="ccd-ic"><i class="fas fa-${dIcon(d[0])}"></i></span><span class="ccd-n">${esc(d[0])}</span><span class="ccd-b">${reqs[i] ? 'Zaroori' : 'Optional'}</span><span class="ccd-ck"><i class="fas fa-check"></i></span></button>`).join('')}</div>
      <div class="ccd-done"><span>🎉 Sab zaroori document ready!</span><button data-a="ready">Main taiyar hu</button></div></div>` : ''}
    ${steps.length ? `<h4>Process</h4><ol class="cps">${steps.map((x, i) => `<li style="--i:${i}"><span class="n">${i + 1}</span><div>${esc(x)}</div></li>`).join('')}</ol>` : ''}
    <div class="ccu-act">${u && u.sourceUrl ? `<a href="${esc(u.sourceUrl)}" target="_blank" rel="noopener">Official source</a>` : ''}${card.officialLink ? `<a href="${esc(card.officialLink)}" target="_blank" rel="noopener">Official link</a>` : ''}
    <button class="g" data-a="wa">WhatsApp share</button>${u && u.endDate ? '<button class="g" data-a="ics">Calendar me jodein</button>' : ''}${docs.length ? '<button class="g" data-a="pr">Documents print</button>' : ''}</div></div>`;
    const upd = () => {
      const cs = [...o.querySelectorAll('.ccd-card')]; if (!cs.length) return;
      let tot = cs.filter(c => c.classList.contains('req')); if (!tot.length) tot = cs;
      const dn = tot.filter(c => c.classList.contains('on')).length;
      o.querySelector('.ccd-ring .fg').style.strokeDashoffset = 157 * (1 - dn / tot.length);
      o.querySelector('.ccd-ring b').textContent = dn + '/' + tot.length;
      o.querySelector('.ccd-done').classList.toggle('show', dn === tot.length);
      try { localStorage[key] = JSON.stringify(cs.map((c, i) => c.classList.contains('on') ? i : -1).filter(i => i >= 0)); } catch (e) {}
    };
    o.addEventListener('click', e => {
      if (e.target === o || e.target.closest('.ccu-x')) return o.remove();
      const cd = e.target.closest('.ccd-card'); if (cd) { cd.classList.toggle('on'); if (navigator.vibrate) navigator.vibrate(15); return upd(); }
      const a = e.target.closest('[data-a]')?.dataset.a;
      if (a === 'ics') ics(u);
      if (a === 'wa') window.open('https://wa.me/?text=' + encodeURIComponent(`*${title}*\n${u ? 'Last date: ' + fmt(u.endDate) + '\n' : ''}${docs.length ? 'Documents:\n' + docs.map(d => '- ' + d[0]).join('\n') + '\n' : ''}Click & Connect`), '_blank');
      if (a === 'ready') window.open('https://wa.me/?text=' + encodeURIComponent(`Namaste, main "${title}" ke liye taiyar hu. Mere saare zaroori documents ready hain.`), '_blank');
      if (a === 'pr') { const w = window.open('', '_blank'); if (w) { w.document.write(`<body style="font-family:sans-serif;padding:24px"><h2>${esc(title)}: Documents</h2>${docs.map(d => `<p>☐ ${esc(d[0])} ${d[1] ? '(' + esc(d[1]) + ')' : ''}</p>`).join('')}<hr><small>Click & Connect</small></body>`); w.document.close(); w.print(); } }
    });
    document.body.appendChild(o); upd();
    if (focus === 'docs') setTimeout(() => o.querySelector('#ccd')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 350);
  }
  window.ccShowInfo = show;
  document.addEventListener('keydown', e => { if (e.key === 'Escape') document.querySelector('.ccu-ov')?.remove(); });
  db.collection('data').doc('matrix_config').onSnapshot(d => { CARDS = (d.data() || {}).cards || []; if (U.length) draw(); });
  db.collection('updates').where('published', '==', true).onSnapshot(s => { U = s.docs.map(d => ({ id: d.id, ...d.data() })); draw(); maybePop(); }, e => console.warn('updates:', e.message));
  setInterval(draw, 60000);
})();
