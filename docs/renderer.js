// src/renderer/renderer.js

import { mapillaryService, REGION_BBOXES } from './services/mapillary.js';
import { gameLogic                          } from './services/game-logic.js';

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
  const controlsEl    = document.getElementById('controls');
  const wrapperEl     = document.querySelector('.map-controls-wrapper');

  const TOTAL      = 5;
  const ROUND_TIME = 60;
  let map, viewer, countdownId;
  let round = 0, score = 0, timeLeft = ROUND_TIME, canGuess = false;
  let guessMarker, realMarker, line1, line2, realCoords;
  let mapClickHandler;

  // ─── PHONE MODE & ORIENTATION LOCK ──────────────────────────────────────────
  phoneBtn.addEventListener('click', async () => {
    const turningOn = phoneSheet.disabled;
    phoneSheet.disabled = !turningOn;
    phoneBtn.textContent = turningOn ? 'Exit Phone Mode' : 'Phone Mode';
    if (screen.orientation?.lock) {
      try {
        if (turningOn) {
          await screen.orientation.lock('landscape');
        } else {
          await screen.orientation.unlock();
        }
      } catch (err) {
        console.warn('Orientation lock failed:', err);
      }
    }
  });

  // ─── DARK MODE TOGGLE ────────────────────────────────────────────────────────
  darkToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
  });

  // ─── START GAME ──────────────────────────────────────────────────────────────
  startBtn.addEventListener('click', async () => {
    round = 0;
    score = 0;
    gameLogic.score = 0;
    timeLeft = ROUND_TIME;
    updateStatus();
    finalScoreEl.textContent = '0';

    menuScreen.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    endOv.classList.add('hidden');
    controlsEl.classList.remove('hidden');
    wrapperEl.classList.remove('hidden');

    setupLeaflet();
    await gameLogic.initialize();
    await nextRound();
  });

  // ─── GUESS & NEXT BUTTONS ───────────────────────────────────────────────────
  guessBtn.addEventListener('click', doGuess);
  nextBtn.addEventListener('click', nextRound);

  // ─── SETUP LEAFLET ───────────────────────────────────────────────────────────
  function setupLeaflet() {
    if (map) return;

    map = L.map('leaflet-map', {
      center:       [31.8, 34.9],
      zoom:          7,
      maxBounds:    [[-90, -180], [90, 180]],
      maxBoundsViscosity: 1
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      noWrap:      true
    }).addTo(map);

    // keep a reference so we can turn it off in doGuess()
    mapClickHandler = e => {
      if (!canGuess) return;
      guessBtn.disabled = false;

      if (guessMarker) {
        guessMarker.setLatLng(e.latlng);
      } else {
        guessMarker = L.marker(e.latlng, {
          icon: L.icon({
            iconUrl:    './pin-red.png',
            iconSize:   [32, 32],
            iconAnchor: [16, 32]
          }),
          draggable: true
        }).addTo(map);
        // prevent dragging before guess
        guessMarker.on('dragstart', () => {
          if (!canGuess) guessMarker.dragging.disable();
        });
      }
    };

    map.on('click', mapClickHandler);
  }

  // ─── STATUS UPDATE & TIMER ──────────────────────────────────────────────────
  function updateStatus(distance = null) {
    const base = `Round ${round}/${TOTAL} — Score: ${score}`;
    statusEl.textContent = distance != null
      ? `${base} — Distance: ${distance} m`
      : base;
    timerEl.textContent = `${timeLeft}s`;
  }

  function startTimer() {
    clearInterval(countdownId);
    timeLeft = ROUND_TIME;
    updateStatus();
    countdownId = setInterval(() => {
      if (--timeLeft <= 0) {
        clearInterval(countdownId);
        doGuess();
      } else {
        timerEl.textContent = `${timeLeft}s`;
      }
    }, 1000);
  }

  // ─── NEXT ROUND ─────────────────────────────────────────────────────────────
  async function nextRound() {
    clearInterval(countdownId);
    [guessMarker, realMarker, line1, line2].forEach(l => l && map.removeLayer(l));
    guessMarker = realMarker = line1 = line2 = null;

    // re‐enable placement
    canGuess = true;
    guessBtn.disabled = true;
    map.on('click', mapClickHandler);
    nextBtn.classList.add('hidden');

    round++;
    startTimer();
    loadOv.classList.remove('hidden');

    try {
      const loc = await gameLogic.startNewRound(regionSelect.value);
      realCoords = { lat: loc.lat, lng: loc.lng };

      if (![ 'All Israel', 'Earth [HARD]' ].includes(gameLogic.region)) {
        const bb = REGION_BBOXES[gameLogic.region];
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

  // ─── GUESS + FREEZE MARKER + DUAL-COLORED LINE + SCORING ────────────────────
  async function doGuess() {
    if (!canGuess) return;
    canGuess = false;

    // 1) remove click handler so no more re‐placement
    map.off('click', mapClickHandler);

    // 2) lock down the red marker itself
    if (guessMarker && guessMarker.dragging) {
      guessMarker.dragging.disable();
    }
    // 3) block pointer‐events on its element
    const iconEl = guessMarker?.getElement?.();
    if (iconEl) iconEl.style.pointerEvents = 'none';

    clearInterval(countdownId);

    const guessLatLng = guessMarker
      ? guessMarker.getLatLng()
      : map.getCenter();

    // show real (blue) marker
    realMarker = L.marker(
      [realCoords.lat, realCoords.lng],
      { icon: L.icon({
          iconUrl:    './pin-blue.png',
          iconSize:   [32, 32],
          iconAnchor: [16, 32]
        })
      }
    ).addTo(map);

    // draw black + orange segments
    const midLat = (guessLatLng.lat + realCoords.lat) / 2;
    const midLng = (guessLatLng.lng + realCoords.lng) / 2;

    line1 = L.polyline(
      [[guessLatLng.lat, guessLatLng.lng], [midLat, midLng]],
      { color: 'black', weight: 4 }
    ).addTo(map);

    line2 = L.polyline(
      [[midLat, midLng], [realCoords.lat, realCoords.lng]],
      { color: 'orange', weight: 4 }
    ).addTo(map);

    // score the guess
    const { distance, points, score: newScore } = await gameLogic.makeGuess({
      lat: guessLatLng.lat,
      lng: guessLatLng.lng
    });
    score = newScore;
    updateStatus(distance);
    finalScoreEl.textContent = newScore;

    if (round >= TOTAL) {
      // end‐game
      endOv.classList.remove('hidden');
      controlsEl.classList.add('hidden');
      wrapperEl.classList.add('hidden');
    } else {
      nextBtn.classList.remove('hidden');
    }
  }

  // ─── RESTART (in‐app reset) ─────────────────────────────────────────────────
  document.getElementById('restart-btn')
    .addEventListener('click', () => {
      endOv.classList.add('hidden');
      controlsEl.classList.remove('hidden');
      wrapperEl.classList.remove('hidden');

      round = 0;
      score = 0;
      gameLogic.score = 0;
      timeLeft = ROUND_TIME;
      updateStatus();
      finalScoreEl.textContent = '0';

      menuScreen.classList.remove('hidden');
      gameContainer.classList.add('hidden');
    });
});