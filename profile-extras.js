/* ===========================================================
   CLICK & CONNECT — Profile extras
   1. Receipt Header Preview (live)
   2. Business Share Card (PNG / Share / WhatsApp / Copy)

   Ye file user-profile.js ke baad load hoti hai aur sirf DOM + localStorage se kaam
   karti hai (user-profile.js ke andar ghusti nahi), isliye dono alag-alag safe rehti hain.
   Zaroorat: qr-lib.js (window.ccQR) — UPI QR ke liye.
   =========================================================== */
(function () {
    "use strict";
    var $ = function (id) { return document.getElementById(id); };
    var UPI_RE = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z][a-zA-Z0-9]{2,64}$/;

    function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function val(id) { var el = $(id); return el ? el.value.trim() : ""; }
    function services() {
        return Array.prototype.map.call(
            document.querySelectorAll("#servicesPicker .cc-chip-opt[aria-pressed='true']"),
            function (b) { return b.textContent.trim(); }
        );
    }
    function accent() {
        var v = getComputedStyle(document.body).getPropertyValue("--cc-purple");
        return (v && v.trim()) || "#9B00D2";
    }
    function data() {
        var shop = val("inputShopName");
        var name = val("inputName");
        var logo = lsGet("ccShopLogo") || "";
        return {
            title: shop || name || "Your Shop Name",
            owner: shop ? name : "",
            bio: val("inputBio"),
            phone: val("inputPhone"),
            location: val("inputLocation"),
            hours: val("inputHours"),
            upi: UPI_RE.test(val("inputUpi")) ? val("inputUpi") : "",
            services: services(),
            logo: logo.indexOf("data:image/") === 0 ? logo : ""
        };
    }

    /* ---------- 1. Receipt preview ---------- */
    function el(tag, cls, text) {
        var n = document.createElement(tag);
        if (cls) n.className = cls;
        if (text != null) n.textContent = text;
        return n;
    }

    function renderReceipt() {
        var box = $("receiptPreview");
        if (!box) return;
        var d = data();
        box.textContent = "";
        if (d.logo) {
            var img = el("img", "cc-rc-logo");
            img.alt = "";
            img.src = d.logo;
            box.appendChild(img);
        }
        box.appendChild(el("div", "cc-rc-name", d.title));
        if (d.bio) box.appendChild(el("div", "cc-rc-bio", d.bio));
        var contact = [d.location, d.phone ? "Ph: " + d.phone : ""].filter(Boolean).join("  |  ");
        if (contact) box.appendChild(el("div", "cc-rc-line", contact));
        if (d.hours) box.appendChild(el("div", "cc-rc-line", "Open: " + d.hours));
        if (d.services.length) box.appendChild(el("div", "cc-rc-services", d.services.join("  •  ")));
        box.appendChild(el("hr", "cc-rc-divider"));
        [["Xerox (10 pages)", "₹20"], ["Online form", "₹50"]].forEach(function (row) {
            var r = el("div", "cc-rc-sample");
            r.appendChild(el("span", "", row[0]));
            r.appendChild(el("span", "", row[1]));
            box.appendChild(r);
        });
        var tot = el("div", "cc-rc-sample");
        tot.style.fontWeight = "800";
        tot.style.marginTop = "4px";
        tot.appendChild(el("span", "", "TOTAL"));
        tot.appendChild(el("span", "", "₹70"));
        box.appendChild(tot);
        if (d.upi) box.appendChild(el("div", "cc-rc-thanks", "Pay via UPI: " + d.upi));
        box.appendChild(el("div", "cc-rc-thanks", "Thank you! Visit again 🙏"));
    }

    /* ---------- 2. Share card (canvas) ---------- */
    function fit(ctx, text, maxW, px, weight) {
        var size = px;
        do {
            ctx.font = weight + " " + size + 'px "Plus Jakarta Sans", system-ui, sans-serif';
            size -= 2;
        } while (ctx.measureText(text).width > maxW && size > 16);
    }

    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
    }

    function shade(hex, f) {
        var m = /^#?([0-9a-f]{6})$/i.exec(hex);
        if (!m) return hex;
        var n = parseInt(m[1], 16);
        var c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(function (v) { return Math.max(0, Math.min(255, Math.round(v * f))); });
        return "rgb(" + c.join(",") + ")";
    }

    function drawLogo(ctx, src, cx, cy, r, done) {
        ctx.save();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
        if (!src) { ctx.restore(); done(false); return; }
        var img = new Image();
        img.onload = function () {
            ctx.beginPath(); ctx.arc(cx, cy, r - 6, 0, Math.PI * 2); ctx.clip();
            var s = Math.min((r * 2 - 28) / img.width, (r * 2 - 28) / img.height);
            var w = img.width * s, h = img.height * s;
            ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
            ctx.restore(); done(true);
        };
        img.onerror = function () { ctx.restore(); done(false); };
        img.src = src;
    }

    var drawToken = 0;
    function drawShareCard() {
        var canvas = $("shareCardCanvas");
        if (!canvas) return;
        var token = ++drawToken;
        var d = data();
        var ctx = canvas.getContext("2d");
        var W = canvas.width, H = canvas.height;
        var ac = accent();

        // background
        ctx.fillStyle = "#f4f2f9"; ctx.fillRect(0, 0, W, H);
        // header
        var g = ctx.createLinearGradient(0, 0, W, 520);
        g.addColorStop(0, ac); g.addColorStop(1, shade(ac, 0.62));
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, 520);
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        ctx.beginPath(); ctx.arc(W - 80, 60, 220, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(80, 470, 150, 0, Math.PI * 2); ctx.fill();

        ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
        var drawRest = function (hasLogo) {
            if (token !== drawToken) return; // naya draw shuru ho gaya
            if (!hasLogo) {
                ctx.fillStyle = ac;
                ctx.font = '800 110px "Plus Jakarta Sans", system-ui, sans-serif';
                ctx.fillText((d.title.charAt(0) || "S").toUpperCase(), W / 2, 270);
            }
            // title + bio
            ctx.fillStyle = "#ffffff";
            fit(ctx, d.title, W - 140, 72, 800);
            ctx.fillText(d.title, W / 2, 432);
            if (d.bio) {
                ctx.fillStyle = "rgba(255,255,255,0.85)";
                fit(ctx, d.bio, W - 160, 32, 600);
                ctx.fillText(d.bio, W / 2, 482);
            }

            // body panel
            ctx.fillStyle = "#ffffff";
            roundRect(ctx, 60, 560, W - 120, 720, 36);
            ctx.shadowColor = "rgba(30,20,60,0.12)"; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10;
            ctx.fill();
            ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

            ctx.textAlign = "left";
            var y = 640;
            var rows = [["PHONE", d.phone ? "+91 " + d.phone : ""], ["LOCATION", d.location], ["HOURS", d.hours], ["OWNER", d.owner]].filter(function (r) { return r[1]; });
            rows.forEach(function (r) {
                ctx.fillStyle = "#8a8aa3"; ctx.font = '700 22px "Plus Jakarta Sans", system-ui, sans-serif';
                ctx.fillText(r[0], 110, y);
                ctx.fillStyle = "#1a1a2e"; fit(ctx, r[1], W - 240, 36, 700);
                ctx.fillText(r[1], 110, y + 44);
                y += 84;
            });
            if (!rows.length) {
                ctx.fillStyle = "#8a8aa3"; ctx.font = '600 28px "Plus Jakarta Sans", system-ui, sans-serif';
                ctx.fillText("Contact details profile me bharein", 110, y + 20);
                y += 100;
            }

            // service chips
            if (d.services.length) {
                var x = 110, cy = y + 14, maxX = W - 110;
                ctx.font = '700 24px "Plus Jakarta Sans", system-ui, sans-serif';
                var shown = 0;
                for (var i = 0; i < d.services.length; i++) {
                    var label = d.services[i];
                    var w = ctx.measureText(label).width + 40;
                    if (x + w > maxX) { x = 110; cy += 56; }
                    if (cy > 1010) break; // ek hi line — neeche QR ke liye jagah chhodi hai
                    ctx.fillStyle = ac; ctx.globalAlpha = 0.14;
                    roundRect(ctx, x, cy - 32, w, 46, 23); ctx.fill();
                    ctx.globalAlpha = 1;
                    ctx.fillStyle = shade(ac, 0.7); ctx.fillText(label, x + 20, cy);
                    x += w + 12; shown++;
                }
                if (shown < d.services.length) {
                    ctx.fillStyle = "#8a8aa3"; ctx.fillText("+" + (d.services.length - shown) + " more", x, cy);
                }
            }

            // UPI QR block
            var qrDone = false;
            if (d.upi && window.ccQR && typeof window.ccQR.create === "function") {
                try {
                    var url = "upi://pay?pa=" + d.upi + "&pn=" + encodeURIComponent(d.title) + "&cu=INR";
                    var qr = window.ccQR.create(url, "M");
                    var box = 190, cell = Math.floor(box / qr.size), size = cell * qr.size;
                    var qx = 110, qy = 1066;
                    ctx.fillStyle = "#ffffff"; ctx.fillRect(qx - 10, qy - 10, size + 20, size + 20);
                    ctx.strokeStyle = "#e6e3ee"; ctx.lineWidth = 2; ctx.strokeRect(qx - 10, qy - 10, size + 20, size + 20);
                    ctx.fillStyle = "#000000";
                    for (var r = 0; r < qr.size; r++) for (var c = 0; c < qr.size; c++) {
                        if (qr.isDark(r, c)) ctx.fillRect(qx + c * cell, qy + r * cell, cell, cell);
                    }
                    ctx.fillStyle = "#1a1a2e"; ctx.font = '800 40px "Plus Jakarta Sans", system-ui, sans-serif';
                    ctx.fillText("Scan & Pay", qx + size + 40, qy + 60);
                    ctx.fillStyle = "#555570"; fit(ctx, d.upi, W - (qx + size + 40) - 100, 28, 600);
                    ctx.fillText(d.upi, qx + size + 40, qy + 106);
                    ctx.fillStyle = "#8a8aa3"; ctx.font = '600 24px "Plus Jakarta Sans", system-ui, sans-serif';
                    ctx.fillText("Koi bhi UPI app se", qx + size + 40, qy + 148);
                    qrDone = true;
                } catch (e) { /* QR nahi bana — chhod do */ }
            }
            if (!qrDone) {
                ctx.textAlign = "center"; ctx.fillStyle = ac;
                ctx.font = '800 40px "Plus Jakarta Sans", system-ui, sans-serif';
                ctx.fillText("Visit again!", W / 2, 1170);
            }

            // footer
            ctx.textAlign = "center"; ctx.fillStyle = "#a3a3b8";
            ctx.font = '700 22px "Plus Jakarta Sans", system-ui, sans-serif';
            ctx.fillText("Made with Click & Connect", W / 2, 1310);
        };
        drawLogo(ctx, d.logo, W / 2, 230, 118, drawRest);
    }

    function shareText() {
        var d = data();
        var lines = ["*" + d.title + "*"];
        if (d.bio) lines.push(d.bio);
        if (d.phone) lines.push("📞 +91 " + d.phone);
        if (d.location) lines.push("📍 " + d.location);
        if (d.hours) lines.push("🕘 " + d.hours);
        if (d.services.length) lines.push("Services: " + d.services.join(", "));
        if (d.upi) lines.push("UPI: " + d.upi);
        return lines.join("\n");
    }

    function toast(msg, type) { if (window.ccToast) window.ccToast(msg, type); }

    function canvasBlob() {
        return new Promise(function (resolve) { $("shareCardCanvas").toBlob(resolve, "image/png"); });
    }

    function openCard() {
        var modal = $("shareCardModal");
        if (!modal) return;
        modal.classList.add("is-open");
        var go = function () { drawShareCard(); };
        if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); else go();
    }
    function closeCard() { $("shareCardModal") && $("shareCardModal").classList.remove("is-open"); }

    function init() {
        renderReceipt();

        // Live update: form me kuch bhi badle / service chip dabe / logo ya accent badle
        var form = $("profileForm");
        if (form) {
            form.addEventListener("input", renderReceipt);
            form.addEventListener("click", function (e) {
                if (e.target.closest && e.target.closest(".cc-chip-opt")) setTimeout(renderReceipt, 0);
            });
        }
        window.addEventListener("cc-profile-updated", renderReceipt);
        window.addEventListener("storage", renderReceipt);
        // Firestore data aane me thoda time lagta hai — kuch der tak dobara sync
        [400, 1200, 2800].forEach(function (ms) { setTimeout(renderReceipt, ms); });

        $("openShareCardBtn") && $("openShareCardBtn").addEventListener("click", openCard);
        var modal = $("shareCardModal");
        if (modal) {
            modal.addEventListener("click", function (e) { if (e.target === modal) closeCard(); });
            document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeCard(); });
        }
        window.addEventListener("cc-accent-change", function () { if ($("shareCardModal").classList.contains("is-open")) setTimeout(drawShareCard, 30); });

        $("shareDownloadBtn") && $("shareDownloadBtn").addEventListener("click", function () {
            canvasBlob().then(function (blob) {
                if (!blob) { toast("Card download nahi ho paya.", "error"); return; }
                var url = URL.createObjectURL(blob);
                var a = document.createElement("a");
                var slug = data().title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "business";
                a.href = url; a.download = "card-" + slug + ".png";
                document.body.appendChild(a); a.click(); a.remove();
                setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
                toast("Business card download ho gaya!", "success");
            });
        });

        var nativeBtn = $("shareNativeBtn");
        if (nativeBtn) {
            var canShareFiles = false;
            try {
                canShareFiles = !!(navigator.canShare && navigator.share &&
                    navigator.canShare({ files: [new File([""], "x.png", { type: "image/png" })] }));
            } catch (e) { canShareFiles = false; }
            if (!canShareFiles) nativeBtn.hidden = true;
            nativeBtn.addEventListener("click", function () {
                canvasBlob().then(function (blob) {
                    return navigator.share({ files: [new File([blob], "business-card.png", { type: "image/png" })], title: data().title, text: shareText() });
                }).catch(function () { /* user ne cancel kiya */ });
            });
        }

        $("shareWhatsappBtn") && $("shareWhatsappBtn").addEventListener("click", function () {
            window.open("https://wa.me/?text=" + encodeURIComponent(shareText()), "_blank", "noopener");
        });

        $("shareCopyBtn") && $("shareCopyBtn").addEventListener("click", function () {
            if (!navigator.clipboard) { toast("Copy is browser me support nahi.", "error"); return; }
            navigator.clipboard.writeText(shareText()).then(
                function () { toast("Details copy ho gayi!", "success"); },
                function () { toast("Copy nahi ho paya.", "error"); }
            );
        });
    }

    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
    else init();
})();
