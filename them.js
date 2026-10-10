/* Compatibility shim: purane pages jo "them.js" link karte hain unke liye.
   Asli code theme.js me hai. Sab pages theme.js par aa jayein to ye file delete kar sakte hain. */
(function () {
    if (window.__ccThemeLoaded) return;
    var s = document.currentScript;
    var base = s && s.src ? s.src.replace(/[^\/]*([?#].*)?$/, "") : "";
    document.write('<script src="' + base + 'theme.js"><\/script>');
})();
