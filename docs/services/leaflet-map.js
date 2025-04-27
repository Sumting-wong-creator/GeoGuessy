// src/services/leaflet-map.js
import { serviceContainer } from './container.js';

export class LeafletMapService {
  constructor() {
    this.map = null;
    this.guessMarker = null;
    this.realMarker  = null;
  }

  /** Initialize the mini‐map inside the div#leaflet-map */
  async initialize(containerId) {
    // wait for the DOM to be ready
    await new Promise(r => requestAnimationFrame(r));

    if (!window.L) {
      throw new Error('Leaflet library not found');
    }

    this.map = L.map(containerId, {
      center: [31.7683, 35.2137],
      zoom: 8,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);

    return this.map;
  }

  /** Drop or move the red “guess” marker */
  setGuessMarker(lat, lng, icon) {
    if (!this.map) return;
    if (this.guessMarker) {
      this.map.removeLayer(this.guessMarker);
    }
    this.guessMarker = L.marker([lat, lng], { icon })
      .addTo(this.map)
      .bringToFront();
  }

  /** Drop or move the blue “real” marker */
  setRealMarker(lat, lng, icon) {
    if (!this.map) return;
    if (this.realMarker) {
      this.map.removeLayer(this.realMarker);
    }
    this.realMarker = L.marker([lat, lng], { icon })
      .addTo(this.map)
      .bringToFront();
  }

  /** Remove both markers and any polylines */
  clearOverlays() {
    if (this.guessMarker) this.map.removeLayer(this.guessMarker);
    if (this.realMarker)  this.map.removeLayer(this.realMarker);
    this.guessMarker = this.realMarker = null;

    this.map.eachLayer(layer => {
      if (layer instanceof L.Polyline) {
        this.map.removeLayer(layer);
      }
    });
  }
}

export const leafletMapService = new LeafletMapService();
serviceContainer.register('leafletMapService', leafletMapService);