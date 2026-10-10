/* ===========================================================
   CLICK & CONNECT — Global Theme Switcher
   Kisi bhi page par <script src="theme.js"></script> (ya profile chip) lagte hi
   saved theme + accent colour apne aap apply ho jaate hain. Ek baar load hone ke
   baad dobara load hone par kuch nahi karta (safe to include twice).

   Public API:
     changeGlobalTheme(name)   name = default | dark | neon | glass | light | auto
     cycleGlobalTheme()
     getGlobalTheme()
     changeAccent(hex | null)  null = accent reset
     getAccent()
   =========================================================== */
(function () {
    if (window.__ccThemeLoaded) return;
    window.__ccThemeLoaded = true;

    var STORAGE_KEY = "selectedSupremeTheme";
    var ACCENT_KEY = "ccAccentColor";
    var THEMES = ["default", "dark", "neon", "glass", "light", "auto"];
    var THEME_CLASSES = ["dark", "neon", "glass", "light"];
    var THEME_LABELS = {
        "default": "Click & Connect",
        "dark": "Midnight Dark",
        "neon": "Cyberpunk Neon",
        "glass": "Glassmorphism",
        "light": "Pristine Light",
        "auto": "System (Auto)"
    };
    var ACCENT_VARS = ["--cc-purple", "--cc-purple-hover", "--cc-purple-soft", "--cc-on-accent"];

    function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* private mode / quota */ } }
    function lsDel(k) { try { localStorage.removeItem(k); } catch (e) { /* ignore */ } }

    function readSaved() { return lsGet(STORAGE_KEY) || "default"; }
    function normalize(name) { return THEMES.indexOf(name) > -1 ? name : "default"; }

    var darkMq = window.matchMedia ? window.matchMedia("(prefers-color-scheme: dark)") : null;

    // "auto" = phone/computer ki dark/light setting follow karo
    function effective(name) {
        if (name !== "auto") return name;
        return darkMq && darkMq.matches ? "dark" : "light";
    }

    /* ---------- Accent colour ---------- */
    function parseHex(hex) {
        var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || "").trim());
        if (!m) return null;
        var n = parseInt(m[1], 16);
        return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
    }
    function toHex(c) {
        function h(v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? "0" : "") + v.toString(16); }
        return "#" + h(c.r) + h(c.g) + h(c.b);
    }
    function luminance(c) {
        function f(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
        return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b);
    }

    function paintAccent(hex) {
        var body = document.body;
        if (!body) return false;
        var c = parseHex(hex);
        if (!c) {
            ACCENT_VARS.forEach(function (v) { body.style.removeProperty(v); });
            return true;
        }
        var hover = { r: c.r * 0.85, g: c.g * 0.85, b: c.b * 0.85 };
        // Accent ke upar likha text dikhna chahiye: halka accent -> dark text, gehra -> white
        var onAccent = luminance(c) > 0.42 ? "#10131f" : "#ffffff";
        body.style.setProperty("--cc-purple", toHex(c));
        body.style.setProperty("--cc-purple-hover", toHex(hover));
        body.style.setProperty("--cc-purple-soft", "rgba(" + c.r + "," + c.g + "," + c.b + ",0.15)");
        body.style.setProperty("--cc-on-accent", onAccent);
        return true;
    }

    /* ---------- Theme ---------- */
    function paint(name) {
        var body = document.body;
        if (!body) return false;
        var eff = effective(name);
        THEME_CLASSES.forEach(function (c) { body.classList.remove(c); });
        if (eff !== "default") body.classList.add(eff);
        body.setAttribute("data-cc-theme", eff);
        document.documentElement.setAttribute("data-cc-theme", eff);
        paintAccent(lsGet(ACCENT_KEY));

        var dropdown = document.getElementById("globalThemeSelector");
        if (dropdown && dropdown.value !== name) dropdown.value = name;
        return true;
    }

    function emit(type, detail) {
        try { window.dispatchEvent(new CustomEvent(type, { detail: detail })); } catch (e) { /* old browser */ }
    }

    function changeGlobalTheme(themeName) {
        var name = normalize(themeName);
        lsSet(STORAGE_KEY, name);
        paint(name);
        emit("cc-theme-change", { theme: name });
        return name;
    }

    function cycleGlobalTheme() {
        var idx = THEMES.indexOf(normalize(readSaved()));
        return changeGlobalTheme(THEMES[(idx + 1) % THEMES.length]);
    }

    function changeAccent(hex) {
        var c = parseHex(hex);
        if (c) lsSet(ACCENT_KEY, toHex(c)); else lsDel(ACCENT_KEY);
        paintAccent(c ? toHex(c) : null);
        emit("cc-accent-change", { accent: c ? toHex(c) : null });
        return c ? toHex(c) : null;
    }

    window.changeGlobalTheme = changeGlobalTheme;
    window.cycleGlobalTheme = cycleGlobalTheme;
    window.getGlobalTheme = function () { return normalize(readSaved()); };
    window.changeAccent = changeAccent;
    window.getAccent = function () { var c = parseHex(lsGet(ACCENT_KEY)); return c ? toHex(c) : null; };
    window.CC_THEME_LABELS = THEME_LABELS;
    window.CC_THEMES = THEMES.slice();

    // Page flash na ho isliye turant apply (agar body maujood hai)
    paint(normalize(readSaved()));
    document.addEventListener("DOMContentLoaded", function () { paint(normalize(readSaved())); });

    // Doosre tab me theme / accent badle to yahan bhi badal jaye
    window.addEventListener("storage", function (e) {
        if (e.key === STORAGE_KEY || e.key === ACCENT_KEY) paint(normalize(readSaved()));
    });

    // Auto mode: system dark/light badle to turant follow karo
    if (darkMq) {
        var onSystemChange = function () { if (readSaved() === "auto") paint("auto"); };
        if (darkMq.addEventListener) darkMq.addEventListener("change", onSystemChange);
        else if (darkMq.addListener) darkMq.addListener(onSystemChange);
    }
})();
