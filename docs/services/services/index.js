// src/services/index.js
import './container.js';
import './settings.js';
import './leaflet-map.js';
import './mapillary.js';
import './game-logic.js';

// also expose on window for non-module scripts
import { serviceContainer } from './container.js';
import { settingsManager } from './settings.js';
import { leafletMapService } from './leaflet-map.js';
import { mapillaryService } from './mapillary.js';
import { gameLogic } from './game-logic.js';

window.services = {
  serviceContainer,
  settingsManager,
  leafletMapService,
  mapillaryService,
  gameLogic
};

export {
  serviceContainer,
  settingsManager,
  leafletMapService,
  mapillaryService,
  gameLogic
};