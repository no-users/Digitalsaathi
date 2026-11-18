# Click & Connect

Cyber cafe portal (Firebase Auth + Firestore).

## Folder structure
```
/                    HTML pages + PWA files (root par rehne zaroori)
  index.html         Main dashboard
  admin.html         Admin panel (single file)
  Saathi.html, Service.html, bill.html, file.html, form.html, photo.html ...
  sw.js, cc-sw.js    Service workers (root par hi chalenge)
  manifest.json, manifest.webmanifest
css/                 Saare stylesheets (palette, theme, dash-style, auth, profile ...)
js/                  Saari scripts (auth-firebase, auth-guard, dash-engine, profile ...)
assets/img/          Logo, icons, photos
```

## Firebase
Config: `js/auth-firebase.js` (har page me firebase scripts ke baad load hota hai).
Firestore: `data/matrix_config`, `drive_pdfs`, `users`, `applications`, `bills`, `expenses`, `prices`, `staff`, `cash`, `admins`, `audit`, `backups`, `trash`, `clicks`.

## Updates & Notices
Admin: Updates page (collection `updates`, published=true hone par website par dikhta hai). Cards me documents/process/fee/eligibility fields.
Website: `js/cc-updates.js` + `css/cc-updates.css` (slide banner, details modal), card par list-check button.

## Troubleshooting (data / notification nahi dikh raha)
1. `docs/firestore-admin-rules.txt` ka checklist follow karein (rules Publish + `admins` document).
2. Dashboard par **Ctrl+Shift+D**: Source "Server (live)" hona chahiye. "Cache" ya Error dikhe to Firebase se connect nahi ho raha.
3. Admin -> Settings -> **Connection Doctor** chalayein.
4. Admin aur dashboard dono `js/auth-firebase.js` wale project (`agency-136b6`) ko hi use karte hain.
5. Pages jo Firestore padhte hain (index, mobile, ration-card) ab pehle Firebase login ready hone ka wait karte hain (`window.ccAuthReady`).

