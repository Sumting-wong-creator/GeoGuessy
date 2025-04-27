// src/services/container.js
export class ServiceContainer {
  constructor() { this.services = new Map(); }
  register(name, svc) { this.services.set(name, svc); }
  get(name) { return this.services.get(name); }
}
export const serviceContainer = new ServiceContainer();