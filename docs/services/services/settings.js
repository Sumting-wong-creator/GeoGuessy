// src/services/settings.js
import { serviceContainer } from './container.js';

class SettingsManager {
  constructor() {
    this.settings = { zoomLevel: 2, enable360View: false };
  }

  async initialize() {
    try {
      const saved = await window.api.electron.getSettings();
      this.settings = { ...this.settings, ...saved };
      return this.settings;
    } catch {
      return this.settings;
    }
  }

  async save(newSettings) {
    try {
      await window.api.electron.saveSettings(newSettings);
      this.settings = newSettings;
      return true;
    } catch (e) {
      window.api.electron.handleError(e);
      return false;
    }
  }

  getSettings() {
    return this.settings;
  }
}

export const settingsManager = new SettingsManager();
serviceContainer.register('settings', settingsManager);