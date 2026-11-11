/* Click & Connect: Cafe Tools (T dabayein): Age, Calculator, Token, Quick Notes */
(function () {
  const d = document, $ = s => d.querySelector(s);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const get = (k, f) => { try { return JSON.parse(localStorage[k] || 'null') ?? f; } catch (e) { return f; } }, set = (k, v) => { try { localStorage[k] = JSON.stringify(v); } catch (e) {} };
  const today = () => new Date().toISOString().slice(0, 10);
  const btn = d.createElement('button'); btn.id = 'ccToolsBtn'; btn.title = 'Cafe Tools (T)'; btn.setAttribute('aria-label', 'Cafe Tools'); btn.innerHTML = '<i class="fas fa-toolbox"></i>'; d.body.appendChild(btn);
  function age(a, b) { let y = b.getFullYear() - a.getFullYear(), m = b.getMonth() - a.getMonth(), dd = b.getDate() - a.getDate(); if (dd < 0) { m--; dd += new Date(b.getFullYear(), b.getMonth(), 0).getDate(); } if (m < 0) { y--; m += 12; } return { y, m, d: dd }; }
  const TABS = { age: ['Umar', 'cake-candles'], calc: ['Calculator', 'calculator'], token: ['Token', 'ticket'], notes: ['Notes', 'note-sticky'] };
  const speak = n => { try { const u = new SpeechSynthesisUtterance(`Token number ${n}. Kripya counter par aayiye.`); u.lang = 'hi-IN'; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) {} };
  const view = {
    age: () => `<label>Janm tithi</label><input type="date" id="a1"><label>Is tithi tak umar ginni hai</label><input type="date" id="a2" value="${today()}"><div class="cct-row"><div><label>Kam se kam umar</label><input type="number" id="a3" placeholder="jaise 18"></div><div><label>Zyada se zyada umar</label><input type="number" id="a4" placeholder="jaise 27"></div></div><div class="cct-res" id="ar">Janm tithi chuniye</div>`,
    calc: () => `<h4>Percentage</h4><div class="cct-row"><input type="number" id="c1" placeholder="Mile ank"><input type="number" id="c2" placeholder="Poore ank"></div><div class="cct-res" id="cr1">-</div><h4>Print / photocopy</h4><div class="cct-row"><input type="number" id="c3" placeholder="Pages"><input type="number" id="c4" placeholder="Rate (₹)"></div><div class="cct-res" id="cr2">-</div><h4>Discount</h4><div class="cct-row"><input type="number" id="c5" placeholder="Total (₹)"><input type="number" id="c6" placeholder="Chhoot (%)"></div><div class="cct-res" id="cr3">-</div>`,
    token: () => { const t = get('ccToken', { n: 0 }); return `<div class="cct-tok"><small>Abhi ka token</small><b id="tn">${t.n}</b></div><div class="cct-row"><button class="cct-b" data-t="prev">‹ Pichla</button><button class="cct-b big" data-t="next">Agla +1</button></div><div class="cct-row"><button class="cct-b g" data-t="again"><i class="fas fa-volume-high"></i> Awaaz se bulayein</button><button class="cct-b g" data-t="reset">Reset</button></div>`; },
    notes: () => { const n = get('ccNotes', []); return `<p class="cct-mu">Roz kaam aane wale text (address, email, shabd). Sirf is device me save hote hain. Aadhaar ya password na rakhein.</p><div class="cct-row"><input id="nt" placeholder="Naya note likhein..."><button class="cct-b" data-n="add">Jodein</button></div><div class="cct-list">${n.map((x, i) => `<div><span>${esc(x)}</span><button data-n="cp" data-i="${i}" title="Copy"><i class="fas fa-copy"></i></button><button data-n="del" data-i="${i}" title="Hatayein"><i class="fas fa-trash"></i></button></div>`).join('') || '<p class="cct-mu">Abhi koi note nahi.</p>'}</div>`; }
  };
  function calc(o) {
    const v = id => parseFloat($('#' + id)?.value);
    if ($('#ar')) { const a = $('#a1').value, b = $('#a2').value; if (a && b) { const r = age(new Date(a), new Date(b)), lo = v('a3'), hi = v('a4'); let ok = ''; if (!isNaN(lo) || !isNaN(hi)) { const good = (isNaN(lo) || r.y >= lo) && (isNaN(hi) || r.y < hi + 1 && !(r.y === hi && (r.m || r.d))); ok = `<span class="${good ? 'ok' : 'no'}">${good ? 'Umar seema ke andar' : 'Umar seema ke bahar'}</span>`; } $('#ar').innerHTML = `<b>${r.y}</b> saal <b>${r.m}</b> mahine <b>${r.d}</b> din ${ok}`; } else $('#ar').textContent = 'Janm tithi chuniye'; }
    if ($('#cr1')) { const a = v('c1'), b = v('c2'); $('#cr1').innerHTML = b ? `<b>${(a / b * 100).toFixed(2)}%</b>` : '-'; const p = v('c3'), r = v('c4'); $('#cr2').innerHTML = p && r ? `<b>₹${(p * r).toFixed(2)}</b>` : '-'; const t = v('c5'), s = v('c6'); $('#cr3').innerHTML = t ? `Chhoot ₹${(t * (s || 0) / 100).toFixed(2)} · Dena: <b>₹${(t - t * (s || 0) / 100).toFixed(2)}</b>` : '-'; }
  }
  function open(tab) {
    tab = tab || get('ccTab', 'age'); set('ccTab', tab);
    let o = $('.cct-ov'); if (!o) { o = d.createElement('div'); o.className = 'cct-ov'; d.body.appendChild(o); }
    o.innerHTML = `<div class="cct"><button class="cct-x" aria-label="Band karein"><i class="fas fa-xmark"></i></button><h3><i class="fas fa-toolbox"></i> Cafe Tools</h3><div class="cct-tabs">${Object.entries(TABS).map(([k, [l, i]]) => `<button data-tab="${k}" class="${k === tab ? 'on' : ''}"><i class="fas fa-${i}"></i> ${l}</button>`).join('')}</div><div class="cct-body">${view[tab]()}</div></div>`;
    o.onclick = e => {
      if (e.target === o || e.target.closest('.cct-x')) return o.remove();
      const tb = e.target.closest('[data-tab]'); if (tb) return open(tb.dataset.tab);
      const t = e.target.closest('[data-t]')?.dataset.t; if (t) { const s = get('ccToken', { n: 0 }); if (t === 'next') s.n++; if (t === 'prev') s.n = Math.max(0, s.n - 1); if (t === 'reset') s.n = 0; set('ccToken', s); $('#tn').textContent = s.n; if (t === 'next' || t === 'again') speak(s.n); return; }
      const n = e.target.closest('[data-n]'), a = n?.dataset.n; if (a) { const L = get('ccNotes', []); if (a === 'add') { const x = $('#nt').value.trim(); if (x) { L.unshift(x); set('ccNotes', L.slice(0, 40)); } } if (a === 'del') { L.splice(+n.dataset.i, 1); set('ccNotes', L); } if (a === 'cp') { navigator.clipboard?.writeText(L[+n.dataset.i]); n.innerHTML = '<i class="fas fa-check"></i>'; return; } open('notes'); }
    };
    o.oninput = () => calc(o); o.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'nt') o.querySelector('[data-n=add]').click(); });
  }
  btn.onclick = () => open();
  d.addEventListener('keydown', e => { const typing = /INPUT|TEXTAREA|SELECT/.test(e.target.tagName) || e.target.isContentEditable; if (e.key === 'Escape') $('.cct-ov')?.remove(); if ((e.key === 't' || e.key === 'T') && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) { e.preventDefault(); $('.cct-ov') ? $('.cct-ov').remove() : open(); } });
  addEventListener('storage', e => { if (e.key === 'ccToken' && $('#tn')) $('#tn').textContent = (get('ccToken', { n: 0 })).n; });
})();
