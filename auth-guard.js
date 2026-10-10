// ===========================================================
// CLICK & CONNECT — Universal Cross-Project Auth Guard
// Features: 2 Devices Limit, 10m Idle Timeout with 60s Warning,
// Tab-close logout, Cross-tab sync, Online/Offline alert, Unsaved guard.
// ===========================================================
(function () {
    const CENTRAL_LOGIN_URL = 'auth-login.html';
    const INACTIVITY_LIMIT_MS = 10 * 60 * 1000; // 10 Minutes
    const WARNING_TIME_MS = 9 * 60 * 1000;      // 9th Minute Warning
    const STORAGE_KEY_LAST_ACTIVE = 'cc_last_active_time';
    const STORAGE_KEY_LOGOUT_EVENT = 'cc_global_logout_signal';
    const DEVICE_ID_KEY = 'cc_device_uuid';
    const MAX_ALLOWED_DEVICES = 2; // Default 2 Devices

    let idleTimer = null;
    let warningCountdownTimer = null;
    let deviceHeartbeatUnsub = null;

    // 1. Session Persistence ensure karein
    if (window.auth) {
        window.auth.setPersistence(firebase.auth.Auth.Persistence.SESSION).catch(function () {});
    }

    // 2. Unique Device Identifier
    function getDeviceUUID() {
        let id = localStorage.getItem(DEVICE_ID_KEY);
        if (!id) {
            id = 'dev_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now();
            localStorage.setItem(DEVICE_ID_KEY, id);
        }
        return id;
    }

    // 3. Max 2 Devices Multi-Session Manager
    async function enforceMaxTwoDevices(uid) {
        if (!window.db) return;
        const currentDevId = getDeviceUUID();
        const userRef = window.db.collection('users').doc(uid);

        try {
            const snap = await userRef.get();
            let activeDevices = snap.exists && snap.data().activeDevices ? snap.data().activeDevices : [];

            // Purane sessions filter karein aur current device ko update karein
            activeDevices = activeDevices.filter(d => d.deviceId !== currentDevId);
            activeDevices.push({
                deviceId: currentDevId,
                lastSeen: Date.now(),
                userAgent: navigator.userAgent.substring(0, 50)
            });

            // Agar devices count 2 se zyada ho to sabse purane device ko drop karein
            if (activeDevices.length > MAX_ALLOWED_DEVICES) {
                activeDevices.sort((a, b) => a.lastSeen - b.lastSeen);
                activeDevices = activeDevices.slice(activeDevices.length - MAX_ALLOWED_DEVICES);
            }

            await userRef.set({ activeDevices: activeDevices }, { merge: true });

            // Firestore Realtime Listener: Agar is device ko kisi aur naye device ne list se bahar nikal diya
            if (deviceHeartbeatUnsub) deviceHeartbeatUnsub();
            deviceHeartbeatUnsub = userRef.onSnapshot(doc => {
                if (doc.exists && doc.data().activeDevices) {
                    const exists = doc.data().activeDevices.some(d => d.deviceId === currentDevId);
                    if (!exists) {
                        ccForceLogout('device_limit');
                    }
                }
            });
        } catch (e) {
            console.warn('Device manager error:', e);
        }
    }

    // 4. Activity Tracker
    function recordActivity() {
        localStorage.setItem(STORAGE_KEY_LAST_ACTIVE, Date.now().toString());
        dismissWarningModal();
    }

    // 5. Inactivity Modal & Auto-Logout
    function setupWarningModalDOM() {
        if (document.getElementById('ccIdleModal')) return;
        const modal = document.createElement('div');
        modal.id = 'ccIdleModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.65);z-index:99999;display:none;align-items:center;justify-content:center;font-family:Poppins,sans-serif;padding:20px;';
        modal.innerHTML = `
            <div style="background:#fff;border-radius:18px;max-width:380px;width:100%;padding:24px;text-align:center;box-shadow:0 12px 30px rgba(0,0,0,0.25);">
                <i class="fa-solid fa-hourglass-half" style="font-size:2.4rem;color:#DD603E;margin-bottom:12px;"></i>
                <h3 style="margin-bottom:8px;color:#1a1a1a;font-size:1.1rem;font-weight:700;">Session Expiring Soon</h3>
                <p style="font-size:.84rem;color:#6b7280;margin-bottom:16px;">Aapka session inactivity ki wajah se band hone wala hai: <b id="ccCountdownVal" style="color:#FE28AF;">60s</b></p>
                <div style="display:flex;gap:10px;">
                    <button id="ccStayLoginBtn" style="flex:1;background:linear-gradient(120deg,#9B00D2,#FE28AF);color:#fff;border:none;padding:10px 14px;border-radius:10px;font-weight:700;font-size:.84rem;cursor:pointer;">Stay Logged In</button>
                    <button id="ccLogoutNowBtn" style="flex:1;background:transparent;border:1px solid #ECECEC;color:#6b7280;padding:10px 14px;border-radius:10px;font-weight:600;font-size:.84rem;cursor:pointer;">Logout</button>
                </div>
            </div>`;
        document.body.appendChild(modal);

        document.getElementById('ccStayLoginBtn').onclick = () => recordActivity();
        document.getElementById('ccLogoutNowBtn').onclick = () => ccLogout();
    }

    function showWarningModal() {
        setupWarningModalDOM();
        const modal = document.getElementById('ccIdleModal');
        const countSpan = document.getElementById('ccCountdownVal');
        if (!modal) return;
        modal.style.display = 'flex';

        let remainingSec = 60;
        clearInterval(warningCountdownTimer);
        warningCountdownTimer = setInterval(() => {
            remainingSec--;
            if (countSpan) countSpan.textContent = remainingSec + 's';
            if (remainingSec <= 0) {
                clearInterval(warningCountdownTimer);
                ccForceLogout('timeout');
            }
        }, 1000);
    }

    function dismissWarningModal() {
        clearInterval(warningCountdownTimer);
        const modal = document.getElementById('ccIdleModal');
        if (modal) modal.style.display = 'none';
    }

    function checkIdleTime() {
        const lastActive = parseInt(localStorage.getItem(STORAGE_KEY_LAST_ACTIVE) || Date.now(), 10);
        const diff = Date.now() - lastActive;

        if (diff >= INACTIVITY_LIMIT_MS) {
            ccForceLogout('timeout');
        } else if (diff >= WARNING_TIME_MS) {
            showWarningModal();
        } else {
            dismissWarningModal();
        }
    }

    function ccForceLogout(reason) {
        clearInterval(idleTimer);
        clearInterval(warningCountdownTimer);
        localStorage.removeItem(STORAGE_KEY_LAST_ACTIVE);
        localStorage.setItem(STORAGE_KEY_LOGOUT_EVENT, Date.now().toString());

        if (window.auth && auth.currentUser) {
            auth.signOut().then(() => {
                const target = encodeURIComponent(window.location.href);
                window.location.replace(CENTRAL_LOGIN_URL + '?reason=' + reason + '&redirect=' + target);
            });
        } else {
            window.location.replace(CENTRAL_LOGIN_URL + '?reason=' + reason);
        }
    }

    // 6. Cross-Tab Synchronized Logout Listener
    window.addEventListener('storage', function (e) {
        if (e.key === STORAGE_KEY_LOGOUT_EVENT) {
            window.location.replace(CENTRAL_LOGIN_URL);
        }
        // Jab user kisi aur tab me profile pic update kare toh instant sync ho
        if (e.key === 'savedProfilePic') {
            const updatedAvatar = e.newValue || 'Web_Icon.png';
            document.querySelectorAll('[data-cc-user-avatar], #dsUserAvatar, .cc-avatar-main').forEach(el => {
                el.src = updatedAvatar;
            });
        }
    });

    // 7. Online / Offline Status Toast
    function showToastAlert(msg, isGreen) {
        let toast = document.getElementById('ccNetToast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'ccNetToast';
            toast.style.cssText = 'position:fixed;bottom:20px;left:20px;padding:10px 18px;border-radius:10px;font-size:0.8rem;font-weight:700;z-index:999999;color:#fff;box-shadow:0 8px 24px rgba(0,0,0,0.2);display:none;';
            document.body.appendChild(toast);
        }
        toast.style.background = isGreen ? '#007800' : '#DD603E';
        toast.innerHTML = (isGreen ? '<i class="fa-solid fa-wifi"></i> ' : '<i class="fa-solid fa-triangle-exclamation"></i> ') + msg;
        toast.style.display = 'block';
        setTimeout(() => { toast.style.display = 'none'; }, 3500);
    }
    window.addEventListener('offline', () => showToastAlert('Internet connection disconnect ho gaya!', false));
    window.addEventListener('online', () => showToastAlert('Internet wapas connect ho gaya ✅', true));

    // 8. Safe Unsaved Changes Guard
    let hasUnsavedChanges = false;
    document.addEventListener('input', function (e) {
        if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
            hasUnsavedChanges = true;
        }
    });
    window.addEventListener('beforeunload', function (e) {
        if (hasUnsavedChanges && !window.ccIsSubmittingForm) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    // Activity Listeners (Throttled)
    function attachListeners() {
        let isThrottled = false;
        ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart', 'click'].forEach(evt => {
            window.addEventListener(evt, () => {
                if (!isThrottled) {
                    recordActivity();
                    isThrottled = true;
                    setTimeout(() => { isThrottled = false; }, 3000);
                }
            }, { passive: true });
        });
    }

    function init() {
        if (!window.auth) return;
        window.auth.onAuthStateChanged(async function (user) {
            if (!user) {
                clearInterval(idleTimer);
                dismissWarningModal();
                const targetUrl = encodeURIComponent(window.location.href);
                window.location.replace(CENTRAL_LOGIN_URL + '?redirect=' + targetUrl);
                return;
            }

            // User logged-in
            recordActivity();
            attachListeners();
            await enforceMaxTwoDevices(user.uid);

            if (idleTimer) clearInterval(idleTimer);
            idleTimer = setInterval(checkIdleTime, 5000);

            // Universal Avatar Resolution (localStorage > Auth photoURL > Default)
            let resolvedAvatar = localStorage.getItem("savedProfilePic") || user.photoURL || 'Web_Icon.png';

            // Placeholders fill
            document.querySelectorAll('[data-cc-user-name]').forEach(el => el.textContent = user.displayName || user.email.split('@')[0]);
            document.querySelectorAll('[data-cc-user-email]').forEach(el => el.textContent = user.email || '');
            document.querySelectorAll('[data-cc-user-avatar]').forEach(el => el.src = resolvedAvatar);
            const legacyAvatar = document.getElementById('dsUserAvatar');
            if (legacyAvatar) legacyAvatar.src = resolvedAvatar;

            // Firestore se realtime customAvatar listen karein taaki kisi bhi device se update hone par dashboard sync ho jaye
            if (window.db) {
                window.db.collection('users').doc(user.uid).onSnapshot(docSnap => {
                    if (docSnap.exists) {
                        const data = docSnap.data();
                        if (data.customAvatar) {
                            localStorage.setItem("savedProfilePic", data.customAvatar);
                            document.querySelectorAll('[data-cc-user-avatar], #dsUserAvatar, .cc-avatar-main').forEach(img => {
                                img.src = data.customAvatar;
                            });
                        }
                        if (data.name) {
                            document.querySelectorAll('[data-cc-user-name]').forEach(el => el.textContent = data.name);
                        }
                    }
                }, err => {
                    console.warn("Realtime user sync error:", err);
                });
            }
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

// Global Logout
function ccLogout() {
    localStorage.removeItem('cc_last_active_time');
    localStorage.setItem('cc_global_logout_signal', Date.now().toString());
    if (window.auth) {
        window.auth.signOut().then(() => {
            window.location.href = 'auth-login.html';
        });
    }
}