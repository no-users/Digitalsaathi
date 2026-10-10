/* ===========================================================
   CLICK & CONNECT — Universal Profile Controller
   Avatar Studio, Session Radar, Security Score, Takeout Export,
   Theme Switcher, Delete Account
   =========================================================== */

/* ---------- Small helpers ---------- */
function ccEsc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, (c) => (
        { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
    ));
}
function lsGet(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
function lsSet(key, val) { try { localStorage.setItem(key, val); return true; } catch (e) { return false; } }
function lsRemove(key) { try { localStorage.removeItem(key); } catch (e) { /* ignore */ } }
function ssGet(key) { try { return sessionStorage.getItem(key); } catch (e) { return null; } }
function ssSet(key, val) { try { sessionStorage.setItem(key, val); } catch (e) { /* ignore */ } }
const UPI_RE = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9]{2,64}$/;
function ccNotifyProfileChanged() {
    try { window.dispatchEvent(new CustomEvent("cc-profile-updated")); } catch (e) { /* ignore */ }
}

/* ---------- 1. Toast Dispatcher ---------- */
function ccToast(msg, type = "info") {
    const box = document.getElementById("ccToastBox");
    if (!box) return;
    const el = document.createElement("div");
    el.className = `cc-toast ${type}`;
    const icon = document.createElement("i");
    icon.className = "fas " + (type === "success" ? "fa-circle-check" : type === "error" ? "fa-circle-exclamation" : "fa-circle-info");
    const text = document.createElement("span");
    text.textContent = msg; // textContent: Firebase error text me HTML aaye to bhi safe
    el.append(icon, text);
    box.appendChild(el);
    // .show class ke bina toast opacity:0 par hi rehta tha (dikhta hi nahi tha)
    requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add("show")));
    setTimeout(() => {
        el.classList.remove("show");
        setTimeout(() => el.remove(), 320);
    }, 3400);
}
window.ccToast = ccToast;

function ccDismissSplash() {
    document.getElementById("ccSplash")?.classList.add("hide");
}

/* ---------- 2. Confirmation modal (Promise) ---------- */
function ccPromptConfirm({ title = "Are you sure?", desc = "This action cannot be undone.", okText = "Confirm" } = {}) {
    return new Promise((resolve) => {
        const modal = document.getElementById("actionConfirmModal");
        if (!modal) { resolve(window.confirm(desc)); return; }
        document.getElementById("confirmPromptTitle").textContent = title;
        document.getElementById("confirmPromptDesc").textContent = desc;
        const okBtn = document.getElementById("confirmPromptOk");
        const cancelBtn = document.getElementById("confirmPromptCancel");
        okBtn.textContent = okText;

        const clean = (res) => {
            modal.classList.remove("is-open");
            okBtn.removeEventListener("click", onOk);
            cancelBtn.removeEventListener("click", onCancel);
            modal.removeEventListener("click", onBackdrop);
            document.removeEventListener("keydown", onKey);
            resolve(res);
        };
        const onOk = () => clean(true);
        const onCancel = () => clean(false);
        const onBackdrop = (e) => { if (e.target === modal) clean(false); };
        const onKey = (e) => { if (e.key === "Escape") clean(false); };
        okBtn.addEventListener("click", onOk);
        cancelBtn.addEventListener("click", onCancel);
        modal.addEventListener("click", onBackdrop);
        document.addEventListener("keydown", onKey);
        modal.classList.add("is-open");
        cancelBtn.focus();
    });
}

/* ---------- 3. Avatars ---------- */
const PRESET_AVATARS = [
    "https://api.dicebear.com/7.x/bottts/svg?seed=Operator1&backgroundColor=f3e6fb",
    "https://api.dicebear.com/7.x/bottts/svg?seed=Operator2&backgroundColor=e6f4e6",
    "https://api.dicebear.com/7.x/bottts/svg?seed=ProCyber&backgroundColor=ffe6f5",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=f3e6fb",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Aiden&backgroundColor=e6f4e6",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Sasha&backgroundColor=ffe6f5",
    "https://api.dicebear.com/7.x/adventurer/svg?seed=Milo&backgroundColor=fbe9e3"
];
const FALLBACK_AVATAR = "Web_Icon.png";

const SERVICE_OPTIONS = [
    "Xerox & Print", "Online Forms", "CSC Services", "Aadhaar Services", "Passport Photo",
    "Lamination", "Bill Payments", "Banking / CSP", "Travel Booking", "Govt. Certificates"
];
const ACCENT_PRESETS = ["#9B00D2", "#2563EB", "#0891B2", "#059669", "#D97706", "#E11D48", "#4F46E5"];

function paintAvatar(url) {
    document.querySelectorAll(".cc-avatar-main, #dsUserAvatar, [data-cc-user-avatar]").forEach((img) => { img.src = url; });
}

function initAvatarStudio() {
    const grid = document.getElementById("avatarPresetGrid");
    if (!grid) return;
    grid.innerHTML = "";
    PRESET_AVATARS.forEach((url, idx) => {
        const item = document.createElement("div");
        item.className = "cc-preset-avatar-item";
        item.setAttribute("role", "button");
        item.tabIndex = 0;
        item.setAttribute("aria-label", "Avatar " + (idx + 1));
        const img = document.createElement("img");
        img.src = url;
        img.alt = "Avatar " + (idx + 1);
        img.loading = "lazy";
        item.appendChild(img);
        const pick = () => window.applyChosenAvatar(url);
        item.addEventListener("click", pick);
        item.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(); } });
        grid.appendChild(item);
    });
}

window.applyChosenAvatar = async function (url) {
    const storedLocally = lsSet("savedProfilePic", url);
    paintAvatar(url);
    document.getElementById("avatarStudioModal")?.classList.remove("is-open");
    ccNotifyProfileChanged();

    const signedIn = !!(window.auth && auth.currentUser);
    const synced = await syncToFirestore({ customAvatar: url });
    if (synced) ccToast("Avatar update ho gaya!", "success");
    else if (signedIn) ccToast("Avatar is device par lag gaya, par cloud sync nahi ho paya.", "error");
    else if (storedLocally) ccToast("Avatar is device par save ho gaya.", "info");
    else ccToast("Avatar save nahi ho paya.", "error");
};

// Upload ki hui photo ko 256x256 JPEG me chhota karo.
// (Pehle 2MB tak ki raw photo base64 ban kar localStorage + Firestore me jaati thi —
//  Firestore document limit 1MB hai, isliye sync chup-chaap fail ho jata tha.)
function resizeImageFile(file, size = 256) {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement("canvas");
            canvas.width = canvas.height = size;
            const ctx = canvas.getContext("2d");
            const side = Math.min(img.width, img.height);
            ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
            URL.revokeObjectURL(url);
            resolve(canvas.toDataURL("image/jpeg", 0.85));
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Invalid image")); };
        img.src = url;
    });
}

/* ---------- 4. Firestore sync helper ---------- */
function withTimeout(promise, ms) {
    return Promise.race([
        promise,
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms))
    ]);
}

async function syncToFirestore(data) {
    if (!window.auth || !auth.currentUser || !window.db) return false;
    window.ccIsSubmittingForm = true;
    try {
        // Offline hone par Firestore set() pending rehta hai — isliye timeout, warna button atka rehta tha
        await withTimeout(db.collection("users").doc(auth.currentUser.uid).set(data, { merge: true }), 8000);
        return true;
    } catch (err) {
        console.warn("Sync error:", err);
        return false;
    } finally {
        window.ccIsSubmittingForm = false;
    }
}

/* ---------- 5. Global logout ---------- */
async function triggerGlobalLogout() {
    const sure = await ccPromptConfirm({
        title: "Sign out of account?",
        desc: "Aapka session sabhi connected tabs aur windows se instantly invalidate ho jayega.",
        okText: "Yes, Sign Out"
    });
    if (!sure) return;

    lsRemove("savedProfilePic");
    lsRemove("ccProfileData");
    lsRemove("ccShopLogo");
    lsRemove("cc_last_active_time");
    lsSet("cc_global_logout_signal", Date.now().toString());
    ccNotifyProfileChanged();

    const redirectTarget = encodeURIComponent(window.location.href);
    if (window.auth) {
        await auth.signOut().catch(() => {});
    }
    window.location.replace("auth-login.html?redirect=" + redirectTarget);
}

/* ---------- 6. Back button (open-redirect safe) ---------- */
function goBack() {
    const from = new URLSearchParams(window.location.search).get("from");
    if (from) {
        try {
            // sirf apni hi site ke page par wapas jaane do (?from=https://evil.com block)
            const target = new URL(from, window.location.href);
            if (target.origin === window.location.origin) {
                window.location.href = target.href;
                return;
            }
        } catch (e) { /* bad url — neeche fallback */ }
    }
    try {
        if (document.referrer && window.history.length > 1 &&
            new URL(document.referrer).origin === window.location.origin) {
            window.history.back();
            return;
        }
    } catch (e) { /* ignore */ }
    window.location.href = "index.html";
}
window.goBack = goBack;

/* ---------- 7. Page controller ---------- */
document.addEventListener("DOMContentLoaded", () => {
    const $ = (id) => document.getElementById(id);
    initAvatarStudio();

    // --- Services picker + unsaved-changes tracking ---
    const services = new Set();
    let savedState = "";

    function formState() {
        return JSON.stringify([
            $("inputName")?.value.trim(), $("inputPhone")?.value.trim(), $("inputShopName")?.value.trim(),
            $("inputLocation")?.value.trim(), $("inputAltEmail")?.value.trim(), $("inputHours")?.value.trim(),
            $("inputBio")?.value.trim(), [...services].sort(), $("inputUpi")?.value.trim()
        ]);
    }
    function isDirty() { return formState() !== savedState; }
    function markClean() { savedState = formState(); $("dirtyPill") && ($("dirtyPill").hidden = true); }
    function updateDirty() { const pill = $("dirtyPill"); if (pill) pill.hidden = !isDirty(); }

    function renderServices() {
        const box = $("servicesPicker");
        if (!box) return;
        box.innerHTML = "";
        // Import/purani file se aayi custom service bhi dikhe
        const all = [...SERVICE_OPTIONS, ...[...services].filter((x) => !SERVICE_OPTIONS.includes(x))];
        all.forEach((name) => {
            const b = document.createElement("button");
            b.type = "button";
            b.className = "cc-chip-opt";
            b.textContent = name;
            b.setAttribute("aria-pressed", services.has(name) ? "true" : "false");
            b.addEventListener("click", () => {
                if (services.has(name)) services.delete(name); else services.add(name);
                b.setAttribute("aria-pressed", services.has(name) ? "true" : "false");
                updateDirty();
                recalcStrength();
            });
            box.appendChild(b);
        });
    }

    // --- Cached profile se form turant bharo (Firestore aane tak khali na dikhe) ---
    try {
        const cached = JSON.parse(lsGet("ccProfileData") || "null");
        if (cached) {
            if (cached.name && $("inputName")) $("inputName").value = cached.name;
            if (cached.phone && $("inputPhone")) $("inputPhone").value = cached.phone;
            if (cached.location && $("inputLocation")) $("inputLocation").value = cached.location;
            if (cached.altEmail && $("inputAltEmail")) $("inputAltEmail").value = cached.altEmail;
            if (cached.shopName && $("inputShopName")) $("inputShopName").value = cached.shopName;
            if (cached.hours && $("inputHours")) $("inputHours").value = cached.hours;
            if (cached.upi && $("inputUpi")) $("inputUpi").value = cached.upi;
            if (Array.isArray(cached.services)) cached.services.forEach((x) => services.add(x));
            if (cached.bio && $("inputBio")) {
                $("inputBio").value = cached.bio;
                if ($("bioCount")) $("bioCount").textContent = cached.bio.length;
            }
        }
    } catch (e) { /* corrupted cache — ignore */ }
    renderServices();
    markClean();
    const cachedLogo = lsGet("ccShopLogo");
    if (cachedLogo && cachedLogo.startsWith("data:image/")) paintLogo(cachedLogo);
    paintShop();

    // --- Modals ---
    $("openAvatarModalBtn")?.addEventListener("click", () => $("avatarStudioModal")?.classList.add("is-open"));
    document.querySelectorAll("[data-dismiss-modal]").forEach((el) => {
        const close = () => document.getElementById(el.dataset.dismissModal)?.classList.remove("is-open");
        el.addEventListener("click", close);
        el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); close(); } });
    });
    const avatarModal = $("avatarStudioModal");
    avatarModal?.addEventListener("click", (e) => { if (e.target === avatarModal) avatarModal.classList.remove("is-open"); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") avatarModal?.classList.remove("is-open"); });

    // --- Custom avatar upload ---
    $("uploadAvatarBtn")?.addEventListener("click", () => $("customAvatarInput")?.click());
    $("customAvatarInput")?.addEventListener("change", async (e) => {
        const input = e.target;
        const file = input.files && input.files[0];
        input.value = ""; // same photo dobara choose ho sake
        if (!file) return;
        if (!file.type.startsWith("image/")) { ccToast("Sirf image file choose karein.", "error"); return; }
        if (file.size > 8 * 1024 * 1024) { ccToast("Image size 8MB se kam honi chahiye.", "error"); return; }
        try {
            const dataUrl = await resizeImageFile(file);
            await window.applyChosenAvatar(dataUrl);
        } catch (err) {
            ccToast("Ye image padhi nahi ja saki, doosri try karein.", "error");
        }
    });

    // --- Tabs ---
    const tabButtons = document.querySelectorAll(".cc-tab-item");
    const dockButtons = document.querySelectorAll(".cc-dock-btn[data-tab]");
    const tabPanes = document.querySelectorAll(".cc-tab-pane");
    const highlighter = $("tabHighlight");
    const tabKeys = ["tabProfile", "tabSecurity", "tabWorkspace", "tabPreferences"];

    function switchTab(tabId) {
        tabButtons.forEach((btn) => {
            const on = btn.dataset.tab === tabId;
            btn.classList.toggle("active", on);
            btn.setAttribute("aria-selected", on ? "true" : "false");
        });
        dockButtons.forEach((btn) => btn.classList.toggle("active", btn.dataset.tab === tabId));
        tabPanes.forEach((pane) => pane.classList.toggle("is-active", pane.id === tabId));
        const idx = tabKeys.indexOf(tabId);
        if (highlighter && idx !== -1) highlighter.style.transform = `translateX(${idx * 100}%)`;
        window.scrollTo({ top: 0, behavior: "smooth" });
    }
    [...tabButtons, ...dockButtons].forEach((btn) => btn.addEventListener("click", () => switchTab(btn.dataset.tab)));

    // --- Copy email ---
    $("copyEmailBtn")?.addEventListener("click", async () => {
        const email = window.auth?.currentUser?.email || "";
        if (!email) { ccToast("Pehle sign in karein.", "error"); return; }
        try {
            await navigator.clipboard.writeText(email);
            ccToast("Email copied to clipboard!", "success");
        } catch {
            ccToast("Copy nahi ho paya.", "error");
        }
    });

    // --- Link Google account ---
    $("signInHeroBtn")?.addEventListener("click", () => {
        const user = window.auth?.currentUser;
        if (!user) { ccToast("Session load ho rahi hai, thoda ruk kar try karein.", "info"); return; }
        const provider = new firebase.auth.GoogleAuthProvider();
        user.linkWithPopup(provider).then(() => {
            ccToast("Google account link ho gaya!", "success");
            setTimeout(() => window.location.reload(), 900); // toast dikhne do
        }).catch((err) => {
            ccToast(err.code === "auth/credential-already-in-use" ? "Ye Google ID kisi doosre account se linked hai." : err.message, "error");
        });
    });

    // --- Email verification mail ---
    $("verifyEmailActionBtn")?.addEventListener("click", () => {
        if (!window.auth?.currentUser) return;
        auth.currentUser.sendEmailVerification()
            .then(() => ccToast("Verification link aapke email par bhej diya gaya!", "success"))
            .catch(() => ccToast("Kuch der baad dobara koshish karein.", "error"));
    });

    // --- Validation helpers ---
    const PHONE_RE = /^[6-9]\d{9}$/;
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    const isPhoneOk = (v) => PHONE_RE.test(v);

    // --- Profile strength + security score ---
    let lastScore = null;
    let lastDevices = null;

    function recalcStrength() {
        const user = window.auth?.currentUser;
        const checks = [
            { ok: !!$("inputName")?.value.trim(), tip: "apna poora naam" },
            { ok: isPhoneOk($("inputPhone")?.value.trim() || ""), tip: "mobile number" },
            { ok: !!$("inputShopName")?.value.trim(), tip: "shop ka naam" },
            { ok: !!$("inputLocation")?.value.trim(), tip: "shop/center ki location" },
            { ok: !!$("inputBio")?.value.trim(), tip: "center headline" },
            { ok: !!lsGet("savedProfilePic"), tip: "profile avatar" },
            { ok: !!user?.emailVerified, tip: "email verification" }
        ];
        const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);
        if ($("profileMeterBar")) $("profileMeterBar").style.width = score + "%";
        if ($("profileScoreVal")) $("profileScoreVal").textContent = score + "%";

        const missing = checks.filter((c) => !c.ok).map((c) => c.tip);
        const advice = $("profileMeterAdvice");
        if (advice) {
            advice.textContent = missing.length
                ? "Abhi baaki hai: " + missing.slice(0, 3).join(", ") + (missing.length > 3 ? " …" : "") + "."
                : "Shandaar! Aapki profile 100% complete hai.";
        }

        // Confetti sirf tab jab score sach me 100% par pahunche (page kholte hi nahi)
        if (score === 100 && lastScore !== null && lastScore < 100) fireConfetti();
        lastScore = score;

        recalcSecurity();
    }

    function recalcSecurity() {
        const user = window.auth?.currentUser;
        if (!user) return;
        const googleLinked = !!user.providerData?.some((p) => p.providerId === "google.com");
        const items = [
            { pts: 40, ok: true, label: "Account sign-in protected" },
            { pts: 25, ok: !!user.emailVerified, label: user.emailVerified ? "Email verified" : "Email verify karein (+25)" },
            { pts: 15, ok: googleLinked, label: googleLinked ? "Google account linked" : "Google account link karein (+15)" },
            { pts: 10, ok: EMAIL_RE.test($("inputAltEmail")?.value.trim() || ""), label: null, okLabel: "Recovery email added", missLabel: "Recovery email add karein (+10)" },
            { pts: 10, ok: isPhoneOk($("inputPhone")?.value.trim() || ""), label: null, okLabel: "Mobile number added", missLabel: "Mobile number add karein (+10)" }
        ];
        const score = items.reduce((sum, i) => sum + (i.ok ? i.pts : 0), 0);
        if ($("securityAuditVal")) $("securityAuditVal").textContent = score + "/100";
        if ($("auditScorePill")) $("auditScorePill").textContent = `Rating: ${score} / 100`;
        const tips = $("auditTipsList");
        if (tips) {
            tips.innerHTML = items.map((i) => {
                const text = i.label || (i.ok ? i.okLabel : i.missLabel);
                const icon = i.ok
                    ? '<i class="fas fa-circle-check" style="color:var(--cc-green);"></i>'
                    : '<i class="fas fa-circle-exclamation" style="color:var(--cc-rust);"></i>';
                return `<span>${icon} ${ccEsc(text)}</span>`;
            }).join("");
        }
    }

    function fireConfetti() {
        let layer = document.querySelector(".cc-confetti-layer");
        if (!layer) {
            layer = document.createElement("div");
            layer.className = "cc-confetti-layer";
            document.body.appendChild(layer);
        }
        const colors = ["#9B00D2", "#FE28AF", "#007800", "#DD603E"];
        for (let i = 0; i < 40; i++) {
            const piece = document.createElement("span");
            piece.className = "cc-confetti-piece";
            piece.style.left = Math.random() * 100 + "vw";
            piece.style.background = colors[i % colors.length];
            piece.style.animationDelay = (Math.random() * 0.4) + "s";
            layer.appendChild(piece);
            setTimeout(() => piece.remove(), 3000);
        }
        ccToast("Profile 100% complete — great job!", "success");
    }

    // --- Profile form ---
    const profileForm = $("profileForm");
    if (profileForm) {
        const inputName = $("inputName");
        const inputPhone = $("inputPhone");
        const inputAlt = $("inputAltEmail");
        const inputBio = $("inputBio");
        const nameError = $("nameError");
        const phoneError = $("phoneError");
        const altError = $("altEmailError");

        inputBio?.addEventListener("input", () => { $("bioCount").textContent = inputBio.value.length; });
        // Phone me sirf digits
        inputPhone?.addEventListener("input", () => {
            inputPhone.value = inputPhone.value.replace(/\D/g, "").slice(0, 10);
            phoneError?.classList.remove("show");
        });
        inputName?.addEventListener("input", () => nameError?.classList.remove("show"));
        inputAlt?.addEventListener("input", () => altError?.classList.remove("show"));

        profileForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const name = inputName.value.trim();
            const phone = inputPhone.value.trim();
            const altEmail = inputAlt.value.trim();

            const nameBad = !name;
            const phoneBad = !!phone && !isPhoneOk(phone);   // phone optional hai, par bhare to sahi ho
            const altBad = !!altEmail && !EMAIL_RE.test(altEmail);
            const upi = $("inputUpi").value.trim();
            const upiBad = !!upi && !UPI_RE.test(upi);
            $("upiError")?.classList.toggle("show", upiBad);
            nameError?.classList.toggle("show", nameBad);
            phoneError?.classList.toggle("show", phoneBad);
            altError?.classList.toggle("show", altBad);
            if (nameBad || phoneBad || altBad || upiBad) {
                (nameBad ? inputName : phoneBad ? inputPhone : altBad ? inputAlt : $("inputUpi")).focus();
                return;
            }

            const data = {
                name,
                phone,
                location: $("inputLocation").value.trim(),
                altEmail,
                shopName: $("inputShopName").value.trim(),
                hours: $("inputHours").value.trim(),
                upi,
                services: [...services],
                bio: inputBio.value.trim()
            };

            const btn = $("saveProfileBtn");
            const idleHtml = '<i class="fas fa-cloud-arrow-up"></i> Save &amp; Sync Everywhere';
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

            // Cache me serverTimestamp nahi jaata (JSON me kachra ban jata tha)
            lsSet("ccProfileData", JSON.stringify(data));
            $("mainName").textContent = data.name;
            ccNotifyProfileChanged();
            markClean();

            const syncTag = $("syncStatusTag");
            syncTag?.classList.add("syncing");
            const synced = await syncToFirestore({ ...data, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
            syncTag?.classList.remove("syncing");

            btn.disabled = false;
            if (synced) {
                btn.innerHTML = '<i class="fas fa-check"></i> Saved &amp; Synced!';
                ccToast("Operator profile cloud par save ho gayi!", "success");
            } else {
                btn.innerHTML = '<i class="fas fa-triangle-exclamation"></i> Saved on this device';
                ccToast("Cloud sync nahi ho paya — internet check karke dobara Save dabayein.", "error");
            }
            recalcStrength();
            setTimeout(() => { btn.innerHTML = idleHtml; }, 2200);
        });

        // Live strength update jab user type kare
        [inputName, inputPhone, inputAlt, $("inputShopName"), $("inputLocation"), $("inputHours"), $("inputUpi"), inputBio].forEach((el) => {
            el?.addEventListener("input", () => { recalcStrength(); updateDirty(); paintShop(); drawQr(); });
            $("inputUpi")?.addEventListener("input", () => $("upiError")?.classList.remove("show"));
        });

        // Ctrl/Cmd + S se save
        document.addEventListener("keydown", (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && $("tabProfile")?.classList.contains("is-active")) {
                e.preventDefault();
                profileForm.requestSubmit ? profileForm.requestSubmit() : $("saveProfileBtn").click();
            }
        });
        // Bina save kiye page chhodne par chetavni
        window.addEventListener("beforeunload", (e) => {
            if (isDirty()) { e.preventDefault(); e.returnValue = ""; }
        });
    }

    // --- Change password ---
    $("changePasswordForm")?.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!window.auth?.currentUser) { ccToast("Session load ho rahi hai.", "info"); return; }
        const p1 = $("newPwdInput").value;
        const p2 = $("confirmPwdInput").value;
        if (p1.length < 6) { ccToast("Password kam se kam 6 characters ka rakhein.", "error"); return; }
        if (p1 !== p2) { ccToast("Passwords match nahi kar rahe!", "error"); return; }

        const btn = $("pwdUpdateBtn");
        btn.disabled = true;
        try {
            await auth.currentUser.updatePassword(p1);
            ccToast("Password successfully badal gaya!", "success");
            e.target.reset();
        } catch (err) {
            if (err.code === "auth/requires-recent-login") {
                ccToast("Security ke liye pehle dobara sign in karein, phir password badlein.", "error");
            } else {
                ccToast(err.message, "error");
            }
        } finally {
            btn.disabled = false;
        }
    });

    // --- Device list ---
    function tsToMs(t) {
        if (!t) return Date.now();
        if (typeof t.toMillis === "function") return t.toMillis(); // Firestore Timestamp
        const n = new Date(t).getTime();
        return isNaN(n) ? Date.now() : n;
    }

    function renderDeviceList(devices, currentDevId) {
        const deck = $("deviceListContainer");
        if (!deck) return;
        lastDevices = devices || [];
        if (!devices || !devices.length) {
            deck.innerHTML = '<div class="cc-empty-state">Abhi koi device record nahi mila.</div>';
            return;
        }
        deck.innerHTML = devices.map((d) => {
            const isCurrent = d.deviceId === currentDevId;
            const ua = String(d.userAgent || "Browser");
            const mobile = /Mobile|Android|iPhone/i.test(ua);
            const when = new Date(tsToMs(d.lastSeen));
            const sameDay = when.toDateString() === new Date().toDateString();
            const whenText = sameDay
                ? when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : when.toLocaleDateString([], { day: "numeric", month: "short" }) + ", " + when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            return `
            <div class="cc-device-row">
                <div class="cc-device-spec">
                    <i class="fas fa-${mobile ? "mobile-screen" : "desktop"}"></i>
                    <div>
                        <div class="cc-device-title">${isCurrent ? "This Device (Current)" : "Secondary Authorized Device"}</div>
                        <div class="cc-device-time">Active: ${ccEsc(whenText)} · ${ccEsc(ua.substring(0, 28))}</div>
                    </div>
                </div>
                <span class="cc-status-chip ${isCurrent ? "ok" : "purple"}">
                    ${isCurrent ? '<i class="fas fa-circle-check"></i> Current Device' : '<i class="fas fa-lock"></i> Session Connected'}
                </span>
            </div>`;
        }).join("");
    }

    $("revokeAllOtherSessionsBtn")?.addEventListener("click", async () => {
        const sure = await ccPromptConfirm({
            title: "Revoke other active sessions?",
            desc: "Is device ko chhodkar baki sabhi computer/mobile se session turant logout ho jayega.",
            okText: "Revoke All Other"
        });
        if (!sure) return;
        if (!window.auth?.currentUser || !window.db) { ccToast("Sign in karke dobara try karein.", "error"); return; }
        try {
            const currentDevId = lsGet("cc_device_uuid");
            const userRef = db.collection("users").doc(auth.currentUser.uid);
            const snap = await userRef.get();
            const devices = snap.exists ? (snap.data().activeDevices || []) : [];
            const filtered = devices.filter((d) => d.deviceId === currentDevId);
            await userRef.set({ activeDevices: filtered }, { merge: true });
            ccToast("Dusre sabhi devices ka session revoke kar diya gaya.", "success");
            renderDeviceList(filtered, currentDevId);
        } catch (err) {
            console.warn("Revoke error:", err);
            ccToast("Sessions revoke nahi ho paye. Thodi der baad try karein.", "error");
        }
    });

    // --- Export data (Takeout style) ---
    $("exportDataBtn")?.addEventListener("click", async () => {
        if (!window.auth?.currentUser || !window.db) { ccToast("Sign in karke dobara try karein.", "error"); return; }
        try {
            const snap = await db.collection("users").doc(auth.currentUser.uid).get();
            const exportObj = {
                accountInfo: {
                    uid: auth.currentUser.uid,
                    email: auth.currentUser.email,
                    emailVerified: auth.currentUser.emailVerified
                },
                profileData: snap.exists ? snap.data() : {},
                exportedAt: new Date().toISOString()
            };
            // Blob se download (data: URL badi file par chalti nahi)
            const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `click_connect_profile_${auth.currentUser.uid.slice(0, 6)}.json`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            ccToast("Account data JSON me download ho gaya!", "success");
        } catch (err) {
            console.warn("Export error:", err);
            ccToast("Export nahi ho paya. Thodi der baad try karein.", "error");
        }
    });

    // --- Delete account (button pehle bilkul kaam nahi karta tha) ---
    $("deleteAccountBtn")?.addEventListener("click", async () => {
        const user = window.auth?.currentUser;
        if (!user) { ccToast("Session load ho rahi hai, thoda ruk kar try karein.", "info"); return; }

        const sure = await ccPromptConfirm({
            title: "Account permanently delete karein?",
            desc: "Aapka profile data aur saare sessions hamesha ke liye hat jayenge. Ye wapas nahi ho sakta.",
            okText: "Haan, Delete Karo"
        });
        if (!sure) return;

        const btn = $("deleteAccountBtn");
        btn.disabled = true;
        try {
            // Firebase delete ke liye haal hi ka sign-in chahiye (~5 min). Pehle hi check, taaki data aadha delete na ho.
            const lastSignIn = Date.parse(user.metadata?.lastSignInTime || "") || 0;
            const recent = Date.now() - lastSignIn < 4 * 60 * 1000;
            if (!recent) {
                const googleLinked = user.providerData?.some((p) => p.providerId === "google.com");
                if (googleLinked) {
                    await user.reauthenticateWithPopup(new firebase.auth.GoogleAuthProvider());
                } else {
                    ccToast("Security ke liye pehle Sign Out karke dobara sign in karein, phir account delete karein.", "error");
                    return;
                }
            }
            if (window.db) await db.collection("users").doc(user.uid).delete();
            await user.delete();

            ["savedProfilePic", "ccProfileData", "ccShopLogo", "cc_last_active_time", "cc_device_uuid"].forEach(lsRemove);
            lsSet("cc_global_logout_signal", Date.now().toString());
            ccNotifyProfileChanged();
            ccToast("Account delete ho gaya.", "success");
            setTimeout(() => window.location.replace("auth-login.html"), 1200);
        } catch (err) {
            console.warn("Delete account error:", err);
            if (err.code === "auth/requires-recent-login" || err.code === "auth/user-token-expired") {
                ccToast("Security ke liye pehle Sign Out karke dobara sign in karein, phir delete karein.", "error");
            } else if (err.code === "auth/popup-closed-by-user") {
                ccToast("Delete cancel ho gaya.", "info");
            } else {
                ccToast(err.message || "Account delete nahi ho paya.", "error");
            }
        } finally {
            btn.disabled = false;
        }
    });

    // --- Sign out ---
    $("globalLogoutBtn")?.addEventListener("click", (e) => {
        e.preventDefault();
        triggerGlobalLogout();
    });

    // --- Theme: dropdown + quick button (moon button ka koi handler hi nahi tha) ---
    const THEME_ICONS = { "default": "fa-circle-half-stroke", "dark": "fa-moon", "neon": "fa-bolt", "glass": "fa-gem", "light": "fa-sun", "auto": "fa-desktop" };
    function syncThemeUi() {
        const name = window.getGlobalTheme ? window.getGlobalTheme() : "default";
        const labels = window.CC_THEME_LABELS || {};
        const sel = $("globalThemeSelector");
        if (sel && sel.value !== name) sel.value = name;
        const btn = $("quickThemeBtn");
        if (btn) {
            btn.innerHTML = `<i class="fas ${THEME_ICONS[name] || "fa-moon"}"></i>`;
            btn.title = `Theme: ${labels[name] || name} (click to switch)`;
        }
    }
    $("globalThemeSelector")?.addEventListener("change", (e) => window.changeGlobalTheme?.(e.target.value));
    $("quickThemeBtn")?.addEventListener("click", () => {
        if (!window.cycleGlobalTheme) { ccToast("Theme load nahi hui.", "error"); return; }
        const name = window.cycleGlobalTheme();
        ccToast("Theme: " + ((window.CC_THEME_LABELS || {})[name] || name), "info");
    });
    window.addEventListener("cc-theme-change", (e) => {
        syncThemeUi();
        syncToFirestore({ theme: e.detail?.theme || "default" }); // dusre device par bhi wahi theme
    });
    syncThemeUi();

    // --- Online / offline indicator ---
    function paintNetwork() {
        const tag = $("syncStatusTag");
        const txt = $("syncStatusText");
        const offline = !navigator.onLine;
        tag?.classList.toggle("offline", offline);
        if (txt) txt.textContent = offline ? "Offline" : "Cloud Connected";
    }
    window.addEventListener("online", paintNetwork);
    window.addEventListener("offline", paintNetwork);
    paintNetwork();

    // --- Avatar 3D tilt (CSS me comment tha, JS missing tha) ---
    const avatarBox = document.querySelector(".cc-avatar-container");
    const avatarImg = document.querySelector(".cc-avatar-main");
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (avatarBox && avatarImg && !reduceMotion && window.matchMedia("(hover: hover)").matches) {
        avatarBox.addEventListener("mousemove", (e) => {
            const r = avatarBox.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            avatarImg.style.transform = `rotateY(${x * 18}deg) rotateX(${-y * 18}deg)`;
        });
        avatarBox.addEventListener("mouseleave", () => { avatarImg.style.transform = ""; });
    }

    // --- Hero: shop name ---
    function paintShop() {
        const el = $("mainShop");
        if (!el) return;
        const name = $("inputShopName")?.value.trim() || "";
        el.hidden = !name;
        const span = el.querySelector("span");
        if (span) span.textContent = name;
    }

    // --- Shop logo (receipt par print karne ke liye; localStorage "ccShopLogo" se bill.html padh sakta hai) ---
    function paintLogo(url) {
        const box = $("shopLogoPreview");
        if (!box) return;
        box.innerHTML = "";
        if (url) {
            const img = document.createElement("img");
            img.alt = "Shop logo";
            img.src = url;
            box.appendChild(img);
        } else {
            box.innerHTML = '<i class="fas fa-store"></i>';
        }
        if ($("removeLogoBtn")) $("removeLogoBtn").hidden = !url;
    }
    function logoFromFile(file, size = 192) {
        return new Promise((resolve, reject) => {
            const url = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(size / img.width, size / img.height, 1);
                const w = Math.max(1, Math.round(img.width * scale)), h = Math.max(1, Math.round(img.height * scale));
                const c = document.createElement("canvas");
                c.width = w; c.height = h;
                c.getContext("2d").drawImage(img, 0, 0, w, h);
                URL.revokeObjectURL(url);
                let out = c.toDataURL("image/png");
                if (out.length > 180000) { // PNG bhari ho to JPEG (white bg) — Firestore 1MB limit se door rahein
                    const j = document.createElement("canvas"); j.width = w; j.height = h;
                    const jc = j.getContext("2d"); jc.fillStyle = "#fff"; jc.fillRect(0, 0, w, h); jc.drawImage(img, 0, 0, w, h);
                    out = j.toDataURL("image/jpeg", 0.85);
                }
                resolve(out);
            };
            img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("bad image")); };
            img.src = url;
        });
    }
    $("uploadLogoBtn")?.addEventListener("click", () => $("shopLogoInput")?.click());
    $("shopLogoInput")?.addEventListener("change", async (e) => {
        const input = e.target;
        const file = input.files && input.files[0];
        input.value = "";
        if (!file) return;
        if (!file.type.startsWith("image/")) { ccToast("Sirf image file choose karein.", "error"); return; }
        if (file.size > 8 * 1024 * 1024) { ccToast("Image 8MB se kam honi chahiye.", "error"); return; }
        try {
            const dataUrl = await logoFromFile(file);
            lsSet("ccShopLogo", dataUrl);
            paintLogo(dataUrl);
            drawQr();
            ccNotifyProfileChanged();
            const ok = await syncToFirestore({ shopLogo: dataUrl });
            ccToast(ok ? "Shop logo save ho gaya!" : "Logo is device par lag gaya, cloud sync nahi ho paya.", ok ? "success" : "error");
        } catch (err) {
            ccToast("Ye image padhi nahi ja saki, doosri try karein.", "error");
        }
    });
    $("removeLogoBtn")?.addEventListener("click", async () => {
        lsRemove("ccShopLogo");
        paintLogo("");
        ccNotifyProfileChanged();
        await syncToFirestore({ shopLogo: "" });
        ccToast("Shop logo hata diya.", "info");
    });

    // --- Share & Payment QR ---
    let qrMode = "upi";
    const vEsc = (v) => String(v || "").replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/([,;])/g, "\\$1");

    function qrPayload() {
        const name = $("inputName")?.value.trim() || "";
        const shop = $("inputShopName")?.value.trim() || "";
        const phone = $("inputPhone")?.value.trim() || "";
        const email = window.auth?.currentUser?.email || $("inputAltEmail")?.value.trim() || "";
        if (qrMode === "upi") {
            const upi = $("inputUpi")?.value.trim() || "";
            if (!upi) return { err: "Pehle upar apni UPI ID bharein (jaise name@okaxis)." };
            if (!UPI_RE.test(upi)) return { err: "UPI ID ka format galat hai — name@bank likhein." };
            const amt = parseFloat($("qrAmount")?.value);
            let text = "upi://pay?pa=" + upi + "&pn=" + encodeURIComponent(shop || name || "Merchant") + "&cu=INR";
            if (amt > 0 && amt <= 100000) text += "&am=" + amt.toFixed(2);
            return { text, title: shop || name || "Pay via UPI", line1: "Scan & pay with any UPI app", line2: upi + (amt > 0 ? "  ·  ₹" + amt.toFixed(2).replace(/\.00$/, "") : "") };
        }
        if (!name && !shop) return { err: "Contact card ke liye naam ya shop ka naam bharein." };
        const lines = ["BEGIN:VCARD", "VERSION:3.0", "FN:" + vEsc(name || shop)];
        if (shop) lines.push("ORG:" + vEsc(shop));
        if (phone) lines.push("TEL;TYPE=CELL:+91" + phone);
        if (email) lines.push("EMAIL:" + vEsc(email));
        const loc = $("inputLocation")?.value.trim();
        if (loc) lines.push("ADR;TYPE=WORK:;;" + vEsc(loc) + ";;;;");
        const notes = [$("inputHours")?.value.trim() && "Hours: " + $("inputHours").value.trim(), services.size && "Services: " + [...services].join(", ")].filter(Boolean).join(" | ");
        if (notes) lines.push("NOTE:" + vEsc(notes));
        lines.push("END:VCARD");
        return { text: lines.join("\n"), title: shop || name, line1: "Scan to save contact", line2: phone ? "+91 " + phone : "" };
    }

    function fitText(ctx, text, maxW, px, weight) {
        let size = px;
        do { ctx.font = `${weight} ${size}px "Plus Jakarta Sans", system-ui, sans-serif`; size -= 1; } while (ctx.measureText(text).width > maxW && size > 10);
        return text;
    }

    function drawQr() {
        const canvas = $("qrCanvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const W = canvas.width, H = canvas.height;
        const accent = (getComputedStyle(document.body).getPropertyValue("--cc-purple") || "").trim() || "#9B00D2";
        ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, W, H);
        ctx.fillStyle = accent; ctx.fillRect(0, 0, W, 8);
        ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";

        const hint = $("qrHint");
        const payload = qrPayload();
        $("qrAmountGroup") && ($("qrAmountGroup").hidden = qrMode !== "upi");
        if (payload.err) {
            if (hint) { hint.textContent = payload.err; hint.classList.add("warn"); }
            ctx.fillStyle = "#94a3b8"; ctx.font = '600 16px system-ui, sans-serif';
            ctx.fillText("QR yahan dikhega", W / 2, H / 2);
            return;
        }
        if (hint) {
            hint.classList.remove("warn");
            hint.textContent = qrMode === "upi"
                ? "Is QR ko counter par lagayein. Amount bharenge to har scan par wahi amount aayega."
                : "Customer scan karke aapka naam, number aur shop ki detail phone me save kar sakta hai.";
        }
        let qr;
        try { qr = window.ccQR.create(payload.text, "M"); }
        catch (e) { if (hint) { hint.textContent = "QR ban nahi paya — detail thodi chhoti karein."; hint.classList.add("warn"); } return; }

        ctx.fillStyle = "#111827";
        fitText(ctx, payload.title, W - 48, 22, 800);
        ctx.fillText(payload.title, W / 2, 46);

        const area = 296, cell = Math.floor(area / qr.size), size = cell * qr.size;
        const x0 = Math.round((W - size) / 2), y0 = 66;
        for (let r = 0; r < qr.size; r++) for (let c = 0; c < qr.size; c++) {
            if (qr.isDark(r, c)) ctx.fillRect(x0 + c * cell, y0 + r * cell, cell, cell);
        }
        ctx.fillStyle = "#374151";
        fitText(ctx, payload.line1, W - 48, 15, 700);
        ctx.fillText(payload.line1, W / 2, y0 + size + 34);
        if (payload.line2) {
            ctx.fillStyle = "#6b7280";
            fitText(ctx, payload.line2, W - 48, 13, 600);
            ctx.fillText(payload.line2, W / 2, y0 + size + 58);
        }
        ctx.fillStyle = "#9ca3af"; ctx.font = '600 10px system-ui, sans-serif';
        ctx.fillText("Click & Connect", W / 2, H - 14);
    }

    function qrBlob() {
        return new Promise((resolve) => $("qrCanvas").toBlob(resolve, "image/png"));
    }
    function qrReady() {
        if (qrPayload().err) { ccToast("Pehle QR ki detail poori bharein.", "error"); return false; }
        return true;
    }
    document.querySelectorAll(".cc-seg-btn[data-qr]").forEach((btn) => {
        btn.addEventListener("click", () => {
            qrMode = btn.dataset.qr;
            document.querySelectorAll(".cc-seg-btn[data-qr]").forEach((b) => {
                b.classList.toggle("active", b === btn);
                b.setAttribute("aria-selected", b === btn ? "true" : "false");
            });
            drawQr();
        });
    });
    $("qrAmount")?.addEventListener("input", drawQr);
    $("qrDownloadBtn")?.addEventListener("click", async () => {
        if (!qrReady()) return;
        const blob = await qrBlob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const slug = ($("inputShopName")?.value.trim() || $("inputName")?.value.trim() || "qr").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "qr";
        a.href = url; a.download = `${qrMode === "upi" ? "payment" : "contact"}-qr-${slug}.png`;
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        ccToast("QR download ho gaya!", "success");
    });
    $("qrPrintBtn")?.addEventListener("click", () => {
        if (!qrReady()) return;
        const url = $("qrCanvas").toDataURL("image/png");
        const w = window.open("", "_blank");
        if (!w) { ccToast("Popup block hai — Download karke print karein.", "error"); return; }
        w.document.write(`<!doctype html><title>QR</title><body style="margin:0;display:flex;justify-content:center;padding:24px"><img src="${url}" style="width:360px;max-width:100%" onload="setTimeout(function(){window.print()},250)">`);
        w.document.close();
    });
    const shareBtn = $("qrShareBtn");
    if (shareBtn && navigator.canShare && navigator.share) {
        try {
            if (navigator.canShare({ files: [new File([""], "x.png", { type: "image/png" })] })) shareBtn.hidden = false;
        } catch (e) { /* share nahi chalega */ }
        shareBtn.addEventListener("click", async () => {
            if (!qrReady()) return;
            try {
                const blob = await qrBlob();
                await navigator.share({ files: [new File([blob], "qr.png", { type: "image/png" })], title: $("inputShopName")?.value.trim() || "QR" });
            } catch (e) { /* user ne cancel kiya */ }
        });
    }
    window.addEventListener("cc-theme-change", () => setTimeout(drawQr, 50));
    window.addEventListener("cc-accent-change", () => setTimeout(drawQr, 50));
    drawQr();

    // --- Login activity ---
    let loginHistory = [];
    function deviceLabel() {
        const ua = navigator.userAgent;
        const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Browser";
        const os = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "Device";
        return browser + " on " + os;
    }
    function loginDevId() {
        let id = lsGet("cc_login_dev");
        if (!id) { id = "d" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36); lsSet("cc_login_dev", id); }
        return id;
    }
    function renderLoginHistory() {
        const box = $("loginHistoryList");
        if (!box) return;
        if (!loginHistory.length) { box.innerHTML = '<div class="cc-empty-state">Abhi koi login activity record nahi hui.</div>'; return; }
        const me = loginDevId();
        box.innerHTML = [...loginHistory].reverse().map((e) => {
            const when = new Date(e.t);
            const text = when.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" }) + ", " + when.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            const mine = e.id === me;
            return `
            <div class="cc-device-row">
                <div class="cc-device-spec">
                    <i class="fas fa-${e.mobile ? "mobile-screen" : "desktop"}"></i>
                    <div>
                        <div class="cc-device-title">${ccEsc(String(e.label || "Browser").slice(0, 40))}</div>
                        <div class="cc-device-time">${ccEsc(text)}</div>
                    </div>
                </div>
                <span class="cc-status-chip ${mine ? "ok" : "purple"}">${mine ? '<i class="fas fa-circle-check"></i> This device' : '<i class="fas fa-clock-rotate-left"></i> Earlier'}</span>
            </div>`;
        }).join("");
    }
    $("clearLoginHistoryBtn")?.addEventListener("click", async () => {
        const sure = await ccPromptConfirm({ title: "Login history clear karein?", desc: "Purani login activity ki list hat jayegi. Aapka account aur data safe rahega.", okText: "Clear Karo" });
        if (!sure) return;
        loginHistory = [];
        renderLoginHistory();
        await syncToFirestore({ loginHistory: [] });
        ccToast("Login history clear ho gayi.", "success");
    });

    // --- UID copy ---
    $("agentCodeTag")?.addEventListener("click", async () => {
        const uid = window.auth?.currentUser?.uid;
        if (!uid) return;
        try { await navigator.clipboard.writeText(uid); ccToast("UID copy ho gaya!", "success"); }
        catch { ccToast("Copy nahi ho paya.", "error"); }
    });

    // --- Password strength meter ---
    const pwdInput = $("newPwdInput");
    pwdInput?.addEventListener("input", () => {
        const v = pwdInput.value;
        let pts = 0;
        if (v.length >= 6) pts++;
        if (v.length >= 10) pts++;
        if (/[a-z]/.test(v) && /[A-Z]/.test(v)) pts++;
        if (/\d/.test(v)) pts++;
        if (/[^A-Za-z0-9]/.test(v)) pts++;
        const levels = [
            { w: 0, c: "transparent", t: "Password ki strength yahan dikhegi" },
            { w: 25, c: "var(--cc-rust)", t: "Weak — lamba aur mix karke banayein" },
            { w: 50, c: "var(--cc-rust)", t: "Okay — numbers/symbols jodein" },
            { w: 75, c: "var(--cc-purple)", t: "Good" },
            { w: 100, c: "var(--cc-green)", t: "Strong" }
        ];
        const lv = !v ? levels[0] : levels[Math.min(4, Math.max(1, pts - (v.length < 6 ? 1 : 0)))];
        const bar = $("pwdMeterBar");
        if (bar) { bar.style.width = lv.w + "%"; bar.style.background = lv.c; }
        if ($("pwdMeterText")) $("pwdMeterText").textContent = lv.t;
    });
    $("changePasswordForm")?.addEventListener("reset", () => setTimeout(() => pwdInput?.dispatchEvent(new Event("input")), 0));

    // --- Accent colour swatches (saare pages par lagu) ---
    function syncAccentUi() {
        const cur = (window.getAccent?.() || "").toLowerCase();
        document.querySelectorAll("#accentSwatches .cc-swatch[data-color]").forEach((b) => {
            b.setAttribute("aria-pressed", b.dataset.color.toLowerCase() === cur ? "true" : "false");
        });
        const reset = $("accentResetBtn");
        if (reset) reset.setAttribute("aria-pressed", cur ? "false" : "true");
    }
    (function buildAccentPicker() {
        const row = $("accentSwatches");
        if (!row) return;
        const reset = document.createElement("button");
        reset.type = "button"; reset.id = "accentResetBtn";
        reset.className = "cc-swatch cc-swatch-reset"; reset.textContent = "Default";
        reset.addEventListener("click", () => window.changeAccent?.(null));
        row.appendChild(reset);
        ACCENT_PRESETS.forEach((hex) => {
            const b = document.createElement("button");
            b.type = "button"; b.className = "cc-swatch"; b.dataset.color = hex;
            b.style.background = hex; b.setAttribute("aria-label", "Accent " + hex);
            b.addEventListener("click", () => window.changeAccent?.(hex));
            row.appendChild(b);
        });
        const custom = document.createElement("label");
        custom.className = "cc-swatch cc-swatch-custom"; custom.title = "Apna rang chunein";
        const picker = document.createElement("input");
        picker.type = "color"; picker.value = window.getAccent?.() || "#9b00d2"; picker.setAttribute("aria-label", "Custom accent colour");
        picker.addEventListener("input", () => window.changeAccent?.(picker.value));
        custom.appendChild(picker);
        row.appendChild(custom);
        syncAccentUi();
    })();
    window.addEventListener("cc-accent-change", (e) => {
        syncAccentUi();
        syncToFirestore({ accent: e.detail?.accent || "" });
    });

    // --- Import / restore (pehle export ki hui JSON se) ---
    $("importDataBtn")?.addEventListener("click", () => $("importDataInput")?.click());
    $("importDataInput")?.addEventListener("change", async (e) => {
        const input = e.target;
        const file = input.files && input.files[0];
        input.value = "";
        if (!file) return;
        if (file.size > 1024 * 1024) { ccToast("File bahut badi hai (max 1MB).", "error"); return; }
        try {
            const obj = JSON.parse(await file.text());
            const src = obj && typeof obj === "object" ? (obj.profileData || obj) : null;
            if (!src) throw new Error("bad");
            const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
            const fields = {
                inputName: str(src.name, 60), inputShopName: str(src.shopName, 60),
                inputLocation: str(src.location, 80), inputHours: str(src.hours, 40),
                inputBio: str(src.bio, 90)
            };
            const phone = str(src.phone, 20).replace(/\D/g, "").slice(0, 10);
            const alt = str(src.altEmail, 100);
            let filled = 0;
            Object.entries(fields).forEach(([id, v]) => { if (v && $(id)) { $(id).value = v; filled++; } });
            if (isPhoneOk(phone)) { $("inputPhone").value = phone; filled++; }
            if (EMAIL_RE.test(alt)) { $("inputAltEmail").value = alt; filled++; }
            const upiIn = str(src.upi, 60);
            if (UPI_RE.test(upiIn)) { $("inputUpi").value = upiIn; filled++; }
            if (Array.isArray(src.services)) {
                services.clear();
                src.services.slice(0, 20).forEach((x) => { const t = str(x, 30); if (t) services.add(t); });
                renderServices(); filled++;
            }
            if ($("bioCount")) $("bioCount").textContent = $("inputBio").value.length;
            if (!filled) { ccToast("Is file me profile data nahi mila.", "error"); return; }
            updateDirty(); recalcStrength(); paintShop(); drawQr();
            switchTab("tabProfile");
            ccToast("Data form me bhar diya — check karke Save dabayein.", "success");
        } catch (err) {
            ccToast("Ye valid export file nahi lagti.", "error");
        }
    });

    // --- Auth observer ---
    if (window.auth) {
        auth.onAuthStateChanged(async (user) => {
            if (!user) return; // redirect auth-guard.js sambhalta hai
            ccDismissSplash();

            const emailText = user.email || "";
            const fallbackName = user.displayName || (emailText ? emailText.split("@")[0] : "Operator");
            if ($("mainName")) $("mainName").textContent = lsCachedName() || fallbackName;
            if ($("mainEmailText")) $("mainEmailText").textContent = emailText || "No email on this account";
            if ($("agentCodeTag")) $("agentCodeTag").textContent = "UID: " + user.uid.slice(0, 8).toUpperCase();
            const fmtDate = (v, opts) => { const t = Date.parse(v || ""); return isNaN(t) ? "" : new Date(t).toLocaleDateString([], opts); };
            const since = fmtDate(user.metadata?.creationTime, { month: "short", year: "numeric" });
            const last = fmtDate(user.metadata?.lastSignInTime, { day: "numeric", month: "short" });
            if (since && $("memberSinceChip")) { $("memberSinceChip").hidden = false; $("memberSinceChip").querySelector("span").textContent = "Member since " + since; }
            if (last && $("lastSignInChip")) { $("lastSignInChip").hidden = false; $("lastSignInChip").querySelector("span").textContent = "Last sign-in " + last; }

            // Password tile
            const hasPasswordProvider = user.providerData && user.providerData.some((p) => p.providerId === "password");
            const pwdForm = $("changePasswordForm");
            const googleOnlyNote = $("googleOnlyNote");
            if (pwdForm && googleOnlyNote) {
                pwdForm.style.display = hasPasswordProvider ? "block" : "none";
                googleOnlyNote.style.display = hasPasswordProvider ? "none" : "flex";
            }

            // Email verification
            const vBadge = $("emailVerifyBadge");
            const vBtn = $("verifyEmailActionBtn");
            if (user.emailVerified) {
                if (vBadge) { vBadge.className = "cc-verify-pill"; vBadge.innerHTML = '<i class="fas fa-circle-check"></i> Verified Email'; }
                if (vBtn) vBtn.style.display = "none";
            } else {
                if (vBadge) { vBadge.className = "cc-verify-pill unverified"; vBadge.innerHTML = '<i class="fas fa-circle-exclamation"></i> Unverified'; }
                if (vBtn) vBtn.style.display = emailText ? "inline-flex" : "none";
            }

            // Google link button
            const isGoogleLinked = user.providerData && user.providerData.some((p) => p.providerId === "google.com");
            const gBtn = $("signInHeroBtn");
            if (gBtn) gBtn.style.display = isGoogleLinked ? "none" : "inline-flex";

            // Avatar
            paintAvatar(lsGet("savedProfilePic") || user.photoURL || PRESET_AVATARS[0]);

            // Firestore data
            if (!window.db) {
                renderDeviceList([], lsGet("cc_device_uuid"));
                renderLoginHistory();
            } else {
                try {
                    const doc = await db.collection("users").doc(user.uid).get();
                    const d = doc.exists ? doc.data() : {};
                    if (d.name && $("inputName")) $("inputName").value = d.name;
                    if (d.phone && $("inputPhone")) $("inputPhone").value = d.phone;
                    if (d.location && $("inputLocation")) $("inputLocation").value = d.location;
                    if (d.altEmail && $("inputAltEmail")) $("inputAltEmail").value = d.altEmail;
                    if (d.bio && $("inputBio")) {
                        $("inputBio").value = d.bio;
                        if ($("bioCount")) $("bioCount").textContent = d.bio.length;
                    }
                    if (d.shopName && $("inputShopName")) $("inputShopName").value = d.shopName;
                    if (d.hours && $("inputHours")) $("inputHours").value = d.hours;
                    if (d.upi && $("inputUpi")) $("inputUpi").value = d.upi;
                    if (typeof d.shopLogo === "string" && d.shopLogo.startsWith("data:image/")) { lsSet("ccShopLogo", d.shopLogo); paintLogo(d.shopLogo); }
                    else if (d.shopLogo === "") { lsRemove("ccShopLogo"); paintLogo(""); }
                    if (Array.isArray(d.services)) { services.clear(); d.services.forEach((x) => services.add(String(x))); renderServices(); }
                    markClean();
                    paintShop(); drawQr();
                    if (d.accent && !window.getAccent?.() && window.changeAccent) { window.changeAccent(d.accent); syncAccentUi(); }
                    // Saved naam hero me bhi dikhao (pehle sirf displayName dikhta tha)
                    if (d.name && $("mainName")) $("mainName").textContent = d.name;
                    if (d.name || d.phone || d.location || d.altEmail || d.bio || d.shopName) {
                        lsSet("ccProfileData", JSON.stringify({
                            name: d.name || "", phone: d.phone || "", location: d.location || "",
                            altEmail: d.altEmail || "", bio: d.bio || "",
                            shopName: d.shopName || "", hours: d.hours || "", upi: d.upi || "", services: Array.isArray(d.services) ? d.services : []
                        }));
                    }
                    if (d.customAvatar) {
                        lsSet("savedProfilePic", d.customAvatar);
                        paintAvatar(d.customAvatar);
                    }
                    if (d.role && $("roleBadge")) $("roleBadge").textContent = String(d.role).toUpperCase();
                    // Dusre device par chuni hui theme yahan bhi laagu karo (is device par koi choice nahi hui ho to)
                    if (d.theme && !lsGet("selectedSupremeTheme") && window.changeGlobalTheme) {
                        window.changeGlobalTheme(d.theme);
                    }
                    // Devices — pehle agar activeDevices na ho to spinner hamesha ghoomta rehta tha
                    renderDeviceList(d.activeDevices || [], lsGet("cc_device_uuid"));

                    // Login activity: is browser session ka sign-in ek baar record karo
                    loginHistory = Array.isArray(d.loginHistory) ? d.loginHistory.filter((x) => x && typeof x.t === "number").slice(-10) : [];
                    if (!ssGet("ccLoginLogged")) {
                        loginHistory = [...loginHistory, { t: Date.now(), label: deviceLabel(), mobile: /Mobile|Android|iPhone/i.test(navigator.userAgent), id: loginDevId() }].slice(-10);
                        ssSet("ccLoginLogged", "1");
                        syncToFirestore({ loginHistory });
                    }
                    renderLoginHistory();
                    ccNotifyProfileChanged();
                } catch (e) {
                    console.warn("Firestore fetch error:", e);
                    renderDeviceList([], lsGet("cc_device_uuid"));
                    renderLoginHistory();
                    ccToast("Profile data load nahi ho paya. Internet check karein.", "error");
                }
            }

            recalcStrength();
        });
    }

    function lsCachedName() {
        try { return (JSON.parse(lsGet("ccProfileData") || "null") || {}).name || ""; } catch (e) { return ""; }
    }

    // Slow internet: 4 second baad splash hata do
    setTimeout(ccDismissSplash, 4000);
});
