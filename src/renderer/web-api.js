// web-api.js
// If we’re in a normal browser (no Electron), stub out window.api.electron:
if (!window.api) window.api = {};
window.api.electron = {
  getSettings:  async () => ({ zoomLevel: 2, enable360View: false }),
  saveSettings: async (s) => true,
  startGame:    async () => ({ currentRound: 0, score: 0 }),
  endGame:      async (score) => ({ currentRound: null, score }),
};