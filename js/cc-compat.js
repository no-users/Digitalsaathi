/* Click & Connect: jin pages par ye functions nahi the (Service, bill, file), wahan error ke bajay kaam karne wale versions deta hai */
(function () {
  const w = window, toast = m => { const t = document.createElement('div'); t.className = 'cc-toast'; t.textContent = m; document.body.appendChild(t); setTimeout(() => t.classList.add('out'), 2600); setTimeout(() => t.remove(), 3100); };
  w.ccToast = w.ccToast || toast;
  const def = (n, f) => { if (typeof w[n] !== 'function') w[n] = f; };
  def('handleNavClick', s => { document.querySelectorAll('nav a').forEach(e => e.classList.remove('active')); const id = { Home: 'nav-home', Profil: 'nav-profil', 'Our Service': 'nav-service', Contact: 'nav-contact', Login: 'nav-login' }[s]; const el = id && document.getElementById(id); if (el) el.classList.add('active'); });
  def('toggleDeepFocusMode', () => { const on = document.body.classList.toggle('cc-focus'); toast(on ? 'Deep Focus chalu: menu halka ho gaya' : 'Deep Focus band'); });
  const J = ['Teacher: 2+2 kitna? Student: Sir, apne rate se ya market rate se?', 'Pappu: Wi-Fi ka password kya hai? Dukaan wala: Pehle chai peeyo.', 'Doctor: Aap roz subah uthte hi kya karte hain? Marij: Phone dekhta hu, doctor sahab.', 'Bank wala: Form bhar diya? Customer: Haan, bas photo lagani baaki hai, woh bhi isi form ki hai.'];
  def('fetchNewHindiJoke', () => toast(J[Math.floor(Math.random() * J.length)]));
  def('triggerPomodoroBreak', () => { toast('5 minute ka break shuru. Paani piyein!'); setTimeout(() => toast('Break khatam. Kaam par lautein.'), 300000); });
  ['toggleVoiceAssistant', 'openMiniGameModal', 'handleMusicSelection', 'toggleMusicMenu'].forEach(n => def(n, () => toast('Yeh feature Saathi page par chalta hai.')));
})();
