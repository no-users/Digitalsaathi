/* Click & Connect: chhote smooth features (scroll reveal, upar jaane ka button, offline alert, ripple, prefetch, safe links) */
(function () {
  const d = document, rm = matchMedia('(prefers-reduced-motion:reduce)').matches;
  d.querySelectorAll('a[target=_blank]').forEach(a => { a.rel = (a.rel + ' noopener noreferrer').trim(); });
  d.querySelectorAll('img:not([loading])').forEach(i => { i.loading = 'lazy'; i.decoding = 'async'; });
  if (!rm && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('ccr-in'); io.unobserve(e.target); } }), { threshold: .06 });
    const SEL = '.tool-card-item,.premium-link-card,.service-card'; let n = 0;
    const one = el => { if (el._ccr) return; el._ccr = 1; el.classList.add('ccr'); el.style.transitionDelay = (n++ % 8) * 45 + 'ms'; io.observe(el); };
    const reg = r => { if (r.matches && r.matches(SEL)) one(r); r.querySelectorAll && r.querySelectorAll(SEL).forEach(one); };
    reg(d); new MutationObserver(ms => { n = 0; ms.forEach(m => m.addedNodes.forEach(x => { if (x.nodeType === 1) reg(x); })); }).observe(d.body, { childList: true, subtree: true });
  }
  const top = d.createElement('button'); top.id = 'ccTop'; top.setAttribute('aria-label', 'Upar jaayein'); top.innerHTML = '<i class="fas fa-arrow-up"></i>'; d.body.appendChild(top);
  let tgt = null;
  d.addEventListener('scroll', e => { const t = (e.target === d || e.target === d.documentElement) ? d.scrollingElement : e.target; if (!t || !t.clientHeight || t.clientHeight < 300 || t.clientWidth < 500 || t.scrollHeight <= t.clientHeight + 200) return; tgt = t; top.classList.toggle('show', t.scrollTop > 500); }, true);
  top.onclick = () => tgt && tgt.scrollTo({ top: 0, behavior: 'smooth' });
  const bar = (m, ok) => { let b = d.getElementById('ccNet'); if (!b) { b = d.createElement('div'); b.id = 'ccNet'; d.body.appendChild(b); } b.textContent = m; b.className = ok ? 'ok show' : 'show'; clearTimeout(bar.t); if (ok) bar.t = setTimeout(() => b.classList.remove('show'), 2200); };
  addEventListener('offline', () => bar('Internet band hai. Kuch cheezein nahi chalengi.')); addEventListener('online', () => bar('Wapas online', 1));
  d.addEventListener('pointerdown', e => { const b = e.target.closest('button,.btn-update,.dock-item'); if (!b || rm || b.id === 'ccTop') return; const r = b.getBoundingClientRect(), s = d.createElement('span'), z = Math.max(r.width, r.height); s.className = 'cc-rip'; s.style.cssText = `width:${z}px;height:${z}px;left:${e.clientX - r.left - z / 2}px;top:${e.clientY - r.top - z / 2}px`; if (getComputedStyle(b).position === 'static') b.style.position = 'relative'; b.style.overflow = 'hidden'; b.appendChild(s); setTimeout(() => s.remove(), 650); }, { passive: true });
  const seen = new Set(); d.addEventListener('pointerover', e => { const a = e.target.closest && e.target.closest('a[href$=".html"]'); if (!a || seen.has(a.href) || a.target === '_blank' || a.origin !== location.origin) return; seen.add(a.href); const l = d.createElement('link'); l.rel = 'prefetch'; l.href = a.href; d.head.appendChild(l); }, { passive: true });
})();
