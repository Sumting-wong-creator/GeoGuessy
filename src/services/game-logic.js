// src/services/game-logic.js

import { serviceContainer } from './container.js';

/**
 * Deduction per meter by region.
 * Earth [HARD]: 1 point lost per 400 000 m ⇒ 0.0000025 pts/m
 */
const REGION_MULTIPLIERS_PER_M = {
  'All Israel':      0.00014,
  'Alonei Abba':     2,
  'Eilat':           0.2,
  'Herzeliya':       0.2,
  'Raanana':         0.4,
  'Ramat Aviv':      0.6,
  'Ramat HaSharon':  0.5,
  'Tel Aviv':        0.4,
  'Earth [HARD]':    0.0000000025
};

/**
 * Maximum base points by region.
 * Earth [HARD] only gives up to 50 points.
 * Others default to 5000.
 */
const REGION_BASE_POINTS = {
  'Earth [HARD]': 50
};

class GameLogic {
  constructor() {
    this.currentLocation = null;
    this.score           = 0;
    this.round           = 0;
    this.region          = 'All Israel';
  }

  async initialize() {
    await window.api.electron.startGame();
  }

  async startNewRound(regionName) {
    this.round  += 1;
    this.region  = regionName;
    const loc = await serviceContainer
      .get('mapillary')
      .loadRandomLocation(regionName);
    this.currentLocation = loc;
    return loc;
  }

  /**
   * Score a guess:
   * 1) Compute distance in meters
   * 2) Subtract (distance × pts/m) from region base
   * 3) Clamp ≥ 0, round, accumulate
   */

  async initialize() {
    if (window.api?.electron?.startGame) {
      await window.api.electron.startGame();
    }
  }


  async makeGuess(guess) {
    if (!this.currentLocation || !guess) {
      return { distance: null, points: 0, score: this.score };
    }

    // Haversine → km
    const R = 6371;
    const toRad = d => (d * Math.PI) / 180;
    const dLat = toRad(this.currentLocation.lat - guess.lat);
    const dLng = toRad(this.currentLocation.lng - guess.lng);
    const a = Math.sin(dLat/2)**2 +
              Math.cos(toRad(guess.lat)) *
              Math.cos(toRad(this.currentLocation.lat)) *
              Math.sin(dLng/2)**2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distKm = R * c;

    // → meters
    const distM = distKm * 1000;

    // Region params
    const mult = REGION_MULTIPLIERS_PER_M[this.region] ?? 0.016;
    const base = REGION_BASE_POINTS[this.region] ?? 5000;

    // Compute & clamp
    const raw    = base - distM * mult;
    const points = Math.round(Math.max(0, raw));

    this.score += points;
    await window.api.electron.endGame(this.score);

    return {
      distance: Math.round(distM),
      points,
      score: this.score
    };
  }
}

export const gameLogic = new GameLogic();
serviceContainer.register('game', gameLogic);