/* ===========================================================
   CLICK & CONNECT — Universal Profile Chip Web Component
   Usage: <script src="profile-avtor.js"></script>
          <user-profile-chip></user-profile-chip>

   Ye chip jis bhi page par hai, wahan:
     • saved theme (theme.css + theme.js) apne aap load ho jaati hai
     • naam + avatar profile se live update hote hain
     • click par user-profile.html khulta hai aur Back button isi page par wapas aata hai
   =========================================================== */
(function () {
    // Is script ka folder (taaki Web_Icon.png, theme.css, user-profile.html sab pages par sahi milen)
    var BASE = "";
    try {
        var cs = document.currentScript;
        if (cs && cs.src) BASE = cs.src.replace(/[^\/]*([?#].*)?$/, "");
    } catch (e) { /* ignore */ }

    // ---- 1. Theme ko har us page par apply karo jahan chip hai ----
    function ensureTheme() {
        var head = document.head || document.documentElement;
        if (!document.querySelector('link[href*="theme.css"], link[href*="them.css"]')) {
            var link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = BASE + "theme.css";
            head.appendChild(link);
        }
        if (!window.__ccThemeLoaded && !document.querySelector('script[src*="theme.js"], script[src*="them.js"]')) {
            var s = document.createElement("script");
            s.src = BASE + "theme.js";
            head.appendChild(s);
        }
    }
    ensureTheme();

    // ---- 2. Helpers ----
    function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }

    function cachedName() {
        try {
            var d = JSON.parse(lsGet("ccProfileData") || "null");
            return d && d.name ? String(d.name) : "";
        } catch (e) { return ""; }
    }

    function resolveName() {
        var saved = cachedName();
        if (saved) return saved;
        var u = window.auth && window.auth.currentUser;
        if (u) return u.displayName || (u.email ? u.email.split("@")[0] : "") || "Operator";
        return "Operator";
    }

    function ensureStyles() {
        if (document.getElementById("cc-user-chip-styles")) return;
        var st = document.createElement("style");
        st.id = "cc-user-chip-styles";
        st.textContent = [
            "user-profile-chip{display:inline-block;flex-shrink:0}",
            ".cc-user-chip{display:inline-flex;align-items:center;gap:9px;padding:4px 12px 4px 5px;",
            "background:var(--cc-white,#fff);border:1.5px solid var(--cc-border,#e2e8f0);border-radius:999px;",
            "cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.04);transition:all .22s cubic-bezier(.16,1,.3,1);",
            "user-select:none;flex-shrink:0;color:var(--cc-ink,#1a1a2e);font-family:inherit}",
            ".cc-user-chip:hover,.cc-user-chip:focus-visible{border-color:var(--cc-purple,#9B00D2);",
            "box-shadow:0 4px 14px var(--cc-purple-soft,rgba(155,0,210,.12));transform:translateY(-1px);outline:none}",
            ".cc-chip-avatar-wrap{position:relative;width:32px;height:32px;flex-shrink:0}",
            ".cc-chip-avatar{view-transition-name:cc-avatar}",
            ".cc-chip-avatar{width:100%;height:100%;border-radius:50%;object-fit:cover;",
            "background:var(--cc-panel,var(--cc-offwhite,#f8fafc));border:1.5px solid var(--cc-white,#fff);",
            "box-shadow:0 0 0 1.5px var(--cc-purple,#9B00D2);display:block}",
            ".cc-chip-status-dot{position:absolute;bottom:-1px;right:-1px;width:8px;height:8px;border-radius:50%;",
            "background:#10b981;border:1.5px solid var(--cc-white,#fff)}",
            ".cc-chip-meta{display:flex;flex-direction:column;line-height:1.15;text-align:left}",
            ".cc-chip-name{font-size:.78rem;font-weight:700;color:var(--cc-ink,#1a1a2e);max-width:110px;",
            "white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
            ".cc-chip-role{font-size:.62rem;font-weight:600;color:#10b981;letter-spacing:.02em}",
            ".cc-chip-arrow{width:10px;height:10px;color:var(--cc-muted,#94a3b8);margin-left:2px;",
            "transition:transform .2s ease,color .2s ease}",
            ".cc-user-chip:hover .cc-chip-arrow{transform:translateX(2px);color:var(--cc-purple,#9B00D2)}",
            "@media (max-width:420px){.cc-chip-meta{display:none}.cc-user-chip{padding-right:5px}.cc-chip-arrow{display:none}}"
        ].join("");
        (document.head || document.documentElement).appendChild(st);
    }

    // ---- 3. Component ----
    class UserProfileChip extends HTMLElement {
        connectedCallback() {
            ensureStyles();
            if (this._built) { this.refresh(); return; }
            this._built = true;

            this.innerHTML =
                '<div class="cc-user-chip" role="link" tabindex="0" title="Open Account Profile" aria-label="Open account profile">' +
                    '<div class="cc-chip-avatar-wrap">' +
                        '<img class="cc-chip-avatar" id="dsUserAvatar" data-cc-user-avatar alt="Profile">' +
                        '<span class="cc-chip-status-dot"></span>' +
                    '</div>' +
                    '<div class="cc-chip-meta">' +
                        '<span class="cc-chip-name" data-cc-user-name>Operator</span>' +
                        '<span class="cc-chip-role">Online</span>' +
                    '</div>' +
                    '<svg class="cc-chip-arrow" viewBox="0 0 10 10" fill="none" stroke="currentColor" ' +
                        'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
                        '<path d="M3.5 1.5 7 5 3.5 8.5"/></svg>' +
                '</div>';

            var chip = this.querySelector(".cc-user-chip");
            var img = this.querySelector(".cc-chip-avatar");
            img.addEventListener("error", function () {
                var fallback = BASE + "Web_Icon.png";
                if (img.getAttribute("src") !== fallback) img.src = fallback;
            });

            var go = function () {
                // Back button isi page par (query + hash ke saath) wapas laye
                var from = window.location.pathname + window.location.search + window.location.hash;
                var url = BASE + "user-profile.html?from=" + encodeURIComponent(from);
                var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
                // View-transition wale browsers khud animate karte hain; baaki me chhota fade-out
                if (!("CSSViewTransitionRule" in window) && !reduce) {
                    document.body.classList.add("cc-leaving");
                    setTimeout(function () { window.location.href = url; }, 170);
                } else {
                    window.location.href = url;
                }
            };
            chip.addEventListener("click", go);
            chip.addEventListener("keydown", function (e) {
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
            });

            var self = this;
            this._onRefresh = function () { self.refresh(); };
            window.addEventListener("storage", this._onRefresh);          // doosra tab
            window.addEventListener("cc-profile-updated", this._onRefresh); // same tab (profile page)
            this._watchAuth();
            this.refresh();
        }

        disconnectedCallback() {
            window.removeEventListener("storage", this._onRefresh);
            window.removeEventListener("cc-profile-updated", this._onRefresh);
        }

        _watchAuth() {
            var self = this;
            var tries = 0;
            (function attach() {
                if (window.auth && typeof window.auth.onAuthStateChanged === "function") {
                    window.auth.onAuthStateChanged(function () { self.refresh(); });
                } else if (tries++ < 20) {
                    setTimeout(attach, 500); // auth-firebase.js thoda late load ho sakta hai
                }
            })();
        }

        refresh() {
            var nameEl = this.querySelector("[data-cc-user-name]");
            if (nameEl) nameEl.textContent = resolveName();
            var img = this.querySelector(".cc-chip-avatar");
            if (img) {
                var u = window.auth && window.auth.currentUser;
                var src = lsGet("savedProfilePic") || (u && u.photoURL) || (BASE + "Web_Icon.png");
                if (img.getAttribute("src") !== src) img.src = src;
            }
        }
    }

    // ---- 4. Billing / receipt pages ke liye: window.ccGetShopProfile() ----
    // bill.html jaisi koi bhi page ye call karke receipt header bhar sakta hai:
    //   const p = ccGetShopProfile();  p.shopName, p.phone, p.location, p.hours, p.upi, p.services, p.logo (data URL)
    window.ccGetShopProfile = function () {
        var d = {};
        try { d = JSON.parse(lsGet("ccProfileData") || "{}") || {}; } catch (e) { d = {}; }
        var logo = lsGet("ccShopLogo") || "";
        return {
            name: d.name || "",
            shopName: d.shopName || d.name || "",
            phone: d.phone || "",
            location: d.location || "",
            hours: d.hours || "",
            bio: d.bio || "",
            upi: d.upi || "",
            services: Array.isArray(d.services) ? d.services : [],
            logo: logo.indexOf("data:image/") === 0 ? logo : ""
        };
    };

    if (!customElements.get("user-profile-chip")) {
        customElements.define("user-profile-chip", UserProfileChip);
    }
})();
