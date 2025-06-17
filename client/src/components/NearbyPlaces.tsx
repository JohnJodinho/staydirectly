// src/components/NearbyPlaces.tsx
import React, { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

// Haversine formula to compute distance in miles
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371e3; // Earth radius in meters
  const φ1 = toRad(lat1);
  const φ2 = toRad(lat2);
  const Δφ = toRad(lat2 - lat1);
  const Δλ = toRad(lon2 - lon1);
  
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const meters = R * c;
  const miles = meters / 1609.344;
  
  return parseFloat(miles.toFixed(2));
}

// Define Type for nearby place
interface Place {
  id: string;
  displayName: { text: string };
  formattedAddress?: string;
  location: { latitude: number; longitude: number };
}

interface NearbyPlacesProps {
  latitude: number;
  longitude: number;
  radius?: number;
  types?: string[];
}

export default function NearbyPlaces({
  latitude,
  longitude,
  radius = 2000,
  types = ["restaurant", "supermarket", "park"],
}: NearbyPlacesProps) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!latitude || !longitude) return;

    const fetchFromServer = async () => {
      try {
        const res = await fetch(`/api/nearby?lat=${latitude}&lng=${longitude}`);
        if (!res.ok) throw new Error("fetch failed");
        const data: Place[] = await res.json();
        setPlaces(data);
      } catch {
        setError("Unable to fetch nearby places");
      } finally {
        setLoading(false);
      }
    };

    if (typeof google !== "undefined" && google.maps?.places) {
      const service = new google.maps.places.PlacesService(
        document.createElement("div")
      );
      service.nearbySearch(
        {
          location: new google.maps.LatLng(latitude, longitude),
          radius,
          type: types,
        },
        (results, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            results
          ) {
            setPlaces(
              results.slice(0, 10).map((p) => ({
                id: p.place_id,
                displayName: { text: p.name },
                formattedAddress: p.vicinity,
                location: {
                  latitude: p.geometry.location.lat(),
                  longitude: p.geometry.location.lng(),
                },
              }))
            );
            setLoading(false);
          } else {
            fetchFromServer();
          }
        }
      );
    } else {
      fetchFromServer();
    }
  }, [latitude, longitude]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-xl font-bold mb-6">
          Nearby Landmarks and Points of Interest
        </h2>
        <p className="text-gray-500">Loading nearby places...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-xl font-bold mb-6">
          Nearby Landmarks and Points of Interest
        </h2>
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
      <h2 className="text-xl font-bold mb-6">
        Nearby Landmarks and Points of Interest
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
        {places.length > 0 ? (
          places.map((place) => {
            const dist = haversineDistance(
              latitude,
              longitude,
              place.location.latitude,
              place.location.longitude
            );
            return (
              <div
                key={place.id}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 text-blue-500 mr-3" />
                  <span>{place.displayName.text}</span>
                </div>
                <span className="text-gray-600">{dist} mi</span>
              </div>
            );
          })
        ) : (
          <p className="text-gray-500">No nearby places found.</p>
        )}
      </div>
    </div>
  );
}
