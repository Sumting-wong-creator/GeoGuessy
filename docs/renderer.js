// src/renderer/renderer.js

import { mapillaryService, REGION_BBOXES } from './services/mapillary.js';
import { gameLogic                           } from './services/game-logic.js';

document.addEventListener('DOMContentLoaded', () => {
  // ─── ELEMENT REFERENCES ───────────────────────────────────────────────────────
  const menuScreen    = document.getElementById('menu-screen');
  const regionSelect  = document.getElementById('region-select');
  const startBtn      = document.getElementById('start-btn');
  const phoneBtn      = document.getElementById('phone-mode-btn');
  const phoneSheet    = document.getElementById('phone-stylesheet');
  const gameContainer = document.getElementById('game-container');
  const statusEl      = document.getElementById('status');
  const timerEl       = document.getElementById('timer');
  const guessBtn      = document.getElementById('guess-btn');
  const nextBtn       = document.getElementById('next-btn');
  const loadOv        = document.getElementById('loading-overlay');
  const endOv         = document.getElementById('endgame-overlay');
  const finalScoreEl  = document.getElementById('final-score');
  const darkToggle    = document.getElementById('dark-toggle');

  let map, viewer, countdownId;
  let guessMarker, realMarker, line1, line2;
  let realCoords = null;
  const TOTAL      = 5;
  const ROUND_TIME = 60;
  let round = 0, score = 0, timeLeft = ROUND_TIME, canGuess = false;

  // ─── STATUS UPDATE ──────────────────────────────────────────────────────────
  function updateStatus(distanceMeters = null) {
    const base = `Round ${round}/${TOTAL} [${gameLogic.region}] — Score: ${score}`;
    statusEl.textContent = distanceMeters != null
      ? `${base} — Distance: ${distanceMeters} m`
      : base;
  }

  // ─── TIMER ──────────────────────────────────────────────────────────────────
  function startTimer() {
    clearInterval(countdownId);
    timeLeft = ROUND_TIME;
    timerEl.textContent = `${timeLeft}s`;
    countdownId = setInterval(() => {
      if (--timeLeft <= 0) {
        clearInterval(countdownId);
        doGuess();
      }
      timerEl.textContent = `${timeLeft}s`;
    }, 1000);
  }

  // ─── LEAFLET SETUP ───────────────────────────────────────────────────────────
  function setupLeaflet() {
    if (map) return;
    map = L.map('leaflet-map', {
      center: [31.8, 34.9],
      zoom:    7,
      maxBounds: [[-90, -180], [90, 180]],
      maxBoundsViscosity: 1
    });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      noWrap:      true
    }).addTo(map);

    map.on('click', e => {
      if (!canGuess) return;
      guessBtn.disabled = false;
      if (guessMarker) {
        guessMarker.setLatLng(e.latlng);
      } else {
        guessMarker = L.marker(e.latlng, {
          icon: L.icon({ iconUrl: './pin-red.png', iconSize: [32,32], iconAnchor: [16,32] }),
          draggable: true
        }).addTo(map);
        guessMarker.on('dragstart', () => {
          if (!canGuess) guessMarker.dragging.disable();
        });
      }
    });
  }

  // ─── DARK MODE TOGGLE ────────────────────────────────────────────────────────
  darkToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
  });

  // ─── PHONE LAYOUT TOGGLE ────────────────────────────────────────────────────
  phoneBtn.addEventListener('click', () => {
    const isEnabled = phoneSheet.disabled;
    phoneSheet.disabled = !isEnabled;
    phoneBtn.textContent = isEnabled
      ? 'Exit Phone Layout'
      : 'Phone Layout';
  });

  // ─── START GAME ──────────────────────────────────────────────────────────────
  startBtn.addEventListener('click', async () => {
    menuScreen.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    setupLeaflet();
    await gameLogic.initialize();
    await nextRound();
  });

  // ─── GUESS BUTTON ───────────────────────────────────────────────────────────
  guessBtn.addEventListener('click', doGuess);

  // ─── NEXT ROUND BUTTON ──────────────────────────────────────────────────────
  nextBtn.addEventListener('click', nextRound);

  // ─── NEW ROUND ──────────────────────────────────────────────────────────────
  async function nextRound() {
    clearInterval(countdownId);
    [guessMarker, realMarker, line1, line2].forEach(layer => layer && map.removeLayer(layer));
    guessMarker = realMarker = line1 = line2 = null;
    guessBtn.disabled = true;
    nextBtn.classList.add('hidden');
    canGuess = true;

    round++;
    startTimer();

    loadOv.classList.remove('hidden');
    try {
      const loc = await gameLogic.startNewRound(regionSelect.value);
      realCoords = { lat: loc.lat, lng: loc.lng };

      const region = gameLogic.region;
      if (region !== 'All Israel' && region !== 'Earth [HARD]') {
        const bb = REGION_BBOXES[region];
        map.fitBounds([[bb.minLat, bb.minLng], [bb.maxLat, bb.maxLng]]);
      }

      updateStatus();

      if (!viewer) {
        viewer = await mapillaryService.initialize('mapillary-viewer', loc.id);
      } else {
        await viewer.moveTo(loc.id);
      }
    } finally {
      loadOv.classList.add('hidden');
    }
  }

  // ─── GUESS HANDLING & SCORING ────────────────────────────────────────────────
  async function doGuess() {
    if (!canGuess) return;
    canGuess = false;
    clearInterval(countdownId);

    const guessLatLng = guessMarker ? guessMarker.getLatLng() : map.getCenter();

    // Real marker
    realMarker = L.marker([realCoords.lat, realCoords.lng], {
      icon: L.icon({ iconUrl: './pin-blue.png', iconSize: [32,32], iconAnchor: [16,32] })
    }).addTo(map);

    // Draw line
    line1 = L.polyline([guessLatLng, realCoords], { color: 'red' }).addTo(map);

    // Score
    const { distance, points, score: newScore } = await gameLogic.makeGuess({
      lat: guessLatLng.lat,
      lng: guessLatLng.lng
    });

    updateStatus(distance);
    finalScoreEl.textContent = newScore;

    // Show next
    nextBtn.classList.remove('hidden');
  }

  // ─── RESTART BUTTON ─────────────────────────────────────────────────────────
  document.getElementById('restart-btn').addEventListener('click', () => {
    window.location.reload();
  });
});