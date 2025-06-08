import { useMemo, useState } from "react";
import {
  Map,
  AdvancedMarker,
  InfoWindow,
} from "@vis.gl/react-google-maps";

interface Property {
  id: string;
  latitude: number;
  longitude: number;
  name?: string;
  title?: string;
  location?: string;
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  maxGuests?: number;
  rating?: number;
  reviewCount?: number;
  [key: string]: any;
}

interface GoogleMapViewProps {
  properties: Property[] | Property;
  center?: [number, number];
  zoom?: number;
  height?: string;
  onMarkerClick?: (property: Property) => void;
}

export default function GoogleMapView({
  properties,
  center,
  zoom = 12,
  height = "100%",
  onMarkerClick,
}: GoogleMapViewProps) {
  const isArray = Array.isArray(properties);
  const normalizedProperties = isArray ? properties : [properties];
  const isSinglePropertyView = !isArray;

  // Determine map center based on prop or property location
  const mapCenter = useMemo(() => {
    if (center) return { lat: center[0], lng: center[1] };
    const prop = normalizedProperties[0];
    return { lat: prop.latitude, lng: prop.longitude };
  }, [center, normalizedProperties]);

  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);

  return (
    <div style={{ width: "100%", height }}>
      <Map
        defaultCenter={mapCenter}
        defaultZoom={zoom}
        mapId={"DEMO_MAP_ID"}
        fullscreenControl={false}
        streetViewControl={false}
        mapTypeControl={true}
      >
        {normalizedProperties.map((property) => {
          const position = { lat: property.latitude, lng: property.longitude };
          const isSelected = selectedPropertyId === property.id;

          return (
            <AdvancedMarker
              key={property.id}
              position={position}
              onClick={() => setSelectedPropertyId(property.id)}
            >
              {isSinglePropertyView ? (
                // Airbnb-style dot for single property marker
                <div className="w-4 h-4 bg-red-600 rounded-full border-2 border-white shadow-md" />
              ) : (
                // Original marker for multiple properties
                <div className="bg-white px-2 py-1 rounded-full shadow text-xs font-medium text-black border border-gray-300">
                  ${property.price ?? "N/A"}
                </div>
              )}

              {isSelected && (
                <InfoWindow
                  position={position}
                  onCloseClick={() => setSelectedPropertyId(null)}
                >
                  <div className="text-sm text-black max-w-[250px]">
                    <div className="font-semibold">{property.title}</div>
                    <div className="text-gray-600">{property.location}</div>
                    <div className="mt-1">
                      💲 {property.price}/night · 🛏 {property.bedrooms ?? "?"} · 🛁 {property.bathrooms ?? "?"} · 👥 {property.maxGuests ?? "?"}
                    </div>
                    {property.rating && (
                      <div className="mt-1 text-yellow-600">
                        {"⭐".repeat(Math.round(property.rating))}{" "}
                        <span className="text-gray-700 text-xs">
                          ({property.reviewCount ?? 0} reviews)
                        </span>
                      </div>
                    )}
                    <button
                      className="mt-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                      onClick={() => onMarkerClick?.(property)}
                    >
                      View
                    </button>
                  </div>
                </InfoWindow>
              )}
            </AdvancedMarker>
          );
        })}
      </Map>
    </div>
  );
}
