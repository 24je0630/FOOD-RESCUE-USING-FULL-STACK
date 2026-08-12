/**
 * Validates if the given coordinates are within valid geographic bounds.
 * Latitude must be between -90 and 90.
 * Longitude must be between -180 and 180.
 * @param {number|string} lat - Latitude
 * @param {number|string} lng - Longitude
 * @returns {boolean} True if coordinates are valid, false otherwise.
 */
export const isValidCoordinate = (lat, lng) => {
  if (lat === null || lat === undefined || lng === null || lng === undefined) {
    return false;
  }
  const numLat = parseFloat(lat);
  const numLng = parseFloat(lng);

  if (isNaN(numLat) || isNaN(numLng)) {
    return false;
  }

  if (numLat < -90 || numLat > 90) {
    return false;
  }

  if (numLng < -180 || numLng > 180) {
    return false;
  }

  return true;
};

/**
 * Gets the user's current geolocation natively from the browser.
 * Wraps the Geolocation API in a Promise.
 * @param {Object} options - Geolocation API options
 * @returns {Promise<{lat: number, lng: number}>} Resolves with coordinates
 */
export const getUserLocation = (options = { timeout: 10000, maximumAge: 60000 }) => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        // Map native error codes to readable messages
        let message = 'An unknown geolocation error occurred.';
        switch(error.code) {
          case error.PERMISSION_DENIED:
            message = 'User denied the request for Geolocation.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            message = 'The request to get user location timed out.';
            break;
          default:
            break;
        }
        reject(new Error(message));
      },
      options
    );
  });
};

/**
 * Formats a distance in kilometers into a human-readable string.
 * @param {number} distanceKm - The distance in kilometers
 * @returns {string} Formatted string, e.g. '2.5 km' or '800 m'
 */
export const formatDistance = (distanceKm) => {
  if (distanceKm === undefined || distanceKm === null) return '';
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
};
