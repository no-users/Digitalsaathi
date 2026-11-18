/* Click & Connect: Ctrl+Shift+D dabane par dashboard ka data-sync ka hisaab dikhata hai (admin ke Data Sync Check se match karne ke liye) */
(function () {
  document.addEventListener('keydown', e => {
    if (!(e.ctrlKey || e.metaKey) || !e.shiftKey || e.key.toLowerCase() !== 'd') return;
    e.preventDefault();
    const old = document.getElementById('ccSyncBox'); if (old) return old.remove();
    const x = window.ccData, b = document.createElement('div'); b.id = 'ccSyncBox';
    b.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:99999;background:#241632;color:#fff;padding:16px 18px;border-radius:16px;max-width:340px;font:13px/1.6 sans-serif;box-shadow:0 18px 40px #0006';
    b.innerHTML = x ? `<b>Dashboard Data Check</b><br>Project: ${x.project}<br>Folders ${x.counts.folders} · Sub-portals ${x.counts.subs} · Side-links ${x.counts.sideLinks} · Cards ${x.counts.cards}<br>Version: ${x.rev} · Last save: ${x.at ? new Date(x.at).toLocaleString('en-IN') : 'pata nahi'} ${x.by ? 'by ' + x.by : ''}<br>Source: <b style="color:${x.fromCache ? '#ffb347' : '#6ee7a0'}">${x.fromCache ? 'Cache (purana ya offline)' : 'Server (live)'}</b>${x.error ? '<br><b style="color:#ff8a7a">Error: ' + x.error + '</b>' : ''}<br>Updates banner: ${window.ccUpdErr ? '<b style="color:#ff8a7a">' + window.ccUpdErr + '</b>' : 'OK'}<br><small style="opacity:.7">Dobara Ctrl+Shift+D se band karein</small>` : 'Abhi data load nahi hua.';
    document.body.appendChild(b);
  });
})();
