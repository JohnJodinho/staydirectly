import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L, { Icon, LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Property } from '@shared/schema';

// Fix for marker icons in Leaflet with React
// This requires the actual image files to be available
// For simplicity, we'll use a custom icon with SVG
const redIcon = new Icon({
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNSIgaGVpZ2h0PSI0MSIgdmlld0JveD0iMCAwIDI1IDQxIj4KPHBhdGggZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiIGZpbGw9IiNFQTQzMzUiIGQ9Ik0yMC43NjUsMTEuMjE1YzAsMy43ODEtMy4wNjYsNi44NDgtNi44NDcsNi44NDgKYy0zLjc4MiwwLTYuODQ4LTMuMDY3LTYuODQ4LTYuODQ4czMuMDY2LTYuODQ3LDYuODQ4LTYuODQ3QzE3LjY5OSw0LjM2OCwyMC43NjUsNy40MzQsMjAuNzY1LDExLjIxNXogTTEzLjkxOCwwLjk4MwoJYy01LjYxOCwwLTEwLjE3MSw0LjU1NC0xMC4xNzEsMTAuMTcyYzAsNS42MjgsNi43OCwxNi4xNTcsMTAuMTcxLDI4Ljg2M2MzLjMzOS0xMi43MDYsMTAuMTctMjMuMjM0LDEwLjE3LTI4Ljg2MwoJQzI0LjA4OCw1LjUzNywxOS41MzUsMC45ODMsMTMuOTE4LDAuOTgzeiIvPgo8Y2lyY2xlIGZpbGwtcnVsZT0iZXZlbm9kZCIgY2xpcC1ydWxlPSJldmVub2RkIiBmaWxsPSIjRkZGRkZGIiBjeD0iMTMuOTE4IiBjeT0iMTEuMjE1IiByPSI0LjU2NSIvPgo8L3N2Zz4=',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

// Center map on markers component
function CenterMapOnMarkers({ positions }: { positions: LatLngExpression[] }) {
  const map = useMap();
  
  React.useEffect(() => {
    if (positions.length) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [map, positions]);
  
  return null;
}

interface MapViewProps {
  properties: Property[];
  height?: string;
  center?: [number, number];
  zoom?: number;
  onMarkerClick?: (property: Property) => void;
}

const MapView: React.FC<MapViewProps> = ({
  properties,
  height = '600px',
  center = [36.174465, -86.767960], // Nashville, TN coordinates as default
  zoom = 12,
  onMarkerClick
}) => {
  // Generate coordinates for properties based on property id and center position
  // In a real app, you would use actual lat/lng values from the database
  const markerPositions: LatLngExpression[] = [];
  
  // Generate property markers
  const markers = properties.map((property, index) => {
    // Use actual lat/lng if available, otherwise generate random positions
    // around the center point for demo purposes
    let lat: number;
    let lng: number;
    
    if (property.latitude && property.longitude) {
      // Use actual coordinates from the database
      lat = property.latitude;
      lng = property.longitude;
    } else {
      // Generate a random position around the center for demo
      const offset = 0.01; // ~1km at most latitudes
      const angle = (Math.PI * 2 * index) / properties.length;
      lat = center[0] + Math.cos(angle) * offset * (0.5 + Math.random() * 0.5);
      lng = center[1] + Math.sin(angle) * offset * (0.5 + Math.random() * 0.5);
    }
    
    const position: LatLngExpression = [lat, lng];
    markerPositions.push(position);
    
    return (
      <Marker 
        key={property.id} 
        position={position}
        icon={redIcon}
        eventHandlers={{
          click: () => onMarkerClick && onMarkerClick(property)
        }}
      >
        <Popup>
          <div className="text-sm">
            <strong className="font-medium">{property.name}</strong>
            <p className="mt-1">${property.price} / night</p>
            <div className="mt-2">
              <button 
                className="text-primary hover:underline text-xs"
                onClick={() => onMarkerClick && onMarkerClick(property)}
              >
                View details
              </button>
            </div>
          </div>
        </Popup>
      </Marker>
    );
  });

  return (
    <div style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%', borderRadius: '0.5rem' }}
        scrollWheelZoom={false} // Better UX - prevents accidental zoom
        attributionControl={false} // Hide attribution in corner
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {markers}
        {/* This will center the map on all markers */}
        <CenterMapOnMarkers positions={markerPositions} />
        {/* Add attribution in a more attractive way */}
        <div className="absolute bottom-1 right-1 text-[9px] text-gray-500 bg-white bg-opacity-80 px-1 rounded">
          © <a href="https://www.openstreetmap.org/copyright" className="hover:underline">OpenStreetMap</a> contributors
        </div>
      </MapContainer>
    </div>
  );
};

export default MapView;