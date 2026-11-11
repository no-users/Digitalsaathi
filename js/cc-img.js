/* Click & Connect: image links ko theek karta hai (Google/Drive/Dropbox/Imgur) aur fail hone par sundar placeholder dikhata hai */
(function () {
  function norm(u) {
    u = String(u || '').trim(); if (!u) return '';
    try {
      if (u.startsWith('//')) u = 'https:' + u;
      const x = new URL(u), h = x.hostname;
      if (/google\./.test(h) && x.pathname === '/imgres' && x.searchParams.get('imgurl')) return norm(x.searchParams.get('imgurl'));
      if (/google\./.test(h) && x.pathname === '/url' && (x.searchParams.get('url') || x.searchParams.get('q'))) return norm(x.searchParams.get('url') || x.searchParams.get('q'));
      if (h === 'drive.google.com' || h === 'docs.google.com') { const m = x.pathname.match(/\/d\/([\w-]+)/) || [null, x.searchParams.get('id')]; if (m[1]) return 'https://lh3.googleusercontent.com/d/' + m[1]; }
      if (/dropbox\.com$/.test(h)) { x.hostname = 'dl.dropboxusercontent.com'; x.searchParams.delete('dl'); return x.toString(); }
      if (h === 'imgur.com' && /^\/\w+$/.test(x.pathname)) return 'https://i.imgur.com' + x.pathname + '.jpg';
      if (x.protocol === 'http:') x.protocol = 'https:';
      return x.toString();
    } catch (e) { return u; }
  }
  window.ccImg = u => norm(u);
  window.ccImgFail = function (img) {
    if (!img.dataset.o) img.dataset.o = img.src;
    const m = img.src.match(/lh3\.googleusercontent\.com\/d\/([\w-]+)/);
    if (m && !img.dataset.t) { img.dataset.t = 1; img.src = 'https://drive.google.com/thumbnail?id=' + m[1] + '&sz=w1000'; return; }
    if (!img.dataset.p && /^https?:/.test(img.dataset.o) && !/wsrv\.nl/.test(img.dataset.o)) { img.dataset.p = 1; img.referrerPolicy = 'no-referrer'; img.src = 'https://wsrv.nl/?url=' + encodeURIComponent(img.dataset.o) + '&w=900&output=webp'; return; }
    img.onerror = null; const p = img.closest('.card-img-wrapper') || img.parentElement; if (p) p.style.display = 'none';
  };
})();
