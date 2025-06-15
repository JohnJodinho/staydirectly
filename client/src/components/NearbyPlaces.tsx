// src/components/NearbyPlaces.tsx
import React, { useEffect, useState } from "react";
import { MapPin } from "lucide-react";

// Define Type for nearby place
interface Place {
  place_id: string;
  name: string;
  vicinity: string;
  icon: string;
}

interface NearbyPlacesProps {
  latitude: number;
  longitude: number;
  radius?: number;
  types?: string[];
}

export default function NearbyPlaces({ latitude, longitude, radius = 2000, types = ['restaurant', 'supermarket', 'park']} : NearbyPlacesProps) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!latitude || !longitude) return;

    // First try accessing Google Maps API directly
    if (typeof google !== "undefined" && google?.maps?.places) {
      const service = new google.maps.places.PlacesService(document.createElement("div"));
      service.nearbySearch(
        { location: new google.maps.LatLng(latitude, longitude), radius, type: types },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            setPlaces(
              results.slice(0, 10).map((p) => ({
                place_id: p.place_id,
                name: p.name,
                vicinity: p.vicinity,
                icon: p.icon,
              }))
            );
            setLoading(false);
          } else {
            fallbackToServer();
          }
        }
      );
    } else {
      fallbackToServer();
    }
    // Fallback to server-side API
    async function fallbackToServer() {
      try {
        const res = await fetch(`/api/nearby?lat=${latitude}&lng=${longitude}`);
        if (res.ok) {
          const data = await res.json();
          setPlaces(data);
        } else {
          setError('Unable to fetch nearby places');
        }
      } catch (err) {
        setError('Unable to fetch nearby places');
      } finally {
        setLoading(false);
      }
    }
  }, [latitude, longitude]);

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-xl font-bold mb-6">Nearby Landmarks and Points of Interest</h2>
        <p className="text-gray-500">Loading nearby places...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h2 className="text-xl font-bold mb-6">Nearby Landmarks and Points of Interest</h2>
        <p className="text-gray-500">{error}</p>
      </div>
    )
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
      <h2 className="text-xl font-bold mb-6">Nearby Landmarks and Points of Interest</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
        {places.length > 0 ? (
          places.map((place) => (
            <div key={place.place_id} className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-gray-50 p-2 rounded-full mr-3">
                   <img src={place.icon} alt="" className="h-4 w-4" />
                </div>
                <span>{place.name}</span>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No nearby places found.</p>
        )}

      </div>
    </div>
  )
}
