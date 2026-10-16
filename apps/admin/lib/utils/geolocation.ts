/**
 * Geolocation Utility Functions
 * Client-side only - uses browser Geolocation API
 */

export interface GeolocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

export interface GeolocationError {
  code: number;
  message: string;
}

/**
 * Get current position from browser Geolocation API
 * Returns Promise that resolves with coordinates or rejects with error
 */
export async function getCurrentPosition(): Promise<GeolocationData> {
  return new Promise((resolve, reject) => {
    // Check if context is secure (HTTPS or localhost) - Geolocation is disabled on HTTP
    if (typeof window !== 'undefined' && !window.isSecureContext) {
      reject({
        code: 1, // PERMISSION_DENIED
        message: 'Location access is blocked because this site is not using a secure connection (HTTPS). Please access the site over HTTPS or localhost.',
      });
      return;
    }

    if (!navigator.geolocation) {
      reject({
        code: 0,
        message: 'Geolocation is not supported by your browser',
      });
      return;
    }

    const options = {
      enableHighAccuracy: true,
      // Every clock in/out waits on this before its request even starts, and
      // falls back to no location on timeout — so keep the worst case short.
      timeout: 8000,
      // A fix from the last minute is still where the employee is, and it
      // comes back instantly — e.g. clocking in right after logging in.
      maximumAge: 60000,
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        });
      },
      (error) => {
        let message = 'Unable to retrieve location';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = 'Location permission denied. Please click the site settings/lock icon in your browser address bar to allow location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            message = 'Location information is unavailable. Ensure location services are enabled on your device.';
            break;
          case error.TIMEOUT:
            message = 'Location request timed out. Please try again.';
            break;
        }
        reject({
          code: error.code,
          message,
        });
      },
      options,
    );
  });
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(
  latitude: number,
  longitude: number,
): string {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

/**
 * Generate Google Maps link from coordinates
 */
export function getGoogleMapsLink(
  latitude: number,
  longitude: number,
): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`;
}

/**
 * Calculate distance between two coordinates in meters (Haversine formula)
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}
