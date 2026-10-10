/* ===========================================================
   CLICK & CONNECT — Profile "App Feel" controller
   1. Entrance: splash hat'te hi body.cc-ready (animations start)
   2. Swipe left/right se tab change + slide direction
   3. Haptic tick on taps (jahan phone support kare)
   4. Hero numbers ka count-up
   5. Browser bar colour (theme-color) theme ke saath
   6. Back button par smooth exit (agar browser view-transition na de)
   user-profile.js ke andar nahi ghusta — sirf DOM events/observers.
   =========================================================== */
(function () {
    "use strict";
    var $ = function (id) { return document.getElementById(id); };
    var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* ---------- 1. Entrance ---------- */
    var readyDone = false;
    function ready() {
        if (readyDone) return;
        readyDone = true;
        document.body.classList.add("cc-ready", "cc-first");
        setTimeout(function () { document.body.classList.remove("cc-first"); }, 2200);
    }
    var splash = $("ccSplash");
    if (!splash || splash.classList.contains("hide")) {
        ready();
    } else {
        var mo = new MutationObserver(function () {
            if (splash.classList.contains("hide")) { mo.disconnect(); ready(); }
        });
        mo.observe(splash, { attributes: true, attributeFilter: ["class"] });
        setTimeout(ready, 3000); // fail-safe
    }

    /* ---------- 2. Tabs: direction + swipe ---------- */
    var tabKeys = ["tabProfile", "tabSecurity", "tabWorkspace", "tabPreferences"];
    function activeTab() {
        for (var i = 0; i < tabKeys.length; i++) {
            var p = $(tabKeys[i]);
            if (p && p.classList.contains("is-active")) return i;
        }
        return 0;
    }
    var currentIdx = activeTab();

    function onTabChange() {
        var idx = activeTab();
        if (idx === currentIdx) return;
        var pane = $(tabKeys[idx]);
        if (pane) {
            var cls = idx > currentIdx ? "dir-next" : "dir-prev";
            pane.classList.remove("dir-next", "dir-prev");
            void pane.offsetWidth; // animation restart
            pane.classList.add(cls);
            pane.addEventListener("animationend", function h(e) {
                if (e.target !== pane) return;
                pane.classList.remove("dir-next", "dir-prev");
                pane.removeEventListener("animationend", h);
            });
        }
        currentIdx = idx;
    }
    document.querySelectorAll("[data-tab]").forEach(function (btn) {
        // user-profile.js ka click handler pehle chalta hai (pehle register hua) — hum uske baad
        btn.addEventListener("click", function () { setTimeout(onTabChange, 0); });
    });

    function goTab(delta) {
        var next = activeTab() + delta;
        if (next < 0 || next >= tabKeys.length) return;
        var btn = document.querySelector('.cc-dock-btn[data-tab="' + tabKeys[next] + '"]') ||
                  document.querySelector('.cc-tab-item[data-tab="' + tabKeys[next] + '"]');
        if (btn) btn.click();
    }

    var stage = document.querySelector(".cc-tab-stage");
    if (stage) {
        var sx = 0, sy = 0, st = 0, tracking = false;
        stage.addEventListener("touchstart", function (e) {
            if (e.touches.length !== 1) { tracking = false; return; }
            // input / canvas / color picker / scrollable chips par swipe nahi
            if (e.target.closest("input, textarea, select, canvas, .cc-swatch-row, .cc-chip-select, .cc-qr-stage")) { tracking = false; return; }
            tracking = true; sx = e.touches[0].clientX; sy = e.touches[0].clientY; st = Date.now();
        }, { passive: true });
        stage.addEventListener("touchend", function (e) {
            if (!tracking) return;
            tracking = false;
            var t = e.changedTouches[0];
            var dx = t.clientX - sx, dy = t.clientY - sy;
            if (Date.now() - st > 600) return;
            if (Math.abs(dx) > 70 && Math.abs(dy) < 45 && Math.abs(dx) > Math.abs(dy) * 2) goTab(dx < 0 ? 1 : -1);
        }, { passive: true });
    }

    /* ---------- 3. Haptics ---------- */
    function tick(ms) { try { if (navigator.vibrate) navigator.vibrate(ms || 8); } catch (e) { /* ignore */ } }
    document.addEventListener("click", function (e) {
        if (e.target.closest(".cc-dock-btn, .cc-chip-opt, .cc-swatch, .cc-seg-btn")) tick(8);
    }, true);
    window.addEventListener("cc-profile-updated", function () { /* save success feel handled by toast */ });
    var saveBtn = $("saveProfileBtn");
    if (saveBtn) {
        new MutationObserver(function () {
            if (/Saved/.test(saveBtn.textContent)) tick([12, 40, 12]);
        }).observe(saveBtn, { childList: true, subtree: true });
    }

    /* ---------- 4. Count-up numbers ---------- */
    function countUp(el) {
        if (!el) return;
        var busy = false;
        var last = el.textContent;
        new MutationObserver(function () {
            if (busy) return;
            var txt = el.textContent;
            if (txt === last) return;
            var m = /^(\d+)(.*)$/.exec(txt.trim());
            if (!m || reduceMotion) { last = txt; return; }
            var target = parseInt(m[1], 10), suffix = m[2];
            var from = parseInt((/^(\d+)/.exec(last) || [0, 0])[1], 10) || 0;
            if (from === target) { last = txt; return; }
            busy = true;
            var t0 = performance.now(), dur = 800;
            (function step(now) {
                var p = Math.min(1, (now - t0) / dur);
                var eased = 1 - Math.pow(1 - p, 3);
                el.textContent = Math.round(from + (target - from) * eased) + suffix;
                if (p < 1) requestAnimationFrame(step);
                else { el.textContent = txt; last = txt; busy = false; }
            })(t0);
        }).observe(el, { childList: true, characterData: true, subtree: true });
    }
    countUp($("profileScoreVal"));
    countUp($("securityAuditVal"));

    /* ---------- 5. Browser bar colour ---------- */
    function syncThemeColor() {
        var meta = document.querySelector('meta[name="theme-color"]');
        if (!meta) return;
        var cs = getComputedStyle(document.body);
        var c = (cs.getPropertyValue("--cc-offwhite") || "").trim();
        if (c) meta.setAttribute("content", c);
    }
    syncThemeColor();
    window.addEventListener("cc-theme-change", function () { setTimeout(syncThemeColor, 30); });
    window.addEventListener("storage", function () { setTimeout(syncThemeColor, 30); });

    /* ---------- 6. Header shadow on scroll ---------- */
    var nav = document.querySelector(".cc-navbar");
    if (nav) {
        var ticking = false;
        window.addEventListener("scroll", function () {
            if (ticking) return;
            ticking = true;
            requestAnimationFrame(function () { nav.classList.toggle("scrolled", window.scrollY > 6); ticking = false; });
        }, { passive: true });
    }

    /* ---------- 7. Smooth exit on Back (browsers without cross-page view transitions) ---------- */
    var origBack = window.goBack;
    if (typeof origBack === "function" && !("CSSViewTransitionRule" in window) && !reduceMotion) {
        window.goBack = function () {
            document.body.classList.add("cc-leaving");
            setTimeout(origBack, 190);
        };
    }
})();
