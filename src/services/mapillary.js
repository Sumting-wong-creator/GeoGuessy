// src/services/mapillary.js

import { serviceContainer } from './container.js';

export const REGION_BBOXES = {
  'All Israel':      { minLat: 29.5,    maxLat: 33.3,    minLng: 34.2,    maxLng: 35.9    },
  'Alonei Abba':     { minLat: 32.727,  maxLat: 32.737,  minLng: 35.169,  maxLng: 35.175  },
  'Eilat':           { minLat: 29.533,  maxLat: 29.573,  minLng: 34.933,  maxLng: 34.973  },
  'Herzeliya':       { minLat: 32.150,  maxLat: 32.200,  minLng: 34.780,  maxLng: 34.838  },
  'Raanana':         { minLat: 32.170,  maxLat: 32.200,  minLng: 34.840,  maxLng: 34.900  },
  'Ramat Aviv':      { minLat: 32.120,  maxLat: 32.130,  minLng: 34.800,  maxLng: 34.820  },
  'Ramat HaSharon':  { minLat: 32.150,  maxLat: 32.180,  minLng: 34.820,  maxLng: 34.860  },
  'Tel Aviv':        { minLat: 32.000,  maxLat: 32.150,  minLng: 34.750,  maxLng: 34.900  },
  'Earth [HARD]':    { minLat: -90,     maxLat:  90,     minLng: -180,    maxLng: 180    }
};

const GRAPH_ENDPOINT  = 'https://graph.mapillary.com/images';
const MAPILLARY_TOKEN = 'MLY|9042521299196353|16278f1c922d47116276d65f2221bf70';

class MapillaryService {
  constructor() {
    this.viewer = null;
  }

  async initialize(containerId, firstImageId) {
    await new Promise(r => requestAnimationFrame(r));
    const M = window.mapillary;
    if (!M || typeof M.Viewer !== 'function') {
      throw new Error('Mapillary Viewer not found');
    }
    const opts = {
      container:   containerId,
      accessToken: MAPILLARY_TOKEN,
      component: {
        cover:     false,
        bearing:   false,
        direction: false,
        spatial:   false,
        zoom:      false,
        sequence:  { playing: false, visible: false }
      },
      imageId: firstImageId || undefined
    };
    this.viewer = new M.Viewer(opts);
    return this.viewer;
  }

  async loadRandomLocation(region, retries = 5) {
    const bbox = REGION_BBOXES[region] || REGION_BBOXES['All Israel'];

    for (let attempt = 1; attempt <= retries; attempt++) {
      const lat = bbox.minLat + Math.random() * (bbox.maxLat - bbox.minLat);
      const lng = bbox.minLng + Math.random() * (bbox.maxLng - bbox.minLng);

      const params = [
        `fields=id,geometry`,
        `closeto=${lat},${lng}`,
        `bbox=${bbox.minLng},${bbox.minLat},${bbox.maxLng},${bbox.maxLat}`,
        `limit=1`,
        region === 'Earth [HARD]' ? `is_pano=true` : null,
        `access_token=${MAPILLARY_TOKEN}`
      ].filter(Boolean).join('&');

      const url = `${GRAPH_ENDPOINT}?${params}`;
      const resp = await fetch(url);
      if (!resp.ok) continue;
      const { data } = await resp.json();
      const img = data?.[0];
      if (!img?.geometry?.coordinates) continue;

      const [lng2, lat2] = img.geometry.coordinates;
      if (
        lat2 < bbox.minLat || lat2 > bbox.maxLat ||
        lng2 < bbox.minLng || lng2 > bbox.maxLng
      ) continue;

      return { id: img.id, lat: lat2, lng: lng2 };
    }

    throw new Error(`No imagery in ${region} after ${retries} tries.`);
  }
}

export const mapillaryService = new MapillaryService();
serviceContainer.register('mapillary', mapillaryService);