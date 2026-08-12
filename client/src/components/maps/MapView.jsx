import React, { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { isValidCoordinate } from './mapUtils';

// Fix for default Leaflet icon paths in React (often breaks in webpack/vite without this)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/**
 * A component to automatically adjust map bounds based on a set of coordinates or markers.
 * Must be a child of MapContainer.
 */
const BoundsAdjuster = ({ center, zoom, bounds }) => {
  const map = useMap();

  useEffect(() => {
    if (bounds && bounds.length > 0) {
      // Filter out invalid bounds just in case
      const validBounds = bounds.filter(b => isValidCoordinate(b[0], b[1]));
      if (validBounds.length > 0) {
        map.fitBounds(validBounds, { padding: [50, 50], maxZoom: 15 });
      }
    } else if (center && isValidCoordinate(center.lat, center.lng)) {
      map.setView([center.lat, center.lng], zoom || 13);
    }
  }, [map, center, zoom, bounds]);

  return null;
};

/**
 * Reusable MapView wrapper integrating Leaflet and OpenStreetMap.
 * @param {Object} props
 * @param {Object} props.center - Initial center { lat, lng }
 * @param {number} props.zoom - Initial zoom level
 * @param {Array<Array<number>>} props.bounds - Optional array of [lat, lng] to fit the map bounds to
 * @param {React.ReactNode} props.children - react-leaflet children (Markers, Popups, etc)
 * @param {string} props.className - Tailwind classes to override the wrapper container sizing
 * @param {Function} props.onClick - Function to run on map click, passes leaflet event
 */
const MapView = ({ 
  center = { lat: 0, lng: 0 }, 
  zoom = 2, 
  bounds = null, 
  children, 
  className = "h-96 w-full rounded-md shadow-sm z-0",
  onClick
}) => {

  // If no center provided, fallback to 0,0 for safe initialization
  const initialCenter = isValidCoordinate(center?.lat, center?.lng) 
    ? [center.lat, center.lng] 
    : [0, 0];

  // A helper component to catch click events if an onClick handler is provided
  const ClickHandler = () => {
    const map = useMap();
    useEffect(() => {
      if (onClick) {
        map.on('click', onClick);
        return () => {
          map.off('click', onClick);
        };
      }
    }, [map]);
    return null;
  };

  return (
    <div className={className}>
      <MapContainer 
        center={initialCenter} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%', zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <BoundsAdjuster center={center} zoom={zoom} bounds={bounds} />
        <ClickHandler />
        {children}
      </MapContainer>
    </div>
  );
};

export default MapView;
