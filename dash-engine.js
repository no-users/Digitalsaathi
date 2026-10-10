// ye video clock ke part 2 hai part 1 niche me hai 
window.addEventListener('load', () => {
    const clock = document.getElementById('digital-clock');
    console.log("Clock Element Found:", clock); 
    if(!clock) {
    }
});

// AAPKA CLOCK FUNCTION (Updated for absolute stability)
function updateClock() {
    const clockElement = document.getElementById('digital-clock');
    const dateElement = document.getElementById('date-text');

    if (!clockElement || !dateElement) return;

    const now = new Date();
    
    // Time Formatting
    const timeString = now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    
    // Date Formatting
    const dateString = now.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        weekday: 'short'
    });

    clockElement.innerText = timeString;
    dateElement.innerText = dateString;
}

// Interval
setInterval(updateClock, 1000);
updateClock();




//              ..............................////////////
    


    if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(() => console.log('Click & Connect PWA Registered!'));
}



// 1. REAL-TIME FIREBASE SYNC
db.collection('data').doc('matrix_config').onSnapshot((doc) => {
    if (doc.exists) {
        renderUI(doc.data());
    }
});

// 2. RENDER LOGIC
function renderUI(config) {
    const sidebarMenu = document.getElementById('masterLiveSidebarMenu');
    const gridContainer = document.getElementById('toolsDisplayGrid');
    const noticeBoard = document.getElementById('liveNoticeBoardHeadlineText');
    const noResults = document.getElementById('noResultsMessage');

    if (!sidebarMenu) return;

    sidebarMenu.innerHTML = '';
    gridContainer.innerHTML = '';
    if (noResults) gridContainer.appendChild(noResults); 
    
    if (noticeBoard && config.notice) noticeBoard.innerText = config.notice;

    const applyColor = (color) => color || "#4f46e5";

    // Pre-count how many cards fall under each sub-category, so the sidebar
    // can show "(N)" badges — computed once, before the sidebar is built.
    const subCardCounts = {};
    if (config.cards) {
        config.cards.forEach(c => {
            const key = (c.sub || '').toLowerCase().trim();
            if (!key) return;
            subCardCounts[key] = (subCardCounts[key] || 0) + 1;
        });
    }

    // --- 1. RENDER FOLDERS AND SIDE-LINKS ---
    if (config.folders) {
        config.folders.forEach((mainFolder, fIdx) => {
            const safeFolderName = mainFolder.name.replace(/\s+/g, '');
            const folderColor = applyColor(mainFolder.color);

            const folderSubs = config.subs ? config.subs.filter(s => s.parent === mainFolder.name) : [];
            const folderTotal = folderSubs.reduce((sum, s) => sum + (subCardCounts[s.name.toLowerCase().trim()] || 0), 0);
            const folderBadge = '';

            const li = document.createElement('li');
            li.className = `menu-item ${fIdx === 0 ? 'open' : ''}`;
            li.setAttribute('data-folder', mainFolder.name);
            li.style.setProperty('--folder-color', folderColor);
            li.innerHTML = `
                <div class="menu-link">
                    <div class="menu-link-content">
                        <i class="${mainFolder.icon}" style="color: ${folderColor};"></i> 
                        <span>${mainFolder.name}</span>
                        ${folderBadge}
                    </div>
                    <i class="fas fa-chevron-down chevron-icon"></i>
                </div>
                <div class="submenu-container" id="container-${safeFolderName}"></div>
            `;
            sidebarMenu.appendChild(li);

            const subContainer = document.getElementById(`container-${safeFolderName}`);
            if (config.subs) {
                config.subs.filter(s => s.parent === mainFolder.name).forEach(subPortal => {
                    const subId = `subPortal-${subPortal.name.replace(/\s+/g, '')}`;
                    const subColor = applyColor(subPortal.color);
                    const subCount = subCardCounts[subPortal.name.toLowerCase().trim()] || 0;
                    const subBadge = '';

                    const subDiv = document.createElement('div');
                    subDiv.className = "submenu-link-toggle";
                    subDiv.setAttribute('data-target', subId);
                    subDiv.setAttribute('data-filter', subPortal.name.toLowerCase());
                    subDiv.innerHTML = `
                        <span class="menu-link-content">
                            <i class="${subPortal.icon}" style="color: ${subColor};"></i> <span class="cc-sub-name">${subPortal.name}</span>
                            ${subBadge}
                        </span>
                        <i class="fas fa-chevron-down nested-chevron"></i>
                    `;
                    subContainer.appendChild(subDiv);

                    const nestedContainer = document.createElement('div');
                    nestedContainer.className = "nested-submenu-container";
                    nestedContainer.id = subId;

                    if (config.sideLinks) {
                        config.sideLinks.filter(l => l.sub?.toLowerCase().trim() === subPortal.name.toLowerCase().trim()).forEach(dl => {
                            const dlAnchor = document.createElement('a');
                            dlAnchor.href = dl.url || '#';
                            dlAnchor.target = "_blank";
                            dlAnchor.className = "nested-submenu-link";
                            const dlColor = applyColor(dl.color);
                            dlAnchor.innerHTML = `<i class="${dl.icon}" style="color: ${dlColor};"></i> ${dl.label || dl.title}`;
                            nestedContainer.appendChild(dlAnchor);
                        });
                    }
                    subContainer.appendChild(nestedContainer);
                });
            }
        });
    }
// --- 2. RENDER CARDS (Dashboard) ---
    if (config.cards) {
        config.cards.forEach(card => {
            
            // Image logic
            const displayImage = card.imageUrl && card.imageUrl.trim() !== "" ? card.imageUrl : "default-icon.png";
            
            const anchor = document.createElement('div'); 
            anchor.className = `service-card-block tool-card-item`;
            anchor.setAttribute('data-sub', card.sub?.toLowerCase() || '');
            anchor.setAttribute('data-name', (card.title || card.name || '').toLowerCase());
            anchor.style.cursor = "pointer";
            
            anchor.style.setProperty('--card-accent', card.color || '#4f46e5');
            anchor.style.setProperty('--card-glow', (card.color || '#4f46e5') + '40');

            // SUPER CHECK: Popup kholne ka logic + Recent Portal Tracking
            if (card.links && Array.isArray(card.links) && card.links.length > 0) {
                anchor.onclick = () => {
                    addRecentPortal(card); // Recent list mein add karega
                    openServicePopup(card);
                };
            } else {
                anchor.onclick = () => {
                    addRecentPortal(card); // Recent list mein add karega
                    window.open(card.url || '#', '_blank');
                };
            }
            
            // Card HTML
            anchor.innerHTML = `
                <div class="square-icon-box" style="background-color: ${card.color || '#4f46e5'};">
                    <i class="${card.icon || 'fas fa-link'}"></i>
                </div>
                <div class="service-meta-text">
                    <h4>${card.title || card.name || 'Untitled'}</h4>
                    <p>${card.desc || card.description || ''}</p>
                </div>
            `;

            // Favorite (pin) star — click karke quick-access Favorites strip me pin/unpin karein
            const favBtn = document.createElement('button');
            favBtn.type = 'button';
            favBtn.className = 'fav-star-btn' + (isFavorite(card) ? ' is-fav' : '');
            favBtn.title = 'Favorite me pin karein';
            favBtn.innerHTML = `<i class="${isFavorite(card) ? 'fas' : 'far'} fa-star"></i>`;
            favBtn.onclick = (e) => {
                e.stopPropagation();
                toggleFavorite(card, favBtn);
            };
            anchor.appendChild(favBtn);

            gridContainer.appendChild(anchor);
        }); 
    }
    ccEnhanceSidebar(config);
} // <--- Yahan renderUI function close hua jo pehle missing tha

// 3. SINGLE MASTER EVENT LISTENER (Filter + UI Toggle)
document.getElementById('masterLiveSidebarMenu').addEventListener('click', function(e) {
    const allCards = document.querySelectorAll('.tool-card-item');
    const noResults = document.getElementById('noResultsMessage');
    const breadCrumb = document.getElementById('breadCrumbStatus');
    const sectionTitle = document.getElementById('gridSectionTitle');

    // 1. FOLDER CLICK: Reset UI (Show All)
    const menuLink = e.target.closest('.menu-link');
    if (menuLink) {
        // Sidebar UI toggle
        menuLink.parentElement.classList.toggle('open');
        
        // Sabhi cards dikhayein
        allCards.forEach(c => {
            c.style.display = "flex"; // Reset display
            c.classList.remove('card-hidden');
            c.classList.add('card-visible');
        });
        
        // Reset Breadcrumb and Title
        if (breadCrumb) breadCrumb.innerText = "Dashboard";
        if (sectionTitle) sectionTitle.innerText = "Sarkari Portals & Recruitment Desks";
        if (noResults) noResults.style.display = "none";
        ccSetClearFilterVisible(false);
        return;
    }

    // 2. SUB-FOLDER CLICK: Filter Logic
    const subToggle = e.target.closest('.submenu-link-toggle');
    if (subToggle) {
        e.stopPropagation(); // Parent tak click na jaye
        
        const filterVal = subToggle.getAttribute('data-filter').toLowerCase().trim();
        const subName = subToggle.querySelector('.cc-sub-name').innerText.trim(); // Sub-folder ka naam nikala (badge count exclude)
        
        // UI Toggle (Active state)
        subToggle.classList.toggle('active-toggle-item');
        const nestedMenu = document.getElementById(subToggle.getAttribute('data-target'));
        if (nestedMenu) nestedMenu.classList.toggle('nested-open');

        // Update Breadcrumb and Title Dynamically
        if (breadCrumb) breadCrumb.innerText = subName;
        if (sectionTitle) sectionTitle.innerText = subName;

        // Filter Execution
        let matchCount = 0;
        allCards.forEach(c => {
            const cardSub = c.getAttribute('data-sub').toLowerCase().trim();
            
            if (cardSub === filterVal) {
                c.style.display = "flex"; // Match hone par dikhayein
                c.classList.remove('card-hidden');
                c.classList.add('card-visible');
                matchCount++;
            } else {
                c.style.display = "none"; // Match na hone par chupayein
                c.classList.remove('card-visible');
                c.classList.add('card-hidden');
            }
        });

        // Agar result zero hai toh "No results" dikhayein
        if (noResults) noResults.style.display = (matchCount === 0) ? "block" : "none";
        ccSetClearFilterVisible(subToggle.classList.contains('active-toggle-item'));
    }
});

// ==========================================
// 8e2. SIDEBAR PRO (pin, drag-reorder, smart filter, tabs, flyout, keyboard)
// ==========================================
const PIN_KEY = 'cc_pinned_folders', ORDER_KEY = 'cc_folder_order', USAGE_KEY = 'cc_folder_usage';
const ccLS = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
let ccConfigRef = null;
let ccDragEl = null;

function ccMenu() { return document.getElementById('masterLiveSidebarMenu'); }
function ccFolders() { return [...ccMenu().querySelectorAll(':scope > .menu-item')]; }

function ccLabel(text, icon) {
    const li = document.createElement('li');
    li.className = 'cc-menu-label';
    li.innerHTML = `<i class="fas ${icon}"></i><span>${text}</span>`;
    return li;
}

function ccEnhanceSidebar(config) {
    ccConfigRef = config;
    const menu = ccMenu();
    if (!menu) return;

    ccFolders().forEach(li => {
        const link = li.querySelector(':scope > .menu-link');
        link.tabIndex = 0;
        const pin = document.createElement('button');
        pin.type = 'button';
        pin.className = 'cc-pin-btn';
        pin.title = 'Upar pin karein';
        pin.innerHTML = '<i class="fas fa-thumbtack"></i>';
        pin.addEventListener('click', e => { e.stopPropagation(); ccTogglePin(li.dataset.folder); });
        link.insertBefore(pin, link.querySelector('.chevron-icon'));
        li.querySelectorAll('.submenu-link-toggle').forEach(st => { st.tabIndex = 0; });

        // drag & drop reorder
        li.draggable = true;
        li.addEventListener('dragstart', e => {
            ccDragEl = li; li.classList.add('dragging');
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', li.dataset.folder);
        });
        li.addEventListener('dragend', () => {
            li.classList.remove('dragging'); ccDragEl = null;
            menu.querySelectorAll('.drag-over').forEach(x => x.classList.remove('drag-over'));
        });
        li.addEventListener('dragover', e => {
            if (!ccDragEl || ccDragEl === li) return;
            e.preventDefault(); li.classList.add('drag-over');
        });
        li.addEventListener('dragleave', () => li.classList.remove('drag-over'));
        li.addEventListener('drop', e => {
            e.preventDefault(); li.classList.remove('drag-over');
            if (!ccDragEl || ccDragEl === li) return;
            const all = ccFolders();
            if (all.indexOf(ccDragEl) < all.indexOf(li)) li.after(ccDragEl); else li.before(ccDragEl);
            const names = ccFolders().map(x => x.dataset.folder);
            const pins = ccLS(PIN_KEY, []);
            localStorage.setItem(ORDER_KEY, JSON.stringify(names));
            localStorage.setItem(PIN_KEY, JSON.stringify(names.filter(n => pins.includes(n))));
            ccApplyFolderOrder();
            showToast('Order save ho gaya', 'success');
        });
    });
    ccApplyFolderOrder();
    ccHandleLaunchParams();
}

function ccApplyFolderOrder() {
    const menu = ccMenu();
    const items = ccFolders();
    menu.querySelectorAll(':scope > .cc-menu-label').forEach(x => x.remove());
    const pins = ccLS(PIN_KEY, []), order = ccLS(ORDER_KEY, []), usage = ccLS(USAGE_KEY, {});
    const nm = li => li.dataset.folder;
    const orig = new Map(items.map((li, i) => [nm(li), i]));
    const pinned = pins.map(n => items.find(li => nm(li) === n)).filter(Boolean);
    const rest = items.filter(li => !pins.includes(nm(li)));
    if (order.length) {
        rest.sort((a, b) => {
            const ia = order.indexOf(nm(a)), ib = order.indexOf(nm(b));
            return ((ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib)) || (orig.get(nm(a)) - orig.get(nm(b)));
        });
    } else {
        // no manual order yet -> most-used folders float to the top
        rest.sort((a, b) => ((usage[nm(b)] || 0) - (usage[nm(a)] || 0)) || (orig.get(nm(a)) - orig.get(nm(b))));
    }
    items.forEach(li => li.classList.toggle('is-pinned', pins.includes(nm(li))));
    const frag = document.createDocumentFragment();
    if (pinned.length) { frag.append(ccLabel('Pinned', 'fa-thumbtack')); pinned.forEach(li => frag.append(li)); }
    frag.append(ccLabel('Categories', 'fa-layer-group'));
    rest.forEach(li => frag.append(li));
    menu.append(frag);
}

function ccTogglePin(name) {
    let pins = ccLS(PIN_KEY, []);
    const was = pins.includes(name);
    pins = was ? pins.filter(n => n !== name) : [...pins, name];
    localStorage.setItem(PIN_KEY, JSON.stringify(pins));
    ccApplyFolderOrder();
    showToast(was ? 'Pin hata diya' : `${name} upar pin ho gaya`, was ? 'info' : 'success');
}

// folder usage tracking (used for auto-sort on next load)
ccMenu()?.addEventListener('click', e => {
    const li = e.target.closest('.menu-item');
    if (!li || e.target.closest('.cc-pin-btn')) return;
    const u = ccLS(USAGE_KEY, {});
    u[li.dataset.folder] = (u[li.dataset.folder] || 0) + 1;
    localStorage.setItem(USAGE_KEY, JSON.stringify(u));
    ccSetPill(null);
});

// ---- Smart filter: folder names + sub names + card titles ----
document.getElementById('sidebarFilterInput')?.addEventListener('input', function () {
    const q = this.value.toLowerCase().trim();
    const menu = ccMenu();
    const bySub = {};
    ((ccConfigRef && ccConfigRef.cards) || []).forEach(c => {
        const k = (c.sub || '').toLowerCase().trim();
        (bySub[k] = bySub[k] || []).push(((c.title || c.name || '') + ' ' + (c.desc || '')).toLowerCase());
    });
    let shown = 0;
    ccFolders().forEach(li => {
        const folderName = (li.dataset.folder || '').toLowerCase();
        let anySub = false;
        li.querySelectorAll('.submenu-link-toggle').forEach(st => {
            const key = (st.getAttribute('data-filter') || '').toLowerCase().trim();
            const nameEl = st.querySelector('.cc-sub-name');
            const subName = nameEl ? nameEl.innerText.toLowerCase() : '';
            const match = !q || subName.includes(q) || (bySub[key] || []).some(t => t.includes(q));
            st.style.display = match ? '' : 'none';
            if (match && q) anySub = true;
        });
        const ok = !q || folderName.includes(q) || anySub;
        li.style.display = ok ? '' : 'none';
        if (ok) shown++;
        if (q && anySub) li.classList.add('open');
    });
    menu.querySelectorAll(':scope > .cc-menu-label').forEach(l => { l.style.display = q ? 'none' : ''; });
    let empty = document.getElementById('ccSidebarEmpty');
    if (!empty) {
        empty = document.createElement('li');
        empty.id = 'ccSidebarEmpty';
        empty.className = 'cc-sidebar-empty';
        empty.innerHTML = '<i class="fas fa-magnifying-glass"></i> Kuch nahi mila';
        menu.appendChild(empty);
    }
    empty.style.display = (q && shown === 0) ? 'flex' : 'none';
});
document.getElementById('sidebarFilterInput')?.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { this.value = ''; this.dispatchEvent(new Event('input')); }
});

// ---- All / Favorites quick tabs ----
function ccSetPill(which) {
    document.querySelectorAll('.cc-quick-pill').forEach(p => p.classList.toggle('active', p.dataset.view === which));
}
function ccQuickView(which) {
    if (which === 'all') { ccClearFilter(); return; }
    const cards = document.querySelectorAll('.tool-card-item');
    const noResults = document.getElementById('noResultsMessage');
    let n = 0;
    cards.forEach(c => {
        const title = (c.querySelector('h4') || {}).innerText || '';
        const fav = isFavorite({ title: title });
        c.style.display = fav ? 'flex' : 'none';
        c.classList.toggle('card-hidden', !fav);
        c.classList.toggle('card-visible', fav);
        if (fav) n++;
    });
    document.querySelectorAll('.submenu-link-toggle.active-toggle-item').forEach(t => t.classList.remove('active-toggle-item'));
    document.querySelectorAll('.nested-submenu-container.nested-open').forEach(x => x.classList.remove('nested-open'));
    const bc = document.getElementById('breadCrumbStatus'); if (bc) bc.innerText = 'Favorites';
    const st = document.getElementById('gridSectionTitle'); if (st) st.innerText = 'Favorites';
    if (noResults) noResults.style.display = n === 0 ? 'block' : 'none';
    ccSetClearFilterVisible(true);
    ccSetPill('fav');
    if (n === 0) showToast('Abhi koi favorite nahi — card ke star par click karein', 'info');
}

// ---- Collapsed-mode hover flyout ----
let ccFlyEl = null, ccFlyTimer = null;
function ccHideFlyout() { if (ccFlyEl) ccFlyEl.classList.remove('show'); }
function ccShowFlyout(li) {
    const sb = document.getElementById('ccSidebar');
    if (!sb || !sb.classList.contains('collapsed')) return;
    if (!ccFlyEl) {
        ccFlyEl = document.createElement('div');
        ccFlyEl.className = 'cc-flyout';
        document.body.appendChild(ccFlyEl);
        ccFlyEl.addEventListener('mouseenter', () => clearTimeout(ccFlyTimer));
        ccFlyEl.addEventListener('mouseleave', () => { ccFlyTimer = setTimeout(ccHideFlyout, 150); });
    }
    clearTimeout(ccFlyTimer);
    ccFlyEl.innerHTML = '';
    const title = document.createElement('div');
    title.className = 'cc-fly-title';
    title.style.color = li.style.getPropertyValue('--folder-color') || 'var(--cc-purple)';
    title.textContent = li.dataset.folder;
    ccFlyEl.appendChild(title);
    const subs = li.querySelectorAll('.submenu-link-toggle');
    if (!subs.length) {
        const none = document.createElement('div');
        none.className = 'cc-fly-empty'; none.textContent = 'Koi sub-category nahi';
        ccFlyEl.appendChild(none);
    }
    subs.forEach(st => {
        const row = document.createElement('div');
        row.className = 'cc-fly-item';
        const ic = st.querySelector('i');
        if (ic) row.appendChild(ic.cloneNode(true));
        const sp = document.createElement('span');
        sp.textContent = (st.querySelector('.cc-sub-name') || {}).innerText || '';
        row.appendChild(sp);
        row.addEventListener('click', () => {
            ccApplySidebarState(false);
            localStorage.setItem(SIDEBAR_COLLAPSE_KEY, 'false');
            li.classList.add('open');
            ccHideFlyout();
            st.click();
        });
        ccFlyEl.appendChild(row);
    });
    ccFlyEl.classList.add('show');
    const r = li.getBoundingClientRect();
    ccFlyEl.style.left = (sb.getBoundingClientRect().right + 8) + 'px';
    ccFlyEl.style.top = Math.max(8, Math.min(r.top, window.innerHeight - ccFlyEl.offsetHeight - 12)) + 'px';
}
ccMenu()?.addEventListener('mouseover', e => {
    const li = e.target.closest('.menu-item');
    if (li) ccShowFlyout(li);
});
ccMenu()?.addEventListener('mouseleave', () => { ccFlyTimer = setTimeout(ccHideFlyout, 150); });

// ---- Keyboard navigation (arrows / Enter / left-right) ----
function ccNavItems() {
    return [...ccMenu().querySelectorAll('.menu-link, .submenu-link-toggle, .nested-submenu-link')].filter(el =>
        el.offsetParent !== null &&
        !el.closest('.menu-item:not(.open) > .submenu-container') &&
        !el.closest('.nested-submenu-container:not(.nested-open)'));
}
document.getElementById('ccSidebar')?.addEventListener('keydown', e => {
    const t = e.target;
    const filterInput = document.getElementById('sidebarFilterInput');
    if (t === filterInput) {
        if (e.key === 'ArrowDown') { e.preventDefault(); const f = ccNavItems()[0]; if (f) f.focus(); }
        return;
    }
    const items = ccNavItems();
    const i = items.indexOf(t);
    if (i < 0) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); if (items[i + 1]) items[i + 1].focus(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); if (i === 0) filterInput && filterInput.focus(); else items[i - 1].focus(); }
    else if ((e.key === 'Enter' || e.key === ' ') && t.tagName !== 'A') { e.preventDefault(); t.click(); }
    else if (e.key === 'ArrowRight' && t.classList.contains('menu-link')) { t.parentElement.classList.add('open'); }
    else if (e.key === 'ArrowLeft') {
        if (t.classList.contains('menu-link')) t.parentElement.classList.remove('open');
        else { const parent = t.closest('.menu-item'); if (parent) parent.querySelector(':scope > .menu-link').focus(); }
    }
});

// ---- Sidebar profile card ----
function ccSidebarLogout() {
    if (typeof ccLogout === 'function') { ccLogout(); return; }
    if (typeof auth !== 'undefined') auth.signOut().then(() => { window.location.href = 'login.html'; });
}

// ---- Brand splash (once per session) ----
let ccSplashDone = false;
function ccHideSplash() {
    if (ccSplashDone) return;
    ccSplashDone = true;
    const s = document.getElementById('ccSplash');
    if (!s) return;
    s.classList.add('hide');
    sessionStorage.setItem('cc_splash', '1');
    setTimeout(() => s.remove(), 650);
}
(function () {
    const quick = document.documentElement.classList.contains('no-splash');
    window.addEventListener('load', () => setTimeout(ccHideSplash, quick ? 0 : 1100));
    setTimeout(ccHideSplash, 3500); // safety net
})();

// ==========================================
// 8f. CLEAR-FILTER CHIP + SIDEBAR COLLAPSE
// ==========================================
function ccSetClearFilterVisible(show) {
    const btn = document.getElementById('clearFilterBtn');
    if (btn) btn.style.display = show ? 'inline-flex' : 'none';
}

function ccClearFilter() {
    const allCards = document.querySelectorAll('.tool-card-item');
    const noResults = document.getElementById('noResultsMessage');
    const breadCrumb = document.getElementById('breadCrumbStatus');
    const sectionTitle = document.getElementById('gridSectionTitle');

    allCards.forEach(c => {
        c.style.display = "flex";
        c.classList.remove('card-hidden');
        c.classList.add('card-visible');
    });
    document.querySelectorAll('.submenu-link-toggle.active-toggle-item').forEach(t => t.classList.remove('active-toggle-item'));
    document.querySelectorAll('.nested-submenu-container.nested-open').forEach(n => n.classList.remove('nested-open'));

    if (breadCrumb) breadCrumb.innerText = "Dashboard";
    if (sectionTitle) sectionTitle.innerText = "Sarkari Portals & Recruitment Desks";
    if (noResults) noResults.style.display = "none";
    ccSetClearFilterVisible(false);
    ccSetPill('all');
}

const SIDEBAR_COLLAPSE_KEY = 'cc_sidebar_collapsed';

function ccApplySidebarState(collapsed) {
    const sidebar = document.getElementById('ccSidebar');
    const btn = document.getElementById('sidebarCollapseBtn');
    if (!sidebar) return;
    sidebar.classList.toggle('collapsed', collapsed);
    if (btn) btn.querySelector('i').className = collapsed ? 'fas fa-angles-right' : 'fas fa-angles-left';
}

function ccToggleSidebar() {
    const sidebar = document.getElementById('ccSidebar');
    const isCollapsed = sidebar.classList.contains('collapsed');
    ccApplySidebarState(!isCollapsed);
    localStorage.setItem(SIDEBAR_COLLAPSE_KEY, (!isCollapsed).toString());
}

document.addEventListener('DOMContentLoaded', () => {
    ccApplySidebarState(localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === 'true');

    // Collapsed sidebar: any click inside just re-expands it (icons alone
    // aren't enough to navigate the nested menu, so this is the escape hatch)
    const sidebarEl = document.getElementById('ccSidebar');
    if (sidebarEl) {
        sidebarEl.querySelector('.menu-list')?.addEventListener('click', (e) => {
            if (sidebarEl.classList.contains('collapsed')) {
                e.stopPropagation();
                ccApplySidebarState(false);
                localStorage.setItem(SIDEBAR_COLLAPSE_KEY, 'false');
            }
        }, true);
    }
});

// 1. CLOCK LOGIC
setInterval(() => {
    const clock = document.getElementById('liveMatrixClock');
    if (clock) {
        clock.innerText = new Date().toLocaleTimeString('en-IN', { 
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true 
        });
    }
}, 1000);





function toggleFabMenu() {
    const menu = document.getElementById('fabMenu');
    menu.classList.toggle('active');
    
    // Button rotate animation
    const btn = document.querySelector('.fab-main i');
    btn.style.transform = menu.classList.contains('active') ? 'rotate(45deg)' : 'rotate(0deg)';
    btn.style.transition = '0.3s';
}

// Function ko call karte waqt 'card' object pura pass karein
function openServicePopup(card) {
    const modal = document.getElementById('reusableModal');
    const container = document.getElementById('popupLinks');
    const titleElement = document.getElementById('popupTitle');

    if (titleElement) titleElement.innerText = card.title || "Untitled Service"; 
    container.innerHTML = ''; 

    if (card.links && card.links.length > 0) {
        card.links.forEach(link => {
            const displayImage = card.imageUrl && card.imageUrl.trim() !== "" ? card.imageUrl : "default-icon.png";
            
            container.innerHTML += `
                <div class="premium-link-card">
                    <div class="card-img-wrapper">
                        <img src="${displayImage}" alt="${link.title}" class="card-img">
                    </div>
                    <div class="card-content">
                        <p class="card-desc">${link.desc || 'Explore this service'}</p>
                    </div>
                    <div class="cc-link-row">
                        <a href="${link.url}" target="_blank" class="btn-update">
                           ${link.title}
                        </a>
                        <button type="button" class="copy-link-btn" title="Copy link" onclick="ccCopyLink('${(link.url || '').replace(/'/g, "\\'")}', this)">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                </div>
            `;
        });
    } else {
        container.innerHTML = '<p class="no-data">No services available.</p>';
    }

    // Popup khulte hi sidebar aur main-content par blur class add hogi (popup par nahi)
    document.querySelector('.sidebar')?.classList.add('blurred');
    document.querySelector('.main-content')?.classList.add('blurred');

    modal.style.display = 'flex';
}

document.addEventListener('DOMContentLoaded', () => {
    // 1. Close Button ko select karein
    const closeBtn = document.getElementById('closeModalBtn');
    const modal = document.getElementById('reusableModal');

    // 2. Button click hone par modal hide karein
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.style.display = 'none';
            // Modal band hone par blur hata diya jayega
            document.querySelector('.sidebar')?.classList.remove('blurred');
            document.querySelector('.main-content')?.classList.remove('blurred');
        });
    }
});

// Toggle Floating Menu
function toggleSupremeFab(event) {
    if (event) event.stopPropagation();
    const wrapper = document.getElementById('supremeFabWrapper');
    wrapper.classList.toggle('active');
}

// Close Floating Menu
function closeSupremeFab() {
    const wrapper = document.getElementById('supremeFabWrapper');
    if (wrapper) wrapper.classList.remove('active');
}

// Auto-close when clicking anywhere outside the FAB wrapper
window.addEventListener('click', function(e) {
    const wrapper = document.getElementById('supremeFabWrapper');
    if (wrapper && !wrapper.contains(e.target)) {
        wrapper.classList.remove('active');
    }
});

// Modal Control Functions
function openSupremeHubModal() {
    document.getElementById('supremeHubModal').style.display = 'flex';
}

function closeSupremeHubModal() {
    document.getElementById('supremeHubModal').style.display = 'none';
}

// Tab Switching Logic
function switchHubTab(evt, tabId) {
    let panes = document.getElementsByClassName('hub-tab-pane');
    for (let pane of panes) { pane.classList.remove('active'); }

    let buttons = document.getElementsByClassName('hub-tab-btn');
    for (let btn of buttons) { btn.classList.remove('active'); }

    document.getElementById(tabId).classList.add('active');
    evt.currentTarget.classList.add('active');
}

// 1. Age Calculator Logic
function calculateHubAge() {
    const val = document.getElementById('hubDobInput').value;
    const res = document.getElementById('hubAgeResult');
    if (!val) { res.style.display='block'; res.innerHTML='Kripya Date of Birth chunein!'; return; }

    const dob = new Date(val);
    const today = new Date();
    if (dob > today) { res.style.display='block'; res.innerHTML='Future date select nahi ho sakti!'; return; }

    let years = today.getFullYear() - dob.getFullYear();
    let months = today.getMonth() - dob.getMonth();
    let days = today.getDate() - dob.getDate();

    if (days < 0) {
        months--;
        let pMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        days += pMonth.getDate();
    }
    if (months < 0) {
        years--;
        months += 12;
    }

    let status = years < 18 ? '<span style="color:#fbbf24; font-weight:700;">Minor (Under 18)</span>' : '<span style="color:#34d399; font-weight:700;">Adult (18+)</span>';

    res.style.display = 'block';
    res.innerHTML = `🎂 <b>${years} Years, ${months} Months, ${days} Days</b><br>Status: ${status}`;
}

// 2. Marks to Percentage Logic
function calculateHubMarks() {
    let obt = parseFloat(document.getElementById('hubObtained').value);
    let tot = parseFloat(document.getElementById('hubTotal').value);
    let res = document.getElementById('hubMarksResult');

    if (isNaN(obt) || isNaN(tot) || tot <= 0) {
        res.style.display='block'; res.innerHTML='Kripya sahi ank darj karein!'; return;
    }
    let p = (obt / tot) * 100;
    res.style.display='block';
    res.innerHTML = `📊 Percentage: <b>${p.toFixed(2)}%</b>`;
}

// 3. Percentage to CGPA Logic
function calculateHubPerToCgpa() {
    let per = parseFloat(document.getElementById('hubPerInput').value);
    let res = document.getElementById('hubPerToCgpaResult');

    if (isNaN(per) || per < 0 || per > 100) {
        res.style.display='block'; res.innerHTML='Sahi percentage dalein (0-100)!'; return;
    }
    let cgpa = per / 9.5;
    res.style.display='block';
    res.innerHTML = `🎓 Estimated CGPA: <b>${cgpa.toFixed(2)}</b>`;
}

// 4. CGPA to Percentage Logic
function calculateHubCgpaToPer() {
    let cgpa = parseFloat(document.getElementById('hubCgpaInput').value);
    let res = document.getElementById('hubCgpaToPerResult');

    if (isNaN(cgpa) || cgpa < 0 || cgpa > 10) {
        res.style.display='block'; res.innerHTML='Sahi CGPA dalein (0-10)!'; return;
    }
    let per = (cgpa - 0.75) * 10;
    res.style.display='block';
    res.innerHTML = `📈 Percentage: <b>${per.toFixed(2)}%</b>`;
}

// 5. Calculator Logic
function hubAppend(val) { document.getElementById('hubCalcScreen').value += val; }
function hubClear() { document.getElementById('hubCalcScreen').value = ''; }
function hubCalculate() {
    let scr = document.getElementById('hubCalcScreen');
    try { scr.value = eval(scr.value); } catch(e) { scr.value = 'Error'; setTimeout(hubClear, 1200); }
}

function closeModal() { document.getElementById('calcModal').style.display = 'none'; }

function togglePremiumDropdown(id, event) {
    event.stopPropagation(); // Click event ko bubble hone se roke
    const dropdown = document.getElementById(id);
    dropdown.classList.toggle('show');
}

// Bahaar click karne par dropdown band ho jaye
window.onclick = function(event) {
    if (!event.target.matches('.dropdown-trigger')) {
        const dropdowns = document.getElementsByClassName("dropdown-content");
        for (let i = 0; i < dropdowns.length; i++) {
            dropdowns[i].classList.remove('show');
        }
    }
}

// Sidebar ke bahar click karne par close ho jaye
document.addEventListener('click', function(event) {
    const sidebar = document.querySelector('.sidebar');
    const menuBtn = document.querySelector('.menu-toggler');
    
    if (sidebar && menuBtn) {
        if (!sidebar.contains(event.target) && !menuBtn.contains(event.target)) {
            sidebar.classList.remove('active');
        }
    }
});

const menuToggler = document.querySelector('.menu-toggler');
if (menuToggler) {
    menuToggler.addEventListener('click', () => {
        document.querySelector('.sidebar')?.classList.add('active');
    });
}

const sidebarCloseBtn = document.querySelector('.sidebar-close-btn');
if (sidebarCloseBtn) {
    sidebarCloseBtn.addEventListener('click', () => {
        document.querySelector('.sidebar')?.classList.remove('active');
    });
}

// 1. DESKTOP REFRESH (Ctrl + F)
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === 'f') {
        e.preventDefault(); 
        window.location.reload();
    }
});

// (pull-to-refresh lives in the MOBILE APP-FEEL section at the end of this file)


// ==========================================
// 2. RECENT USED PORTALS LOGIC (LocalStorage)
// ==========================================
const RECENT_STORAGE_KEY = 'digital_saathi_recent_portals';
const MAX_RECENT_ITEMS = 3;

function getRecentPortals() {
    try {
        return JSON.parse(localStorage.getItem(RECENT_STORAGE_KEY)) || [];
    } catch (e) {
        return [];
    }
}

function addRecentPortal(cardData) {
    ccBumpToday();
    let recent = getRecentPortals();
    
    recent = recent.filter(item => (item.title || item.name) !== (cardData.title || cardData.name));
    
    recent.unshift({
        title: cardData.title || cardData.name,
        desc: cardData.desc || cardData.description || '',
        icon: cardData.icon || 'fas fa-link',
        color: cardData.color || '#4f46e5',
        url: cardData.url || '#',
        links: cardData.links || []
    });
    
    if (recent.length > MAX_RECENT_ITEMS) {
        recent = recent.slice(0, MAX_RECENT_ITEMS);
    }
    
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(recent));
    renderRecentPortals();
}

function renderRecentPortals() {
    const wrapper = document.getElementById('recentSectionWrapper');
    const grid = document.getElementById('recentPortalsGrid');
    if (!wrapper || !grid) return;

    const recent = getRecentPortals();
    if (recent.length === 0) {
        wrapper.style.display = 'none';
        return;
    }

    wrapper.style.display = 'block';
    grid.innerHTML = '';

    recent.forEach(card => {
        const anchor = document.createElement('div');
        anchor.className = `service-card-block`;
        anchor.style.cursor = "pointer";
        anchor.style.setProperty('--card-accent', card.color || '#10b981');
        anchor.style.setProperty('--card-glow', (card.color || '#10b981') + '40');

        if (card.links && Array.isArray(card.links) && card.links.length > 0) {
            anchor.onclick = () => {
                addRecentPortal(card);
                openServicePopup(card);
            };
        } else {
            anchor.onclick = () => {
                addRecentPortal(card);
                window.open(card.url || '#', '_blank');
            };
        }

        anchor.innerHTML = `
            <div class="square-icon-box" style="background-color: ${card.color || '#10b981'};">
                <i class="${card.icon}"></i>
            </div>
            <div class="service-meta-text">
                <h4>${card.title}</h4>
                <p>${card.desc}</p>
            </div>
        `;
        grid.appendChild(anchor);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    renderRecentPortals();
    renderFavoritesPortals();
    ccInitTheme();
});

// ==========================================
// 8b. FAVORITES (pin your most-used portals)
// ==========================================
const FAVORITES_STORAGE_KEY = 'cc_favorites';

function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem(FAVORITES_STORAGE_KEY)) || [];
    } catch (e) {
        return [];
    }
}

function isFavorite(card) {
    const key = card.title || card.name;
    return getFavorites().some(item => item.title === key);
}

function toggleFavorite(card, btnEl) {
    const key = card.title || card.name;
    let favs = getFavorites();
    const exists = favs.some(item => item.title === key);

    if (exists) {
        favs = favs.filter(item => item.title !== key);
        showToast('Favorites se hata diya', 'info');
    } else {
        favs.unshift({
            title: key,
            desc: card.desc || card.description || '',
            icon: card.icon || 'fas fa-link',
            color: card.color || '#9B00D2',
            url: card.url || '#',
            links: card.links || []
        });
        showToast('Favorites me pin kar diya!', 'success');
    }

    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favs));

    if (btnEl) {
        btnEl.classList.toggle('is-fav', !exists);
        btnEl.querySelector('i').className = (!exists ? 'fas' : 'far') + ' fa-star';
    }
    renderFavoritesPortals();
}

function renderFavoritesPortals() {
    const wrapper = document.getElementById('favoritesSectionWrapper');
    const grid = document.getElementById('favoritesPortalsGrid');
    if (!wrapper || !grid) return;

    const favs = getFavorites();
    if (favs.length === 0) {
        wrapper.style.display = 'none';
        return;
    }

    wrapper.style.display = 'block';
    grid.innerHTML = '';

    favs.forEach(card => {
        const anchor = document.createElement('div');
        anchor.className = 'service-card-block';
        anchor.style.cursor = 'pointer';
        anchor.style.setProperty('--card-accent', card.color || '#9B00D2');
        anchor.style.setProperty('--card-glow', (card.color || '#9B00D2') + '40');

        if (card.links && Array.isArray(card.links) && card.links.length > 0) {
            anchor.onclick = () => openServicePopup(card);
        } else {
            anchor.onclick = () => window.open(card.url || '#', '_blank');
        }

        anchor.innerHTML = `
            <div class="square-icon-box" style="background-color: ${card.color || '#9B00D2'};">
                <i class="${card.icon}"></i>
            </div>
            <div class="service-meta-text">
                <h4>${card.title}</h4>
                <p>${card.desc}</p>
            </div>
        `;
        grid.appendChild(anchor);
    });
}

// ==========================================
// 8c. TOAST NOTIFICATIONS
// ==========================================
function showToast(message, type) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const icons = { success: 'fas fa-circle-check', info: 'fas fa-circle-info', error: 'fas fa-circle-exclamation' };
    const toast = document.createElement('div');
    ccPlaySound(type === 'success' ? 'success' : type === 'error' ? 'error' : 'info');
    toast.className = `cc-toast ${type || 'info'}`;
    toast.innerHTML = `<i class="${icons[type] || icons.info}"></i><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('cc-toast-out');
        setTimeout(() => toast.remove(), 250);
    }, 2200);
}

// ==========================================
// 8d. COPY LINK (service popup ke andar)
// ==========================================
function ccCopyLink(url, btnEl) {
    if (!url) return;

    const onCopied = () => {
        showToast('Link copy ho gaya!', 'success');
        if (btnEl) {
            const icon = btnEl.querySelector('i');
            icon.className = 'fas fa-check';
            setTimeout(() => { icon.className = 'fas fa-copy'; }, 1200);
        }
    };
    const onFailed = () => showToast('Copy nahi ho paaya, manually try karein', 'error');

    // Modern Clipboard API needs a secure context (https/localhost) — plain
    // http cafe setups fall back to the legacy execCommand approach below.
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(onCopied).catch(() => ccLegacyCopy(url, onCopied, onFailed));
    } else {
        ccLegacyCopy(url, onCopied, onFailed);
    }
}

function ccLegacyCopy(text, onCopied, onFailed) {
    try {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        const ok = document.execCommand('copy');
        document.body.removeChild(ta);
        ok ? onCopied() : onFailed();
    } catch (e) {
        onFailed();
    }
}

// ==========================================
// 8e. DARK / LIGHT THEME TOGGLE
// ==========================================
const THEME_STORAGE_KEY = 'cc_theme';

function ccInitTheme() {
    const tc = document.getElementById('ccThemeColor');
    if (tc) tc.setAttribute('content', document.documentElement.getAttribute('data-cc-theme') === 'dark' ? '#1E1E32' : '#FFFFFF');
    const btn = document.getElementById('themeToggleBtn');
    if (!btn) return;
    const isDark = document.documentElement.getAttribute('data-cc-theme') === 'dark';
    btn.querySelector('i').className = isDark ? 'fas fa-sun' : 'fas fa-moon';
}

function ccToggleTheme() {
    ccPlaySound('toggle');
    const isDark = document.documentElement.getAttribute('data-cc-theme') === 'dark';
    if (isDark) {
        document.documentElement.removeAttribute('data-cc-theme');
        localStorage.setItem(THEME_STORAGE_KEY, 'light');
    } else {
        document.documentElement.setAttribute('data-cc-theme', 'dark');
        localStorage.setItem(THEME_STORAGE_KEY, 'dark');
    }
    ccInitTheme();
}

// ==========================================
// 8f2. IDLE AUTO-LOCK (privacy on shared cyber-cafe screens)
// ==========================================
const IDLE_LOCK_MINUTES = 3; // no activity for this long -> screen locks
let ccIdleTimer = null;

function ccResetIdleTimer() {
    const overlay = document.getElementById('ccLockOverlay');
    if (overlay && overlay.classList.contains('active')) return; // already locked, ignore
    clearTimeout(ccIdleTimer);
    ccIdleTimer = setTimeout(ccShowLockScreen, IDLE_LOCK_MINUTES * 60 * 1000);
}

function ccShowLockScreen() {
    const overlay = document.getElementById('ccLockOverlay');
    if (!overlay || !auth.currentUser) return;
    const user = auth.currentUser;

    const nameEl = document.getElementById('ccLockUserName');
    if (nameEl) nameEl.innerText = user.displayName || (user.email ? user.email.split('@')[0] : 'Operator');
    const avatarEl = document.getElementById('ccLockAvatar');
    if (avatarEl) avatarEl.src = user.photoURL || 'Web_Icon.png';

    overlay.classList.add('active');
    ccPlaySound('lock');
}

document.getElementById('ccUnlockForm')?.addEventListener('submit', function (e) {
    e.preventDefault();
    const errBox = document.getElementById('ccUnlockError');
    const btn = document.getElementById('ccUnlockBtn');
    const pwdInput = document.getElementById('ccUnlockPassword');
    errBox.classList.remove('show');
    errBox.textContent = '';

    const user = auth.currentUser;
    if (!user || !user.email) return;

    btn.disabled = true;
    btn.textContent = 'Checking...';

    const cred = firebase.auth.EmailAuthProvider.credential(user.email, pwdInput.value);
    user.reauthenticateWithCredential(cred).then(function () {
        document.getElementById('ccLockOverlay').classList.remove('active');
        pwdInput.value = '';
        btn.disabled = false;
        btn.textContent = 'Unlock';
        ccResetIdleTimer();
    }).catch(function () {
        errBox.textContent = 'Password galat hai — dobara try karein.';
        errBox.classList.add('show');
        btn.disabled = false;
        btn.textContent = 'Unlock';
    });
});

// Any user activity resets the idle timer
['mousemove', 'keydown', 'click', 'touchstart', 'scroll'].forEach(function (evt) {
    document.addEventListener(evt, ccResetIdleTimer, { passive: true });
});
ccResetIdleTimer();

// ==========================================
// 9. SOFT SOUND ENGINE (gentle, low-volume, on/off toggle)
// ==========================================
let audioCtx = null;
const SOUND_KEY = 'cc_sound';
function ccSoundOn() { return localStorage.getItem(SOUND_KEY) !== 'off'; }

function ccTone(freq, start, dur, vol, type, endFreq) {
    const t0 = audioCtx.currentTime + start;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2600;
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + dur);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(vol, t0 + 0.006);      // soft attack, no harsh click
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);     // smooth fade-out
    osc.connect(filter); filter.connect(gain); gain.connect(audioCtx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
}

function ccPlaySound(kind) {
    if (!ccSoundOn()) return;
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        switch (kind) {
            case 'success': ccTone(660, 0, 0.14, 0.05); ccTone(880, 0.08, 0.2, 0.045); break;       // soft rising chime
            case 'error':   ccTone(300, 0, 0.16, 0.05, 'sine', 240); break;                          // gentle low blip
            case 'info':    ccTone(740, 0, 0.12, 0.04); break;
            case 'toggle':  ccTone(520, 0, 0.08, 0.04); ccTone(780, 0.05, 0.1, 0.035); break;
            case 'open':    ccTone(480, 0, 0.12, 0.035, 'sine', 640); break;
            case 'lock':    ccTone(620, 0, 0.12, 0.045); ccTone(420, 0.08, 0.2, 0.04); break;
            default:        ccTone(900, 0, 0.055, 0.035, 'sine', 700);                              // soft "tick" tap
        }
    } catch (e) { /* audio blocked — ignore */ }
}
function playClickSound() { ccPlaySound('tap'); } // backward-compat

function ccUpdateSoundIcon() {
    const b = document.getElementById('soundToggleBtn');
    if (b) b.querySelector('i').className = ccSoundOn() ? 'fas fa-volume-high' : 'fas fa-volume-xmark';
}
function ccToggleSound() {
    localStorage.setItem(SOUND_KEY, ccSoundOn() ? 'off' : 'on');
    ccUpdateSoundIcon();
    if (ccSoundOn()) ccPlaySound('toggle');
    showToast(ccSoundOn() ? 'Sound on' : 'Sound off', 'info');
}

document.addEventListener('pointerdown', (e) => {
    if (e.target.closest('#soundToggleBtn')) return; // toggle makes its own sound
    const target = e.target.closest('a, button, .service-card-block, .tab-item, .hub-tab-btn, .h-btn, .submenu-link-toggle');
    if (target) ccPlaySound('tap');
});

// ==========================================
// 9b. NEW PREMIUM FEATURES
// ==========================================
// --- Fullscreen ---
function ccToggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
}
document.addEventListener('fullscreenchange', () => {
    const b = document.getElementById('fullscreenBtn');
    if (b) b.querySelector('i').className = document.fullscreenElement ? 'fas fa-compress' : 'fas fa-expand';
});

// --- Quick Notes (auto-saved) ---
const NOTES_KEY = 'cc_quick_notes';
let ccNotesTimer = null;
function ccOpenNotes() {
    const area = document.getElementById('ccNotesArea');
    area.value = localStorage.getItem(NOTES_KEY) || '';
    document.getElementById('ccNotesPanel').classList.add('active');
    ccPlaySound('open');
    if (!(window.matchMedia('(max-width: 900px)').matches)) setTimeout(() => area.focus(), 250); // phone: don't pop the keyboard automatically
}
function ccCloseNotes() { document.getElementById('ccNotesPanel').classList.remove('active'); }
function ccClearNotes() {
    if (!document.getElementById('ccNotesArea').value) return;
    if (!confirm('Saare notes delete karein?')) return;
    document.getElementById('ccNotesArea').value = '';
    localStorage.removeItem(NOTES_KEY);
    showToast('Notes clear ho gaye', 'info');
}
function ccCopyNotes() {
    const v = document.getElementById('ccNotesArea').value;
    if (!v) return;
    ccCopyLink(v, null);
}
document.getElementById('ccNotesArea')?.addEventListener('input', function () {
    const st = document.getElementById('ccNotesStatus');
    st.innerHTML = '<i class="fas fa-pen"></i> Saving...';
    clearTimeout(ccNotesTimer);
    ccNotesTimer = setTimeout(() => {
        localStorage.setItem(NOTES_KEY, this.value);
        st.innerHTML = '<i class="fas fa-check"></i> Saved';
    }, 400);
});

// --- Shortcuts modal ---
function ccOpenShortcuts() { document.getElementById('ccShortcutsModal').classList.add('active'); ccPlaySound('open'); }
function ccCloseShortcuts() { document.getElementById('ccShortcutsModal').classList.remove('active'); }

// --- Single-key shortcuts (ignored while typing) ---
document.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const tag = (e.target.tagName || '').toLowerCase();
    const typing = tag === 'input' || tag === 'textarea' || e.target.isContentEditable;
    if (e.key === 'Escape') { ccCloseNotes(); ccCloseShortcuts(); return; }
    if (typing) return;
    const k = e.key.toLowerCase();
    if (e.key === '/') { e.preventDefault(); document.getElementById('toolSearchField')?.focus(); }
    else if (e.key === '?') ccOpenShortcuts();
    else if (k === 'n') { e.preventDefault(); ccOpenNotes(); }
    else if (k === 'd') ccToggleTheme();
    else if (k === 'm') ccToggleSound();
    else if (k === 'f') ccToggleFullscreen();
});

// --- Online / offline awareness ---
function ccNetState() {
    const bar = document.getElementById('ccOfflineBar');
    if (bar) bar.classList.toggle('show', !navigator.onLine);
}
window.addEventListener('offline', () => { ccNetState(); ccPlaySound('error'); });
window.addEventListener('online', () => { ccNetState(); showToast('Internet wapas aa gaya', 'success'); });

// --- Today's activity counter ---
function ccTodayData() {
    const today = new Date().toDateString();
    try {
        const d = JSON.parse(localStorage.getItem('cc_today'));
        if (d && d.date === today) return d;
    } catch (e) {}
    return { date: today, count: 0 };
}
function ccBumpToday() {
    const d = ccTodayData();
    d.count += 1;
    localStorage.setItem('cc_today', JSON.stringify(d));
    ccRenderToday();
}
function ccRenderToday() {
    const el = document.getElementById('ccTodayCount');
    if (el) ccAnimateNumber(el, ccTodayData().count);
}

document.addEventListener('DOMContentLoaded', () => {
    ccUpdateSoundIcon();
    ccNetState();
    ccRenderToday();
});

// ==========================================
// BLOCK 1: CTRL + K COMMAND PALETTE LOGIC
// ==========================================
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        openCommandPalette();
    }
    if (e.key === 'Escape') {
        closeCommandPalette();
    }
});

function openCommandPalette() {
    const modal = document.getElementById('commandPaletteModal');
    const input = document.getElementById('cmdSearchInput');
    if (modal && input) {
        modal.style.display = 'flex';
        input.value = '';
        input.focus();
        renderCmdResults('');
    }
}

function closeCommandPalette() {
    const modal = document.getElementById('commandPaletteModal');
    if (modal) modal.style.display = 'none';
}

document.getElementById('cmdSearchInput')?.addEventListener('input', function() {
    renderCmdResults(this.value.toLowerCase().trim());
});

function renderCmdResults(query) {
    const list = document.getElementById('cmdResultsList');
    if (!list) return;
    list.innerHTML = '';

    const allCards = document.querySelectorAll('.tool-card-item');
    let matches = [];

    allCards.forEach(card => {
        const title = card.querySelector('h4')?.innerText || '';
        const desc = card.querySelector('p')?.innerText || '';
        const iconClass = card.querySelector('.square-icon-box i')?.className || 'fas fa-link';
        
        if (query === '' || title.toLowerCase().includes(query) || desc.toLowerCase().includes(query)) {
            matches.push({ title, desc, icon: iconClass, element: card });
        }
    });

    if (matches.length === 0) {
        list.innerHTML = '<div style="padding: 20px; text-align: center; color: #64748b; font-size: 13px;">No matching portals found!</div>';
        return;
    }

    matches.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = `cmd-result-item ${index === 0 ? 'selected' : ''}`;
        div.innerHTML = `
            <i class="${item.icon}"></i>
            <div style="display:flex; flex-direction:column;">
                <span style="font-weight: 600; font-size: 13px;">${item.title}</span>
                <span style="font-size: 11px; color: #64748b;">${item.desc}</span>
            </div>
        `;
        div.onclick = () => {
            closeCommandPalette();
            item.element.click();
        };
        list.appendChild(div);
    });
}

document.getElementById('commandPaletteModal')?.addEventListener('click', (e) => {
    if (e.target.id === 'commandPaletteModal') {
        closeCommandPalette();
    }
});

/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
let activeRecognition = null; // Global instance track karne ke liye

function startVoiceSearch() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        alert("Aapka browser Voice Search support nahi karta. Kripya Google Chrome use karein.");
        return;
    }

    const micBtn = document.getElementById('micSearchBtn');
    const searchInput = document.getElementById('toolSearchField');

    // Agar mic pehle se chal raha hai, toh dubara click karne par ise rok (stop) do
    if (activeRecognition) {
        activeRecognition.stop();
        resetVoiceState();
        return;
    }

    const recognition = new SpeechRecognition();
    activeRecognition = recognition;
    
   recognition.lang = 'en-IN'; // Roman script / Hinglish ke liye English (India) set karein
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = function() {
        if(micBtn) micBtn.classList.add('listening');
        if(searchInput) searchInput.placeholder = "Listening... boliye kya search karein?";
    };

    recognition.onresult = function(event) {
        const speechResult = event.results[0][0].transcript;
        if(searchInput) {
            searchInput.value = speechResult;
            searchInput.dispatchEvent(new Event('input')); // Live search filter trigger karega
        }
    };

    recognition.onerror = function(event) {
        console.error("Mic Error: ", event.error);
        resetVoiceState();
    };

    recognition.onend = function() {
        resetVoiceState();
    };

    try {
        recognition.start();
    } catch (error) {
        console.error("Mic start error", error);
        resetVoiceState();
    }
}

function resetVoiceState() {
    activeRecognition = null;
    const micBtn = document.getElementById('micSearchBtn');
    const searchInput = document.getElementById('toolSearchField');
    if(micBtn) micBtn.classList.remove('listening');
    if(searchInput) searchInput.placeholder = "Search portals...";
}



///////////////////////////////////
document.addEventListener("DOMContentLoaded", function() {
    const searchInput = document.getElementById('toolSearchField');
    const recentBar = document.getElementById('recentSectionWrapper'); 

    if (searchInput && recentBar) {
        
        // 1. Jab search box par click (focus) ho
        searchInput.addEventListener('focus', function() {
            recentBar.style.transition = 'opacity 0.3s ease, visibility 0.3s ease';
            recentBar.style.opacity = '0';
            recentBar.style.visibility = 'hidden';
            setTimeout(() => {
                if (document.activeElement === searchInput) {
                    recentBar.style.display = 'none';
                }
            }, 300);
        });

        // 2. Jab search box se focus hate (blur)
        searchInput.addEventListener('blur', function() {
            setTimeout(() => {
                if (document.activeElement !== searchInput && this.value.trim() === '') {
                    recentBar.style.display = 'block';
                    setTimeout(() => {
                        recentBar.style.opacity = '1';
                        recentBar.style.visibility = 'visible';
                    }, 10);
                }
            }, 200);
        });

        // 3. Jab user kuch type kare
        searchInput.addEventListener('input', function() {
            if (this.value.trim() !== '') {
                recentBar.style.display = 'none';
                recentBar.style.opacity = '0';
                recentBar.style.visibility = 'hidden';
            } else {
                recentBar.style.display = 'block';
                recentBar.style.opacity = '1';
                recentBar.style.visibility = 'visible';
            }
        });
    }
});


///////////////////////////////////////////////////////////
// Smart Search Filtering with Fuzzy Matching & Exact Priority
document.getElementById('toolSearchField')?.addEventListener('input', function() {
    const query = this.value.toLowerCase().trim();
    const allCards = document.querySelectorAll('.tool-card-item'); // Apne card ki class yahan check kar lein
    const recentBar = document.getElementById('recentSectionWrapper');

    // Recent bar hide/show handle karein input ke mutabiq
    if (recentBar) {
        if (query !== '') {
            recentBar.style.display = 'none';
            recentBar.style.opacity = '0';
            recentBar.style.visibility = 'hidden';
        } else {
            recentBar.style.display = 'block';
            recentBar.style.opacity = '1';
            recentBar.style.visibility = 'visible';
        }
    }

    if (query === '') {
        allCards.forEach(card => card.style.display = '');
        return;
    }

    // Query ko words mein tod lein (jaise "e kyc" ko ["e", "kyc"])
    const queryWords = query.split(/\s+/);

    allCards.forEach(card => {
        const title = card.querySelector('h4')?.innerText.toLowerCase() || '';
        const desc = card.querySelector('p')?.innerText.toLowerCase() || '';
        const cardText = title + ' ' + desc;

        let matchScore = 0;

        // 1. Agar exact query match ho jaye toh highest score do
        if (cardText.includes(query)) {
            matchScore += 10;
        }

        // 2. Fuzzy / Partial match check (agar spelling thodi galat ya aage-piche ho)
        let matchedWordsCount = 0;
        queryWords.forEach(word => {
            if (word.length > 1) {
                // Check karein ki word ka koi sa hissa title ya description mein milta hai kya
                if (cardText.includes(word)) {
                    matchedWordsCount++;
                } else {
                    // Agar spelling mein 1-2 letter ka fark ho (simple character matching)
                    let fuzzyMatched = false;
                    for (let i = 0; i < title.length - word.length + 1; i++) {
                        let subStr = title.substring(i, i + word.length);
                        let diff = 0;
                        for(let c = 0; c < word.length; c++) {
                            if(subStr[c] !== word[c]) diff++;
                        }
                        if(diff <= 1) { // Agar sirf 1 letter ka error/fark hai
                            fuzzyMatched = true;
                            break;
                        }
                    }
                    if(fuzzyMatched) matchedWordsCount++;
                }
            }
        });

        if (matchedWordsCount > 0 || matchScore > 0) {
            card.style.display = ''; // Show card
        } else {
            card.style.display = 'none'; // Hide card
        }
    });
});

// 3. ENTER KEY - BLUR (Bahar nikalne ke liye aur recent bar restore karne ke liye)
const searchInputField = document.getElementById('toolSearchField');
searchInputField?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        this.blur(); // Cursor search box se bahar aa jayega
    }
});

// Blur event par agar input khali ho toh recent bar wapas dikhe
searchInputField?.addEventListener('blur', function() {
    const recentBar = document.getElementById('recentSectionWrapper');
    if (recentBar && this.value.trim() === '') {
        recentBar.style.display = 'block';
        setTimeout(() => {
            recentBar.style.opacity = '1';
            recentBar.style.visibility = 'visible';
        }, 10);
    }
});

function resetSearch() {
    const input = document.getElementById('toolSearchField');
    input.value = ''; // Input box khali karein
    input.dispatchEvent(new Event('input')); // Event trigger karein taaki cards aur recent bar wapas aa jayein
}


// ==========================================
// 10. MOBILE: drawer menu, swipe gestures, no-collapse on phones
// ==========================================
const ccIsMobile = () => window.matchMedia('(max-width: 900px)').matches;

function ccOpenMobileMenu() {
    const sb = document.getElementById('ccSidebar');
    sb.classList.remove('collapsed');
    sb.classList.add('active');
    document.getElementById('ccSidebarBackdrop').classList.add('show');
    document.body.classList.add('cc-no-scroll');
    ccPlaySound('open');
}
function ccCloseMobileMenu() {
    document.getElementById('ccSidebar')?.classList.remove('active');
    document.getElementById('ccSidebarBackdrop')?.classList.remove('show');
    document.body.classList.remove('cc-no-scroll');
}

// phones never use the slim icon-rail; keep the drawer full width
(function () {
    const orig = window.ccApplySidebarState;
    window.ccApplySidebarState = function (collapsed) { return orig(ccIsMobile() ? false : collapsed); };
})();
window.addEventListener('resize', () => { if (!ccIsMobile()) ccCloseMobileMenu(); });

// auto-close the drawer after choosing something
document.getElementById('masterLiveSidebarMenu')?.addEventListener('click', (e) => {
    if (!ccIsMobile()) return;
    if (e.target.closest('.submenu-link-toggle') || e.target.closest('.nested-submenu-link')) setTimeout(ccCloseMobileMenu, 220);
});
document.querySelectorAll('.cc-quick-pill').forEach(p => p.addEventListener('click', () => { if (ccIsMobile()) setTimeout(ccCloseMobileMenu, 200); }));
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') ccCloseMobileMenu(); });

// swipe: edge-swipe right opens, swipe left closes
(function () {
    let sx = 0, sy = 0, tracking = false;
    document.addEventListener('touchstart', (e) => {
        if (!ccIsMobile()) return;
        const t = e.touches[0]; sx = t.clientX; sy = t.clientY;
        tracking = sx < 24 || document.getElementById('ccSidebar').classList.contains('active');
    }, { passive: true });
    document.addEventListener('touchend', (e) => {
        if (!tracking) return;
        const t = e.changedTouches[0], dx = t.clientX - sx, dy = Math.abs(t.clientY - sy);
        tracking = false;
        if (dy > 60) return;
        const open = document.getElementById('ccSidebar').classList.contains('active');
        if (!open && dx > 70) ccOpenMobileMenu();
        else if (open && dx < -70) ccCloseMobileMenu();
    }, { passive: true });
})();


// ==========================================
// 11. MOBILE APP-FEEL: bottom nav, haptics, collapsing header, sheets, PTR, install
// ==========================================
function ccHaptic(ms) {
    if (ccIsMobile() && ccSoundOn() && navigator.vibrate) navigator.vibrate(ms || 8);
}

// ---- bottom navigation ----
let ccNavBase = 'home';
function ccSetNav(key) {
    document.querySelectorAll('.cc-bn-item').forEach(b => b.classList.toggle('active', b.dataset.nav === key));
}
function ccNavGo(key) {
    ccHaptic(8);
    const notesOpen = document.getElementById('ccNotesPanel').classList.contains('active');
    const menuOpen = document.getElementById('ccSidebar').classList.contains('active');
    if (key !== 'notes' && notesOpen) ccCloseNotes();
    if (key !== 'menu' && menuOpen) ccCloseMobileMenu();
    if (key === 'home') {
        ccQuickView('all');
        document.querySelector('.app-canvas')?.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (key === 'fav') {
        ccQuickView('fav');
        document.querySelector('.app-canvas')?.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (key === 'tools') {
        openSupremeHubModal();
    } else if (key === 'notes') {
        notesOpen ? ccCloseNotes() : ccOpenNotes();
    } else if (key === 'menu') {
        menuOpen ? ccCloseMobileMenu() : ccOpenMobileMenu();
    }
}
// keep the highlighted tab honest by wrapping existing actions
(function () {
    const wrap = (name, after) => { const o = window[name]; window[name] = function () { const r = o.apply(this, arguments); after.apply(this, arguments); return r; }; };
    wrap('ccClearFilter', () => { ccNavBase = 'home'; ccSetNav('home'); });
    wrap('ccQuickView', (w) => { if (w === 'fav') { ccNavBase = 'fav'; ccSetNav('fav'); } });
    wrap('ccOpenNotes', () => ccSetNav('notes'));
    wrap('ccCloseNotes', () => ccSetNav(ccNavBase));
    wrap('ccOpenMobileMenu', () => ccSetNav('menu'));
    wrap('ccCloseMobileMenu', () => ccSetNav(ccNavBase));
})();

// hide the floating nav while the keyboard is up
document.addEventListener('focusin', (e) => { if (ccIsMobile() && e.target.matches('input, textarea')) document.body.classList.add('cc-kb'); });
document.addEventListener('focusout', () => document.body.classList.remove('cc-kb'));

// ---- collapsing header (search + tabs tuck away while scrolling down) ----
(function () {
    const canvas = document.querySelector('.app-canvas'), nav = document.querySelector('.top-navbar');
    if (!canvas || !nav) return;
    let last = 0;
    canvas.addEventListener('scroll', () => {
        if (!ccIsMobile()) { nav.classList.remove('nav-compact'); return; }
        const y = canvas.scrollTop;
        if (y > 90 && y > last + 6) nav.classList.add('nav-compact');
        else if (y < last - 6 || y < 30) nav.classList.remove('nav-compact');
        last = y;
    }, { passive: true });
})();

// ---- proper pull-to-refresh (works with the inner scroll area, ignores sheets/drawer) ----
(function () {
    const canvas = document.querySelector('.app-canvas'), ind = document.getElementById('ptr-indicator');
    if (!canvas || !ind) return;
    const TRIGGER = 70, MAX = 110;
    let startY = 0, dist = 0, pulling = false, armed = false;
    const blocked = () => document.body.classList.contains('cc-no-scroll')
        || document.querySelector('.cc-side-panel.active')
        || [...document.querySelectorAll('.modal,.premium-modal,.hub-modal-overlay,.cmd-modal-overlay,.cc-lite-overlay,.cc-lock-overlay')].some(m => getComputedStyle(m).display !== 'none');
    canvas.addEventListener('touchstart', (e) => {
        if (!ccIsMobile() || canvas.scrollTop > 0 || blocked()) return;
        startY = e.touches[0].clientY; pulling = true; dist = 0; armed = false;
        ind.style.transition = 'none';
    }, { passive: true });
    canvas.addEventListener('touchmove', (e) => {
        if (!pulling) return;
        const dy = e.touches[0].clientY - startY;
        if (dy <= 0 || canvas.scrollTop > 0) { dist = 0; ind.style.transform = 'translate(-50%,0)'; return; }
        dist = Math.min(MAX, dy * 0.45);
        ind.style.transform = `translate(-50%, ${dist + 20}px) rotate(${dist * 4}deg)`;
        if (dist >= TRIGGER && !armed) { armed = true; ccHaptic(14); }
        if (dist < TRIGGER) armed = false;
    }, { passive: true });
    canvas.addEventListener('touchend', () => {
        if (!pulling) return;
        pulling = false;
        ind.style.transition = 'transform 0.3s var(--cc-ease)';
        if (dist >= TRIGGER) {
            ind.classList.add('spin');
            ind.style.transform = 'translate(-50%, 78px)';
            setTimeout(() => window.location.reload(), 650);
        } else {
            ind.style.transform = 'translate(-50%, 0)';
        }
    });
})();

// ---- swipe-down to close bottom sheets ----
(function () {
    const SHEETS = '.premium-modal-content, .hub-modal-card, .modal-content, .cc-lite-card, .cc-side-panel';
    let sheet = null, sy = 0, dy = 0;
    document.addEventListener('touchstart', (e) => {
        if (!window.matchMedia('(max-width: 640px)').matches) return;
        const s = e.target.closest(SHEETS);
        if (!s) return;
        const top = s.getBoundingClientRect().top;
        if (e.touches[0].clientY - top > 56) return; // only the handle / header zone
        sheet = s; sy = e.touches[0].clientY; dy = 0; s.style.transition = 'none';
    }, { passive: true });
    document.addEventListener('touchmove', (e) => {
        if (!sheet) return;
        dy = Math.max(0, e.touches[0].clientY - sy);
        sheet.style.transform = `translateY(${dy}px)`;
    }, { passive: true });
    document.addEventListener('touchend', () => {
        if (!sheet) return;
        const s = sheet; sheet = null;
        s.style.transition = 'transform 0.3s var(--cc-ease)';
        if (dy > 100) {
            const btn = s.querySelector('.close, .close-icon-btn, .hub-close-btn, .cc-panel-close');
            s.style.transform = 'translateY(100%)';
            setTimeout(() => { if (btn) btn.click(); s.style.transform = ''; s.style.transition = ''; }, 220);
        } else {
            s.style.transform = '';
            setTimeout(() => { s.style.transition = ''; }, 300);
        }
    });
})();

// ---- install as app ----
let ccDeferredInstall = null;
const ccIsStandalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone;
const ccIsIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    ccDeferredInstall = e;
    const b = document.getElementById('ccInstallBtn'); if (b) b.style.display = 'flex';
});
window.addEventListener('appinstalled', () => {
    const b = document.getElementById('ccInstallBtn'); if (b) b.style.display = 'none';
    showToast('App install ho gaya!', 'success');
});
document.addEventListener('DOMContentLoaded', () => {
    const b = document.getElementById('ccInstallBtn');
    if (b && ccIsIOS() && !ccIsStandalone()) b.style.display = 'flex';
});
function ccInstallApp() {
    if (ccDeferredInstall) {
        ccDeferredInstall.prompt();
        ccDeferredInstall.userChoice.finally(() => { ccDeferredInstall = null; const b = document.getElementById('ccInstallBtn'); if (b) b.style.display = 'none'; });
    } else if (ccIsIOS()) {
        showToast('Safari me Share ▸ "Add to Home Screen" dabayein', 'info');
    }
}

// ---- launch shortcuts from the installed app icon (manifest shortcuts) ----
let ccLaunchHandled = false;
function ccHandleLaunchParams() {
    if (ccLaunchHandled) return;
    ccLaunchHandled = true;
    const q = new URLSearchParams(location.search);
    if (q.get('view') === 'fav') ccQuickView('fav');
    if (q.get('open') === 'notes') setTimeout(ccOpenNotes, 300);
}


// ==========================================
// 12. HERO GREETING + SMART SEARCH (animations)
// ==========================================
function ccAnimateNumber(el, to) {
    const from = parseInt(el.dataset.v || el.textContent || '0', 10) || 0;
    el.dataset.v = to;
    if (from === to) { el.textContent = to; return; }
    const t0 = performance.now(), dur = 650;
    const step = (t) => {
        const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = Math.round(from + (to - from) * e);
        if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    el.classList.remove('cc-bump'); void el.offsetWidth; el.classList.add('cc-bump');
}

function ccRenderFavCount() {
    const el = document.getElementById('ccFavCount');
    if (el) ccAnimateNumber(el, getFavorites().length);
}
(function () {
    const orig = renderFavoritesPortals;
    renderFavoritesPortals = function () { const r = orig.apply(this, arguments); ccRenderFavCount(); return r; };
})();

function ccTimeOfDay(h) {
    if (h >= 5 && h < 11) return { key: 'morning', word: 'Suprabhat' };
    if (h >= 11 && h < 16) return { key: 'noon', word: 'Shubh Dopahar' };
    if (h >= 16 && h < 19) return { key: 'evening', word: 'Shubh Sandhya' };
    return { key: 'night', word: 'Shubh Ratri' };
}

function ccSceneSVG(key) {
    const rays = [0, 45, 90, 135, 180, 225, 270, 315].map(a => `<line x1="50" y1="14" x2="50" y2="24" transform="rotate(${a} 50 50)"/>`).join('');
    if (key === 'night') {
        return `<svg viewBox="0 0 100 100"><defs><mask id="ccMoonMask"><rect width="100" height="100" fill="#fff"/><circle cx="63" cy="40" r="19" fill="#000"/></mask>
        <linearGradient id="ccMoonG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF6D6"/><stop offset="1" stop-color="#FFC94D"/></linearGradient></defs>
        <circle cx="46" cy="54" r="24" fill="url(#ccMoonG)" mask="url(#ccMoonMask)" class="cc-moon"/>
        <path class="cc-star s1" d="M80 22l1.6 4.4 4.4 1.6-4.4 1.6L80 34l-1.6-4.4L74 28l4.4-1.6z"/>
        <path class="cc-star s2" d="M22 26l1.1 3 3 1.1-3 1.1L22 34.2l-1.1-3-3-1.1 3-1.1z"/>
        <path class="cc-star s3" d="M84 62l1.1 3 3 1.1-3 1.1L84 70.2l-1.1-3-3-1.1 3-1.1z"/></svg>`;
    }
    const cfg = {
        morning: ['#FFE08A', '#FFA94D', '#FFB84D'],
        noon: ['#FFE066', '#FF9F1C', '#FFB703'],
        evening: ['#FFB27A', '#E8590C', '#F97316']
    }[key];
    const cloud = key === 'morning'
        ? `<g class="cc-cloud"><ellipse cx="66" cy="70" rx="17" ry="9" fill="#fff" opacity=".95"/><ellipse cx="56" cy="66" rx="10" ry="8" fill="#fff" opacity=".95"/><ellipse cx="74" cy="65" rx="9" ry="7" fill="#fff" opacity=".95"/></g>` : '';
    const horizon = key === 'evening' ? `<rect x="10" y="74" width="80" height="4" rx="2" fill="${cfg[1]}" opacity=".35"/>` : '';
    const cy = key === 'evening' ? 56 : 50;
    return `<svg viewBox="0 0 100 100"><defs><radialGradient id="ccSunG" cx=".35" cy=".3" r=".9"><stop offset="0" stop-color="${cfg[0]}"/><stop offset="1" stop-color="${cfg[1]}"/></radialGradient></defs>
        <g class="cc-rays" style="transform-origin:50px ${cy}px" stroke="${cfg[2]}" stroke-width="4" stroke-linecap="round" transform="translate(0 ${cy - 50})">${rays}</g>
        <circle cx="50" cy="${cy}" r="19" fill="url(#ccSunG)" class="cc-sun"/>${horizon}${cloud}</svg>`;
}

function ccRenderHero(hourOverride) {
    const now = new Date();
    const tod = ccTimeOfDay(hourOverride != null ? hourOverride : now.getHours());
    const g = document.getElementById('ccGreetWord'); if (g) g.textContent = tod.word;
    const d = document.getElementById('ccHeroDate');
    if (d) d.textContent = now.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
    const sc = document.getElementById('ccHeroScene');
    if (sc && sc.dataset.k !== tod.key) { sc.dataset.k = tod.key; sc.innerHTML = ccSceneSVG(tod.key); }
    const hero = document.getElementById('ccHero'); if (hero) hero.dataset.tod = tod.key;
}

// "RITU YADAV" -> "Ritu Yadav" (only when the name is shouted in ALL CAPS)
function ccNiceName(el) {
    const t = (el.textContent || '').trim();
    if (t.length > 2 && t === t.toUpperCase() && /[A-Z]/.test(t)) {
        const nice = t.toLowerCase().replace(/(^|\s)([a-z])/g, (m, s, c) => s + c.toUpperCase());
        if (nice !== t) el.textContent = nice;
    }
}

function ccHeroInit() {
    ccRenderHero(); ccRenderFavCount();
    setInterval(ccRenderHero, 5 * 60 * 1000);

    const nameEl = document.querySelector('.cc-hero-name [data-cc-user-name]');
    if (nameEl) { ccNiceName(nameEl); new MutationObserver(() => ccNiceName(nameEl)).observe(nameEl, { childList: true, characterData: true, subtree: true }); }

    // rotating sub-line
    const sub = document.getElementById('ccHeroSub');
    if (sub) {
        const touch = window.matchMedia('(hover: none)').matches;
        const tips = () => {
            const n = (ccTodayData && ccTodayData().count) || 0;
            const list = ['Apne portals, tools aur billing — sab ek hi jagah se manage karein.'];
            list.push(touch ? 'Tip: card ke ⭐ se favorite pin karein — Home par turant milega.' : 'Tip: / dabakar turant search karein, Ctrl+K se sab kuch.');
            list.push(touch ? 'Tip: neeche "Tools" me calculators aur "Notes" me customer ka kaam likhein.' : 'Tip: N dabakar Quick Notes kholein, D se dark mode.');
            if (n > 0) list.push(`Aaj ${n} portal khul chuke hain — badhiya chal raha hai! 🚀`);
            return list;
        };
        let i = 0;
        setInterval(() => {
            if (document.hidden) return;
            const l = tips(); i = (i + 1) % l.length;
            sub.classList.add('out');
            setTimeout(() => { sub.textContent = l[i]; sub.classList.remove('out'); }, 300);
        }, 6500);
    }

    // soft light that follows the pointer (desktop)
    const hero = document.getElementById('ccHero');
    if (hero && window.matchMedia('(hover: hover)').matches) {
        hero.addEventListener('pointermove', (e) => {
            const r = hero.getBoundingClientRect();
            hero.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
            hero.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
        });
    }

    ccSearchInit();
}

function ccSearchInit() {
    const input = document.getElementById('toolSearchField'), wrap = document.getElementById('ccSearchWrap');
    if (!input || !wrap) return;
    const sync = () => wrap.classList.toggle('has-value', input.value.length > 0);
    input.addEventListener('input', sync);
    input.addEventListener('keydown', (e) => { if (e.key === 'Escape') { resetSearch(); input.blur(); } });
    // clicking anywhere on the bar focuses the input
    wrap.addEventListener('pointerdown', (e) => { if (!e.target.closest('button') && e.target !== input) { e.preventDefault(); input.focus(); } });

    // rotating placeholder using real portal names
    const base = 'Search portals...';
    let idx = -1;
    setInterval(() => {
        const mic = document.getElementById('micSearchBtn');
        if (document.hidden || document.activeElement === input || input.value || (mic && mic.classList.contains('listening'))) return;
        const titles = [...document.querySelectorAll('.services-grid-container .tool-card-item h4')].map(h => h.textContent.trim()).filter(Boolean);
        if (!titles.length) return;
        idx = (idx + 1) % (titles.length + 1);
        input.classList.add('ph-out');
        setTimeout(() => { input.placeholder = idx === titles.length ? base : `Try: ${titles[idx]}`; input.classList.remove('ph-out'); }, 200);
    }, 3200);
}
document.addEventListener('DOMContentLoaded', ccHeroInit);


// phone: header tucks away while scrolling -> this button brings search back
function ccJumpToSearch() {
    const canvas = document.querySelector('.app-canvas');
    canvas && canvas.scrollTo({ top: 0, behavior: 'smooth' });
    document.querySelector('.top-navbar')?.classList.remove('nav-compact');
    setTimeout(() => document.getElementById('toolSearchField')?.focus(), 380);
}
