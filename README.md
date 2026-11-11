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
