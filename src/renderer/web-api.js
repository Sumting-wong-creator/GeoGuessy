// web-api.js
console.log('🪐 web-api.js stub loaded', window.api);
if (!window.api) window.api = {};
window.api.electron = {
  getSettings: async () => ({ zoomLevel: 2, enable360View: false }),
  saveSettings: async () => true,
  startGame: async () => { console.log('🪐 fake startGame called'); return { currentRound:0, score:0 }; },
  endGame: async () => ({ score:0 }),
};