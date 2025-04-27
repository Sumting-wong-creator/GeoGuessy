// mapillary-loader.js
// Load Mapillary from your local copy in renderer/lib

(function() {
    console.log('Mapillary loader starting…');
  
    // If Mapillary already injected, skip
    if (window.mapillary) {
      console.log('Mapillary already available');
      document.dispatchEvent(new Event('mapillaryLoaded'));
      return;
    }
  
    try {
      const script = document.createElement('script');
      script.src = 'lib/mapillary.unminified.js';
      script.onload = () => {
        console.log('Mapillary module loaded');
        document.dispatchEvent(new Event('mapillaryLoaded'));
      };
      script.onerror = (err) => {
        console.error('Failed to load Mapillary library', err);
        document.dispatchEvent(new Event('mapillaryError'));
      };
      document.head.appendChild(script);
    } catch (err) {
      console.error('Error in Mapillary loader', err);
      document.dispatchEvent(new Event('mapillaryError'));
    }
  })();