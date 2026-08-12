import React, { useRef, useEffect } from 'react';
import { Marker, Popup } from 'react-leaflet';
import { isValidCoordinate } from './mapUtils';
import L from 'leaflet';

/**
 * Helper to construct custom icons quickly for different marker types
 */
const createCustomIcon = (color) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

export const ICONS = {
  blue: createCustomIcon('blue'),
  green: createCustomIcon('green'),
  red: createCustomIcon('red'),
  orange: createCustomIcon('orange'),
  violet: createCustomIcon('violet'),
  grey: createCustomIcon('grey'),
  black: createCustomIcon('black'),
};

/**
 * A generalized marker wrapper that validates its coordinates before rendering.
 * @param {Object} props
 * @param {number|string} props.lat - Latitude
 * @param {number|string} props.lng - Longitude
 * @param {React.ReactNode} props.popup - Content to render inside a Popup
 * @param {Object} props.icon - A Leaflet icon (defaults to standard blue)
 * @param {boolean} props.openPopup - Whether to open the popup automatically
 */
const LocationMarker = ({ lat, lng, popup, icon = ICONS.blue, openPopup = false }) => {
  const markerRef = useRef(null);

  useEffect(() => {
    if (openPopup && markerRef.current) {
      // Small timeout allows the map to render before opening popup
      setTimeout(() => {
        if (markerRef.current) {
          markerRef.current.openPopup();
        }
      }, 100);
    }
  }, [openPopup]);

  if (!isValidCoordinate(lat, lng)) {
    return null;
  }

  return (
    <Marker 
      position={[parseFloat(lat), parseFloat(lng)]} 
      icon={icon}
      ref={markerRef}
    >
      {popup && (
        <Popup>
          {popup}
        </Popup>
      )}
    </Marker>
  );
};

export default LocationMarker;
