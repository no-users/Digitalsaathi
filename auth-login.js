/* ===========================================================
   CLICK & CONNECT — Login logic  (auth-login.js)
   Same behaviour as before:
   - SESSION persistence, 5 wrong tries => 5 min lock
   - signup writes users/{uid} {name,nameLower,email,role,createdAt}
   - forgot password + find-email-by-name
   Improved: open-redirect fix, live lockout timer (+ counter reset),
   remember-email, already-signed-in banner, Firestore-failure safe signup.
   =========================================================== */
(function () {
    'use strict';
    var $ = function (id) { return document.getElementById(id); };

    var LS_FAIL = 'cc_fail_count', LS_LOCK = 'cc_lockout_until', LS_EMAIL = 'cc_remember_email';
    var MAX_TRIES = 5, LOCK_MS = 5 * 60 * 1000;

    var busy = false;           // a sign-in / sign-up request is running
    var lockTimer = null;

    /* ---------------- helpers ---------------- */
    function show(el, html) {
        if (!el) return;
        el.innerHTML = html;      // only ever called with our own static markup (user text goes via textContent)
        el.hidden = false;
        el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
    }
    function hide(el) { if (el) { el.hidden = true; el.innerHTML = ''; } }
    function hideAllMsgs() { ['ccErrorBox', 'ccSuccessBox', 'fpErrorBox', 'feErrorBox'].forEach(function (i) { hide($(i)); }); var r = $('feResultBox'); if (r) { r.hidden = true; r.innerHTML = ''; } }
    function showError(boxId, msg) {
        var box = $(boxId);
        show(box, '<i class="fas fa-circle-exclamation"></i><span></span>');
        box.querySelector('span').textContent = msg;
        var shell = $('shell'); shell.classList.remove('shake'); void shell.offsetWidth; shell.classList.add('shake');
        if (navigator.vibrate) navigator.vibrate(60);
    }

    function setBtn(btn, state, label) {
        var lbl = btn.querySelector('.lbl'), arr = btn.querySelector('.arr');
        if (!btn.__label) btn.__label = lbl.textContent;
        btn.classList.remove('cc-btn-success');
        if (state === 'loading') {
            btn.disabled = true; lbl.textContent = label || 'Please wait…';
            if (arr) arr.outerHTML = '<span class="cc-spin arr"></span>';
        } else if (state === 'success') {
            btn.disabled = true; btn.classList.add('cc-btn-success'); lbl.textContent = label || 'Done!';
            var a = btn.querySelector('.arr'); if (a) a.outerHTML = '<i class="fas fa-circle-check arr check"></i>';
        } else {
            btn.disabled = false; lbl.textContent = btn.__label;
            var s = btn.querySelector('.arr'); if (s) s.outerHTML = '<i class="fas ' + (btn.dataset.icon || 'fa-arrow-right') + ' arr"></i>';
        }
    }
    ['loginSubmitBtn', 'signupSubmitBtn', 'fpSubmitBtn', 'feSubmitBtn'].forEach(function (id) {
        var b = $(id); if (!b) return;
        var ic = b.querySelector('.arr'); b.dataset.icon = ic ? (ic.className.match(/fa-[a-z-]+/g) || ['fa-arrow-right']).filter(function (c) { return c !== 'fa-solid' && c !== 'fas'; })[0] : 'fa-arrow-right';
    });

    function friendlyAuthError(err) {
        var map = {
            'auth/invalid-email': 'Email sahi format me nahi hai.',
            'auth/user-not-found': 'Is email se koi account nahi mila.',
            'auth/wrong-password': 'Password galat hai.',
            'auth/invalid-credential': 'Email ya password galat hai.',
            'auth/email-already-in-use': 'Ye email pehle se registered hai — Sign In karein.',
            'auth/weak-password': 'Password kam se kam 6 characters ka hona chahiye.',
            'auth/too-many-requests': 'Bahut zyada try ho gaya — kripya 5 minute baad try karein.',
            'auth/network-request-failed': 'Network error — internet check karein.',
            'auth/user-disabled': 'Ye account disable kar diya gaya hai.'
        };
        return map[err && err.code] || (err && err.message) || 'Kuch galat ho gaya, dobara koshish karein.';
    }

    function maskEmail(email) {
        var parts = String(email || '').split('@');
        if (parts.length !== 2) return email;
        var name = parts[0], domain = parts[1];
        var dot = domain.lastIndexOf('.');
        return name.slice(0, 2) + '***@' + domain.slice(0, 1) + '***' + (dot > 0 ? domain.slice(dot) : '');
    }
    var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    /* ---------------- safe redirect (blocks open-redirect) ---------------- */
    function getRedirectTarget() {
        var p = new URLSearchParams(window.location.search);
        var raw = p.get('redirect') || p.get('next');
        if (!raw) return null;
        try {
            var u = new URL(raw, window.location.href);
            if (u.origin !== window.location.origin) return null;        // only same-site pages
            if (/auth-login\.html$/i.test(u.pathname)) return null;
            return u.href;
        } catch (e) { return null; }
    }
    function redirectAfterLogin() {
        window.location.replace(getRedirectTarget() || 'index.html');
    }

    /* ---------------- views / tabs ---------------- */
    function goView(id) {
        document.querySelectorAll('.cc-view').forEach(function (v) { v.classList.remove('active'); });
        $(id).classList.add('active');
        hideAllMsgs();
        var first = $(id).querySelector('input');
        if (first && window.innerWidth > 900) setTimeout(function () { first.focus({ preventScroll: true }); }, 250);
    }
    document.querySelectorAll('[data-go]').forEach(function (b) { b.addEventListener('click', function () { goView(b.dataset.go); }); });
    $('goForgotPwd').addEventListener('click', function (e) {
        e.preventDefault();
        var em = $('loginEmail').value.trim(); if (EMAIL_RE.test(em)) $('fpEmail').value = em;
        goView('forgotPasswordView');
    });
    $('goForgotEmail').addEventListener('click', function (e) { e.preventDefault(); goView('forgotEmailView'); });

    function setTab(tab) {
        var login = tab === 'login';
        $('seg').classList.toggle('signup', !login);
        $('tabLoginBtn').classList.toggle('active', login);
        $('tabSignupBtn').classList.toggle('active', !login);
        $('tabLoginBtn').setAttribute('aria-selected', login);
        $('tabSignupBtn').setAttribute('aria-selected', !login);
        $('loginView').classList.toggle('active', login);
        $('signupView').classList.toggle('active', !login);
        hide($('ccErrorBox')); hide($('ccSuccessBox'));
    }
    $('tabLoginBtn').addEventListener('click', function () { setTab('login'); });
    $('tabSignupBtn').addEventListener('click', function () { setTab('signup'); });
    if (/[?&]tab=signup/.test(location.search) || location.hash === '#signup') setTab('signup');

    /* show / hide password */
    document.querySelectorAll('[data-eye]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            var input = $(btn.dataset.eye), ic = btn.querySelector('i');
            var isPwd = input.type === 'password';
            input.type = isPwd ? 'text' : 'password';
            ic.className = 'fas ' + (isPwd ? 'fa-eye-slash' : 'fa-eye');
            btn.setAttribute('aria-label', isPwd ? 'Password chhupayein' : 'Password dikhayein');
            input.focus();
        });
    });

    /* caps-lock hint */
    function capsCheck(e) { if (e.getModifierState) $('capsHint').hidden = !e.getModifierState('CapsLock'); }
    $('loginPassword').addEventListener('keydown', capsCheck);
    $('loginPassword').addEventListener('keyup', capsCheck);
    $('loginPassword').addEventListener('blur', function () { $('capsHint').hidden = true; });

    /* clear invalid state while typing */
    document.querySelectorAll('.cc-input input').forEach(function (i) {
        i.addEventListener('input', function () { var f = i.closest('.cc-field'); if (f) f.classList.remove('invalid'); });
    });
    function markInvalid(id) { var f = $(id).closest('.cc-field'); if (f) f.classList.add('invalid'); $(id).focus(); }

    /* remember email */
    (function () {
        var saved = localStorage.getItem(LS_EMAIL);
        if (saved) { $('loginEmail').value = saved; $('rememberMe').checked = true; }
    })();

    /* ---------------- logout reason banner ---------------- */
    (function () {
        var reason = new URLSearchParams(location.search).get('reason');
        var b = $('ccReasonBanner');
        if (reason === 'timeout') show(b, '<i class="fas fa-clock"></i><span>10 minute tak koi activity na hone ki wajah se aap logout ho gaye. Dobara sign in karein.</span>');
        else if (reason === 'device_limit') show(b, '<i class="fas fa-desktop"></i><span>2 se zyada device par login hone ki wajah se is purane device ka session band ho gaya.</span>');
    })();

    /* ---------------- lockout (live countdown) ---------------- */
    var failed = parseInt(localStorage.getItem(LS_FAIL) || '0', 10);
    var lockUntil = parseInt(localStorage.getItem(LS_LOCK) || '0', 10);

    function fmt(ms) { var s = Math.max(0, Math.ceil(ms / 1000)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
    function tickLock() {
        var left = lockUntil - Date.now();
        if (left <= 0) {
            clearInterval(lockTimer); lockTimer = null;
            failed = 0; lockUntil = 0;
            localStorage.removeItem(LS_FAIL); localStorage.removeItem(LS_LOCK);
            hide($('ccErrorBox')); $('loginSubmitBtn').disabled = false;
            window.ccToast && ccToast('Ab aap dobara sign in kar sakte hain.', 'success');
            return;
        }
        var box = $('ccErrorBox');
        show(box, '<i class="fas fa-lock"></i><span>Security Block: 5 baar galat password. <b>' + fmt(left) + '</b> baad dobara koshish karein.</span>');
        box.style.animation = 'none';
        $('loginSubmitBtn').disabled = true;
    }
    function checkLockout() {
        if (Date.now() < lockUntil) { tickLock(); if (!lockTimer) lockTimer = setInterval(tickLock, 1000); return true; }
        if (lockUntil) { failed = 0; lockUntil = 0; localStorage.removeItem(LS_FAIL); localStorage.removeItem(LS_LOCK); }
        return false;
    }
    checkLockout();

    /* ---------------- SIGN IN ---------------- */
    $('loginForm').addEventListener('submit', function (e) {
        e.preventDefault();
        if (busy || checkLockout()) return;
        hide($('ccErrorBox')); hide($('ccSuccessBox'));

        var email = $('loginEmail').value.trim();
        var password = $('loginPassword').value;
        if (!EMAIL_RE.test(email)) { markInvalid('loginEmail'); showError('ccErrorBox', 'Sahi email address daalein.'); return; }
        if (!password) { markInvalid('loginPassword'); showError('ccErrorBox', 'Password daalein.'); return; }

        busy = true;
        var btn = $('loginSubmitBtn');
        setBtn(btn, 'loading', 'Signing in…');

        auth.setPersistence(firebase.auth.Auth.Persistence.SESSION)
            .then(function () { return auth.signInWithEmailAndPassword(email, password); })
            .then(function () {
                localStorage.removeItem(LS_FAIL); localStorage.removeItem(LS_LOCK);
                if ($('rememberMe').checked) localStorage.setItem(LS_EMAIL, email); else localStorage.removeItem(LS_EMAIL);
                setBtn(btn, 'success', 'Welcome back!');
                setTimeout(redirectAfterLogin, 650);
            })
            .catch(function (err) {
                busy = false;
                var wrongCreds = /wrong-password|invalid-credential|user-not-found/.test(err && err.code || '');
                if (wrongCreds) {
                    failed++;
                    localStorage.setItem(LS_FAIL, String(failed));
                }
                if (failed >= MAX_TRIES) {
                    lockUntil = Date.now() + LOCK_MS;
                    localStorage.setItem(LS_LOCK, String(lockUntil));
                    setBtn(btn, 'idle');
                    checkLockout();
                    window.ccDialog && ccDialog.alert({
                        title: 'Login 5 minute ke liye block',
                        desc: '5 baar galat password dala gaya. Security ke liye login thodi der ke liye band kar diya gaya hai. Password bhool gaye hain to "Password bhool gaye?" use karein.',
                        tone: 'danger', icon: 'fa-lock', okText: 'Samajh gaya'
                    });
                    return;
                }
                showError('ccErrorBox', friendlyAuthError(err) + (wrongCreds ? ' (Attempts left: ' + (MAX_TRIES - failed) + ')' : ''));
                setBtn(btn, 'idle');
            });
    });

    /* ---------------- SIGN UP ---------------- */
    $('signupPassword').addEventListener('input', function () {
        var v = this.value, score = 0;
        if (v.length >= 6) score++;
        if (v.length >= 10) score++;
        if (/[A-Z]/.test(v) && /[0-9]/.test(v)) score++;
        if (/[^A-Za-z0-9]/.test(v)) score++;
        if (!v) score = 0;
        var colors = ['', '#DD603E', '#FE28AF', '#9B00D2', '#007800'];
        var labels = ['', 'Kamzor', 'Theek-thaak', 'Accha', 'Bahut strong 💪'];
        document.querySelectorAll('.cc-meter i').forEach(function (bar, i) {
            bar.style.background = i < score ? colors[score] : '';
            bar.classList.toggle('on', i < score);
        });
        var lbl = $('pwdMeterLbl'); lbl.textContent = v ? labels[score] : '\u00A0'; lbl.style.color = colors[score] || '';
    });

    $('signupForm').addEventListener('submit', function (e) {
        e.preventDefault();
        if (busy) return;
        hide($('ccErrorBox'));
        var name = $('signupName').value.trim();
        var email = $('signupEmail').value.trim();
        var password = $('signupPassword').value;
        if (name.length < 2) { markInvalid('signupName'); showError('ccErrorBox', 'Apna poora naam daalein.'); return; }
        if (!EMAIL_RE.test(email)) { markInvalid('signupEmail'); showError('ccErrorBox', 'Sahi email address daalein.'); return; }
        if (password.length < 6) { markInvalid('signupPassword'); showError('ccErrorBox', 'Password kam se kam 6 characters ka hona chahiye.'); return; }

        busy = true;
        var btn = $('signupSubmitBtn');
        setBtn(btn, 'loading', 'Creating…');

        auth.setPersistence(firebase.auth.Auth.Persistence.SESSION)
            .then(function () { return auth.createUserWithEmailAndPassword(email, password); })
            .then(function (cred) {
                return cred.user.updateProfile({ displayName: name }).then(function () {
                    return db.collection('users').doc(cred.user.uid).set({
                        name: name, nameLower: name.toLowerCase(), email: email,
                        role: 'user', createdAt: firebase.firestore.FieldValue.serverTimestamp()
                    }).catch(function (e) { console.warn('Profile doc write failed (account created):', e); });
                });
            })
            .then(function () {
                localStorage.setItem(LS_EMAIL, email);
                setBtn(btn, 'success', 'Account ban gaya!');
                setTimeout(redirectAfterLogin, 800);
            })
            .catch(function (err) {
                busy = false;
                showError('ccErrorBox', friendlyAuthError(err));
                setBtn(btn, 'idle');
            });
    });

    /* ---------------- FORGOT PASSWORD ---------------- */
    $('forgotPasswordForm').addEventListener('submit', function (e) {
        e.preventDefault();
        hide($('fpErrorBox'));
        var email = $('fpEmail').value.trim();
        if (!EMAIL_RE.test(email)) { markInvalid('fpEmail'); showError('fpErrorBox', 'Sahi email address daalein.'); return; }
        var btn = $('fpSubmitBtn');
        setBtn(btn, 'loading', 'Bhej rahe hain…');
        auth.sendPasswordResetEmail(email)
            .then(function () {
                setBtn(btn, 'idle');
                ccDialog.alert({
                    title: 'Reset link bhej diya! 📩',
                    desc: email + ' par password reset link bheja gaya hai. Inbox ya spam folder check karein.',
                    tone: 'success', icon: 'fa-paper-plane', okText: 'Sign In par jayein'
                }).then(function () { $('loginEmail').value = email; goView('authView'); setTab('login'); });
            })
            .catch(function (err) { setBtn(btn, 'idle'); showError('fpErrorBox', friendlyAuthError(err)); });
    });

    /* ---------------- FORGOT EMAIL ---------------- */
    $('forgotEmailForm').addEventListener('submit', function (e) {
        e.preventDefault();
        hide($('feErrorBox'));
        var resBox = $('feResultBox'); resBox.hidden = true; resBox.innerHTML = '';
        var name = $('feName').value.trim();
        if (!name) { markInvalid('feName'); return; }
        var btn = $('feSubmitBtn');
        setBtn(btn, 'loading', 'Dhoondh rahe hain…');
        db.collection('users').where('nameLower', '==', name.toLowerCase()).get()
            .then(function (snap) {
                setBtn(btn, 'idle');
                if (snap.empty) { showError('feErrorBox', 'Is naam se koi account nahi mila.'); return; }
                var html = '<div class="ttl"><i class="fas fa-circle-check"></i> Registered email(s):</div>';
                snap.docs.forEach(function (d) { html += '<div class="it"><i class="fas fa-envelope"></i><span></span></div>'; });
                resBox.innerHTML = html;
                var spans = resBox.querySelectorAll('.it span');
                snap.docs.forEach(function (d, i) { spans[i].textContent = maskEmail(d.data().email); });
                resBox.hidden = false;
            })
            .catch(function () { setBtn(btn, 'idle'); showError('feErrorBox', 'Kuch galat ho gaya, dobara koshish karein.'); });
    });

    /* ---------------- already signed-in banner ---------------- */
    auth.onAuthStateChanged(function (user) {
        var banner = $('ccSessionBanner');
        if (!user) { banner.hidden = true; return; }
        if (busy) return;                                  // login in progress handles its own redirect
        var target = getRedirectTarget();
        if (target) { window.location.replace(target); return; }
        var nm = user.displayName || (user.email || 'User').split('@')[0];
        $('sessAv').textContent = nm.charAt(0).toUpperCase();
        $('sessName').textContent = 'Aap ' + nm + ' ke naam se signed in hain';
        $('sessEmail').textContent = user.email || '';
        banner.hidden = false;
    });
    $('sessContinue').addEventListener('click', redirectAfterLogin);
    $('sessSwitch').addEventListener('click', function () {
        auth.signOut().then(function () { $('ccSessionBanner').hidden = true; ccToast('Sign out ho gaya. Naye account se sign in karein.', 'info'); });
    });

    /* ---------------- one-time messages from other pages ---------------- */
    if (localStorage.getItem('cc_flash') === 'account_deleted') {
        localStorage.removeItem('cc_flash');
        setTimeout(function () { ccToast('Aapka account aur data delete ho gaya.', 'success', { title: 'Account delete ho gaya' }); }, 600);
    }

    /* ---------------- network toasts ---------------- */
    window.addEventListener('offline', function () { ccToast('Internet connection nahi hai.', 'error'); });
    window.addEventListener('online', function () { ccToast('Internet wapas aa gaya.', 'success'); });

    /* ---------------- PWA service worker ---------------- */
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
        window.addEventListener('load', function () { navigator.serviceWorker.register('cc-sw.js').catch(function () {}); });
    }
})();
