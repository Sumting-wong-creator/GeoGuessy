// init.js
document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  let apiOk = false, leafOk = false;

  try {
    await window.api.electron.ping();
    apiOk = true;
  } catch {}

  leafOk = !!window.L;

  statusEl.textContent = 
    `API: ${apiOk?'✅ OK':'❌ missing'} • Leaflet: ${leafOk?'✅ OK':'❌ missing'}`;
  statusEl.className = apiOk && leafOk ? 'ok' : 'fail';
});