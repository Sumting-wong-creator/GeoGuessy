// web-api.js
// If window.api.electron doesn’t exist (i.e. in a normal browser), stub it:
if (!window.api) window.api = {};
window.api.electron = {
  getSettings:   async () => ({ zoomLevel: 2, enable360View: false }),
  saveSettings:  async (s) => true,
  startGame:     async () => ({ currentRound: 0, score: 0 }),
  endGame:       async (score) => ({ currentRound: null, score }),
};