/* Click & Connect: Mobile dashboard
   Ek hi realtime listener se folders, sub-chips, cards, banners aur notification bell sab Firebase se aate hain.
   Admin panel ke Hide / Pin / Schedule (showFrom, showUntil) bhi yahan lagu hote hain. */
(function () {
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const todayStr = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
    const fmt = d => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    const $ = id => document.getElementById(id);

    let CFG = null, UPD = [], SUB = 'all', SUBPAR = '', bannerIx = 0, bannerTimer = null;

    // ---------- admin ke hide / pin / schedule ----------
    function prep(config) {
        const t = todayStr();
        const ok = x => !x.hidden && (!x.showFrom || t >= x.showFrom) && (!x.showUntil || t <= x.showUntil);
        const pin = a => (a || []).slice().sort((p, q) => (q.pinned ? 1 : 0) - (p.pinned ? 1 : 0));
        const hideF = new Set((config.folders || []).filter(x => !ok(x)).map(x => x.name));
        const hideS = new Set((config.subs || []).filter(x => !ok(x)).map(x => x.parent + '|' + x.name));
        const vis = x => ok(x) && !hideF.has(x.folder) && !hideS.has(x.folder + '|' + x.sub);
        return {
            folders: pin((config.folders || []).filter(ok)),
            subs: pin((config.subs || []).filter(x => ok(x) && !hideF.has(x.parent))),
            cards: pin((config.cards || []).filter(vis)),
            notice: (config.noticeUntil && t > config.noticeUntil) ? '' : (config.notice || '')
        };
    }

    // ---------- status helper ----------
    function updStatus(u) {
        const D1 = 864e5, now = Date.now(), end = new Date(u.endDate + 'T00:00:00').getTime() + D1;
        const st = u.startDate ? new Date(u.startDate + 'T00:00:00').getTime() : null;
        if (now >= end) return { k: 'closed', txt: 'Khatam' };
        if (st && now < st) return { k: 'up', txt: Math.ceil((st - now) / D1) + ' din me shuru' };
        const d = Math.floor((end - now) / D1);
        return { k: d === 0 ? 'today' : d <= 3 ? 'soon' : 'live', txt: d === 0 ? 'Aaj last!' : d + ' din baaki' };
    }
    const liveUpdates = () => UPD.filter(u => u.endDate && updStatus(u).k !== 'closed')
        .sort((a, b) => a.endDate.localeCompare(b.endDate));

    // ---------- folders ----------
    function renderFolders() {
        const box = $('firebaseMobileCategories'); if (!box || !CFG) return;
        const c = prep(CFG);
        box.innerHTML = c.folders.length ? c.folders.map(f => `
            <a href="#" class="cat-pill" data-folder="${esc(f.name)}">
                <div class="cat-icon-wrap" style="background: rgba(79,70,229,0.1); color: ${esc(f.color || '#4f46e5')};">
                    <i class="${esc(f.icon || 'fas fa-folder')}"></i>
                </div>
                <span>${esc(f.name)}</span>
            </a>`).join('') : '<span style="font-size:12px;color:#64748b;padding:10px;">Abhi koi folder nahi hai</span>';
    }

    // ---------- sub chips ----------
    function renderChips() {
        const box = $('firebaseSubChips'); if (!box || !CFG) return;
        const c = prep(CFG);
        let h = `<button class="chip-btn ${SUB === 'all' ? 'active' : ''}" data-sub="all">All</button><button class="chip-btn ${SUB === '__recent' ? 'active' : ''}" data-sub="__recent">Recent</button>`;
        c.subs.forEach(s => { if (s.name) h += `<button class="chip-btn ${SUB === s.name && SUBPAR === (s.parent || '') ? 'active' : ''}" data-sub="${esc(s.name)}" data-parent="${esc(s.parent || '')}">${esc(s.name)}</button>`; });
        box.innerHTML = h;
    }

    // ---------- cards ----------
    function recentTitles() {
        try { return (JSON.parse(localStorage.getItem('digital_saathi_recent_portals')) || []).map(x => x.title); } catch (e) { return []; }
    }
    function renderCards() {
        const box = $('firebaseCardsContainer'); if (!box || !CFG) return;
        let cards = prep(CFG).cards;
        if (SUB === '__recent') { const r = recentTitles(); cards = cards.filter(c => r.includes(c.title)); }
        else if (SUB !== 'all') {
            cards = cards.filter(c => String(c.sub || '').trim().toLowerCase() === SUB.trim().toLowerCase() && (!SUBPAR || !c.folder || c.folder === SUBPAR));
        }
        box.innerHTML = '';
        if (!cards.length) { box.innerHTML = '<p style="text-align:center;color:#64748b;padding:24px;font-size:13px;">Is section me abhi koi card nahi hai.</p>'; return; }
        let i = 0;
        while (i < cards.length) {
            const v = document.createElement('div'); v.className = 'mobile-vertical-group';
            for (let n = 0; n < 2 && i < cards.length; n++, i++) v.appendChild(window.createCardElementMixed(cards[i]));
            box.appendChild(v);
            if (i >= cards.length) break;
            const h = document.createElement('div'); h.className = 'mobile-horizontal-scroll-row';
            for (let n = 0; n < 3 && i < cards.length; n++, i++) h.appendChild(window.createCardElementMixed(cards[i]));
            box.appendChild(h);
        }
    }

    // ---------- banners (Firebase 'updates' collection) ----------
    function renderBanner() {
        const car = $('bannerCarousel'), tag = $('bannerHashtag'), dots = $('bannerDots'); if (!car) return;
        const L = liveUpdates();
        if (dots) dots.innerHTML = L.map((_, i) => `<span class="dot ${i === bannerIx ? 'active' : ''}"></span>`).join('');
        if (!L.length) { car.innerHTML = '<div class="banner-card"><div class="banner-content"><h4>Abhi koi naya update nahi</h4><p>Admin panel se jo update publish hoga wo yahan dikhega.</p></div></div>'; if (tag) tag.textContent = '#Updates'; return; }
        bannerIx = bannerIx % L.length;
        const u = L[bannerIx], s = updStatus(u);
        if (tag) tag.textContent = '#' + String(u.category || 'Update').replace(/\s+/g, '');
        car.innerHTML = `<div class="banner-card" data-ix="${bannerIx}">
            <div class="banner-date-badge"><i class="fas fa-clock"></i> ${esc(u.startDate ? fmt(u.startDate) + ' se ' : 'Last date: ')}${esc(fmt(u.endDate))} · ${esc(s.txt)}</div>
            <div class="banner-content"><h4>${esc(u.title)}</h4><p>${esc(u.summary || u.fee || '')}</p>
            <button class="banner-apply-btn" data-ix="${bannerIx}">Details dekhein</button></div></div>`;
    }
    function startBannerTimer() {
        clearInterval(bannerTimer);
        bannerTimer = setInterval(() => { if (liveUpdates().length > 1) { bannerIx++; renderBanner(); } }, 4000);
    }
    function openUpdate(u) {
        const links = [];
        if (u.sourceUrl) links.push({ name: 'Official source kholein', url: u.sourceUrl });
        const card = (CFG && CFG.cards || []).find(c => c.title === u.cardTitle);
        if (card && card.url) links.push({ name: card.title + ' (Apply)', url: card.url });
        if (card && card.officialLink) links.push({ name: 'Official link', url: card.officialLink });
        window.openMultiLinkPopup(u.title + ' · ' + fmt(u.endDate), links.length ? links : [{ name: 'Koi link nahi jodi gayi', url: '#' }]);
    }

    // ---------- notification bell ----------
    function renderBell() {
        const bell = document.querySelector('.notification-badge-btn'); if (!bell) return;
        const n = liveUpdates().length;
        bell.style.position = 'relative';
        let b = bell.querySelector('.cc-bell-count');
        if (!b) { b = document.createElement('span'); b.className = 'cc-bell-count'; b.style.cssText = 'position:absolute;top:-4px;right:-4px;min-width:18px;height:18px;padding:0 4px;border-radius:9px;background:#DD603E;color:#fff;font:700 11px/18px sans-serif;text-align:center'; bell.appendChild(b); }
        b.textContent = n; b.style.display = n ? '' : 'none';
    }
    function openBell() {
        const L = liveUpdates();
        const list = L.length ? L.map(u => ({ name: u.title + ' · ' + updStatus(u).txt, url: u.sourceUrl || '#' })) : [{ name: 'Abhi koi naya notification nahi', url: '#' }];
        window.openMultiLinkPopup('Notifications', list);
    }
    function notifyNew(u) {
        const msg = (u.title || 'Naya update') + (u.endDate ? ' · Last date: ' + fmt(u.endDate) : '');
        try { if ('Notification' in window && Notification.permission === 'granted') new Notification('Click & Connect · Naya Update', { body: msg, icon: 'assets/img/Web_Icon.png' }); } catch (e) {}
    }

    // ---------- events ----------
    document.addEventListener('click', e => {
        const chip = e.target.closest && e.target.closest('.chip-btn[data-sub]');
        if (chip) { SUB = chip.dataset.sub; SUBPAR = chip.dataset.parent || ''; renderChips(); renderCards(); return; }
        const pill = e.target.closest && e.target.closest('.cat-pill[data-folder]');
        if (pill) {
            e.preventDefault();
            const first = prep(CFG || {}).subs.find(s => s.parent === pill.dataset.folder);
            SUB = first ? first.name : 'all'; SUBPAR = first ? (first.parent || '') : ''; renderChips(); renderCards(); return;
        }
        const bb = e.target.closest && e.target.closest('.banner-apply-btn, .banner-card');
        if (bb && bb.dataset.ix !== undefined) { const u = liveUpdates()[+bb.dataset.ix]; if (u) openUpdate(u); return; }
        if (e.target.closest && e.target.closest('.notification-badge-btn')) {
            openBell();
            try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission(); } catch (err) {}
        }
    });

    function status(msg) {
        let b = $('ccMobErr');
        if (!msg) { if (b) b.remove(); return; }
        if (!b) { b = document.createElement('div'); b.id = 'ccMobErr'; b.style.cssText = 'position:fixed;left:10px;right:10px;bottom:76px;z-index:9999;background:#c0392b;color:#fff;padding:10px 14px;border-radius:12px;font:600 12px/1.5 sans-serif'; b.onclick = () => b.remove(); document.body.appendChild(b); }
        b.textContent = msg;
    }

    function start() {
        db.collection('data').doc('matrix_config').onSnapshot(doc => {
            CFG = doc.exists ? doc.data() : { folders: [], subs: [], cards: [] };
            status(doc.exists ? '' : 'Firebase me data/matrix_config abhi bana nahi hai. Admin panel se ek folder save karein.');
            renderFolders(); renderChips(); renderCards(); renderBanner();
        }, err => {
            console.error('matrix_config:', err);
            status('Data nahi aa raha: ' + (window.ccFbHint ? window.ccFbHint(err) : (err.code || err.message)));
            const f = $('firebaseMobileCategories'); if (f && !CFG) f.innerHTML = '<span style="font-size:12px;color:#ef4444;padding:10px;">Load nahi hua</span>';
        });
        let first = true;
        db.collection('updates').where('published', '==', true).onSnapshot(s => {
            UPD = s.docs.map(d => ({ id: d.id, ...d.data() }));
            if (!first) s.docChanges().forEach(ch => { if (ch.type === 'added') notifyNew(ch.doc.data()); });
            first = false; renderBanner(); renderBell(); startBannerTimer();
        }, err => { console.warn('updates:', err); renderBell(); });
    }

    document.addEventListener('DOMContentLoaded', () => {
        renderBell();
        (window.ccAuthReady || Promise.resolve(null)).then(u => { if (u) start(); });
    });
})();
