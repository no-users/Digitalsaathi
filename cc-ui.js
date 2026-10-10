/* ===========================================================
   CLICK & CONNECT — Shared UI engine (cc-ui.js)
   window.ccToast(msg, type, opts)
   window.ccDialog.confirm / alert / prompt / open
   window.ccModal.open(id) / close(id)     (for static modals in HTML)
   =========================================================== */
(function () {
    'use strict';

    function esc(s) {
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    window.ccEscape = esc;

    /* ---------- scroll lock (ref-counted) ---------- */
    var locks = 0;
    function lockScroll() { if (locks++ === 0) document.documentElement.classList.add('cc-lock'); }
    function unlockScroll() { if (--locks <= 0) { locks = 0; document.documentElement.classList.remove('cc-lock'); } }

    /* ---------- Toasts ---------- */
    var ICONS = { success: 'fa-circle-check', error: 'fa-circle-exclamation', warn: 'fa-triangle-exclamation', info: 'fa-circle-info' };

    function getStack() {
        var s = document.getElementById('ccToastStack') || document.getElementById('ccToastBox');
        if (!s) {
            s = document.createElement('div');
            s.id = 'ccToastStack';
            document.body.appendChild(s);
        }
        s.classList.add('cc-toast-stack');
        s.setAttribute('aria-live', 'polite');
        return s;
    }

    window.ccToast = function (msg, type, opts) {
        type = ICONS[type] ? type : 'info';
        opts = opts || {};
        var ms = opts.duration || (type === 'error' ? 5000 : 3600);
        var stack = getStack();
        // keep the stack short
        while (stack.children.length >= 3) stack.removeChild(stack.firstChild);

        var el = document.createElement('div');
        el.className = 'cc-toast ' + type;
        el.setAttribute('role', type === 'error' ? 'alert' : 'status');
        el.style.setProperty('--cc-toast-ms', ms + 'ms');
        el.innerHTML =
            '<span class="cc-toast-ico"><i class="fas ' + ICONS[type] + '"></i></span>' +
            '<div class="cc-toast-txt">' + (opts.title ? '<b>' + esc(opts.title) + '</b>' : '') + '<span></span></div>' +
            '<button class="cc-toast-x" type="button" aria-label="Close"><i class="fas fa-xmark"></i></button>';
        el.querySelector('.cc-toast-txt span').textContent = msg;   // textContent => no XSS
        stack.appendChild(el);

        var gone = false;
        function dismiss() {
            if (gone) return; gone = true;
            el.classList.remove('show');
            setTimeout(function () { el.remove(); }, 380);
        }
        el.querySelector('.cc-toast-x').addEventListener('click', dismiss);
        requestAnimationFrame(function () { requestAnimationFrame(function () { el.classList.add('show'); }); });
        setTimeout(dismiss, ms);
        return dismiss;
    };

    /* ---------- Static modal helper (modals written in HTML) ---------- */
    var openStack = [];

    function bindBackdrop(back, onClose) {
        back.addEventListener('mousedown', function (e) { if (e.target === back) onClose('backdrop'); });
        var close = back.querySelector('[data-cc-close]');
        if (close) close.addEventListener('click', function () { onClose('x'); });
        // swipe-down on the handle closes the sheet (phones)
        var handle = back.querySelector('.cc-dlg-handle');
        var dlg = back.querySelector('.cc-dlg');
        if (handle && dlg) {
            var startY = 0, dy = 0, dragging = false;
            handle.addEventListener('touchstart', function (e) { startY = e.touches[0].clientY; dragging = true; dlg.style.transition = 'none'; }, { passive: true });
            handle.addEventListener('touchmove', function (e) {
                if (!dragging) return;
                dy = Math.max(0, e.touches[0].clientY - startY);
                dlg.style.transform = 'translateY(' + dy + 'px)';
            }, { passive: true });
            handle.addEventListener('touchend', function () {
                dragging = false; dlg.style.transition = '';
                if (dy > 90) { dlg.style.transform = ''; onClose('swipe'); } else { dlg.style.transform = ''; }
                dy = 0;
            });
        }
    }

    function showBackdrop(back) {
        back.classList.add('is-open');
        lockScroll();
        requestAnimationFrame(function () { requestAnimationFrame(function () { back.classList.add('is-shown'); }); });
    }
    function hideBackdrop(back, remove) {
        back.classList.remove('is-shown');
        setTimeout(function () {
            back.classList.remove('is-open');
            if (remove) back.remove();
        }, 320);
        unlockScroll();
    }

    var modal = {
        open: function (id) {
            var back = document.getElementById(id);
            if (!back || back.classList.contains('is-shown')) return;
            if (!back.__ccBound) { bindBackdrop(back, function () { modal.close(id); }); back.__ccBound = true; }
            back.__ccPrevFocus = document.activeElement;
            showBackdrop(back);
            openStack.push({ type: 'modal', id: id });
            var first = back.querySelector('[data-cc-focus]') || back.querySelector('button, input');
            setTimeout(function () { if (first) first.focus({ preventScroll: true }); }, 120);
        },
        close: function (id) {
            var back = document.getElementById(id);
            if (!back || !back.classList.contains('is-shown')) return;
            hideBackdrop(back, false);
            openStack = openStack.filter(function (o) { return o.id !== id; });
            if (back.__ccPrevFocus && back.__ccPrevFocus.focus) back.__ccPrevFocus.focus({ preventScroll: true });
            back.dispatchEvent(new CustomEvent('cc:closed'));
        }
    };
    window.ccModal = modal;

    // global ESC closes the top-most popup
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape' || !openStack.length) return;
        var top = openStack[openStack.length - 1];
        if (top.type === 'modal') modal.close(top.id);
        else if (top.type === 'dialog' && top.cancel) top.cancel();
    });

    /* ---------- Dynamic dialogs ---------- */
    var seq = 0;

    /* cfg: { title, desc, icon, tone, okText, cancelText, showCancel, input:{label,type,placeholder,validate(value)=>string|Promise<string>|null},
              danger, html, wide } -> Promise<{ok, value}> */
    function open(cfg) {
        return new Promise(function (resolve) {
            var id = 'ccDlg' + (++seq);
            var tone = cfg.tone || 'info';
            var icon = cfg.icon || (tone === 'danger' ? 'fa-triangle-exclamation' : tone === 'success' ? 'fa-circle-check' : tone === 'warn' ? 'fa-bell' : 'fa-circle-info');
            var back = document.createElement('div');
            back.className = 'cc-dlg-backdrop';
            back.id = id;
            var hasInput = !!cfg.input;
            back.innerHTML =
                '<div class="cc-dlg tone-' + tone + (cfg.wide ? ' cc-dlg-wide' : '') + '" role="dialog" aria-modal="true" aria-labelledby="' + id + 't">' +
                '<span class="cc-dlg-handle"></span>' +
                '<div class="cc-dlg-icon"><i class="fas ' + esc(icon) + '"></i></div>' +
                '<h3 class="cc-dlg-title" id="' + id + 't">' + esc(cfg.title || '') + '</h3>' +
                (cfg.desc ? '<p class="cc-dlg-desc">' + esc(cfg.desc) + '</p>' : '') +
                (cfg.html ? '<div class="cc-dlg-body">' + cfg.html + '</div>' : '') +
                (hasInput ?
                    '<div class="cc-dlg-field"><label for="' + id + 'i">' + esc(cfg.input.label || '') + '</label>' +
                    '<input id="' + id + 'i" type="' + esc(cfg.input.type || 'text') + '" placeholder="' + esc(cfg.input.placeholder || '') + '" autocomplete="' + esc(cfg.input.autocomplete || 'off') + '">' +
                    '<div class="cc-dlg-err"></div></div>' : '') +
                '<div class="cc-dlg-actions' + (cfg.stack ? ' stack' : '') + '">' +
                (cfg.showCancel === false ? '' : '<button type="button" class="cc-btn cc-btn-ghost" data-act="cancel">' + esc(cfg.cancelText || 'Cancel') + '</button>') +
                '<button type="button" class="cc-btn ' + (tone === 'danger' ? 'cc-btn-danger' : 'cc-btn-primary') + '" data-act="ok" data-cc-focus><span class="lbl">' + esc(cfg.okText || 'OK') + '</span></button>' +
                '</div></div>';
            document.body.appendChild(back);

            var okBtn = back.querySelector('[data-act="ok"]');
            var cancelBtn = back.querySelector('[data-act="cancel"]');
            var input = back.querySelector('input');
            var fieldBox = back.querySelector('.cc-dlg-field');
            var errBox = back.querySelector('.cc-dlg-err');
            var prevFocus = document.activeElement;
            var done = false;
            var entry = { type: 'dialog' };

            function finish(result) {
                if (done) return; done = true;
                openStack = openStack.filter(function (o) { return o !== entry; });
                hideBackdrop(back, true);
                if (prevFocus && prevFocus.focus) prevFocus.focus({ preventScroll: true });
                resolve(result);
            }
            function cancel() { finish({ ok: false, value: null }); }
            entry.cancel = cancel;

            async function submit() {
                if (done) return;
                var val = input ? input.value : null;
                if (hasInput && cfg.input.validate) {
                    okBtn.disabled = true;
                    var lbl = okBtn.querySelector('.lbl');
                    var old = lbl.textContent;
                    lbl.innerHTML = '<span class="cc-spin"></span>';
                    var err = null;
                    try { err = await cfg.input.validate(val); } catch (e) { err = (e && e.message) || 'Error'; }
                    okBtn.disabled = false; lbl.textContent = old;
                    if (err) {
                        fieldBox.classList.remove('has-err'); void fieldBox.offsetWidth;
                        errBox.textContent = err; fieldBox.classList.add('has-err');
                        input.focus(); input.select();
                        return;
                    }
                }
                finish({ ok: true, value: val });
            }

            okBtn.addEventListener('click', submit);
            if (cancelBtn) cancelBtn.addEventListener('click', cancel);
            if (input) input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
            if (input) input.addEventListener('input', function () { fieldBox.classList.remove('has-err'); });
            bindBackdrop(back, function () { if (cfg.dismissable !== false) cancel(); });

            openStack.push(entry);
            showBackdrop(back);
            setTimeout(function () { (input || okBtn).focus({ preventScroll: true }); }, 140);
        });
    }

    window.ccDialog = {
        open: open,
        confirm: function (cfg) { return open(cfg).then(function (r) { return r.ok; }); },
        alert: function (cfg) { cfg = Object.assign({ showCancel: false, okText: 'Theek hai' }, cfg); return open(cfg).then(function () { return true; }); },
        prompt: function (cfg) { return open(cfg).then(function (r) { return r.ok ? r.value : null; }); }
    };
})();
