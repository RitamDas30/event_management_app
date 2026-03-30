import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon issue with webpack/vite
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

const LOCATIONIQ_KEY = import.meta.env.VITE_LOCATIONIQ_KEY || "pk.60c5f25f918c7c6288b877a9b2724b39";

export default function EventMap({ address, venueName, className = "h-64 w-full rounded-xl" }) {
  const [position, setPosition] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address) {
      setLoading(false);
      return;
    }

    const geocode = async () => {
      try {
        const res = await fetch(
          `https://us1.locationiq.com/v1/search?key=${LOCATIONIQ_KEY}&q=${encodeURIComponent(address)}&format=json&limit=1`
        );
        const data = await res.json();
        if (data && data.length > 0) {
          setPosition([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
        }
      } catch (err) {
        console.error("Geocoding failed:", err);
      } finally {
        setLoading(false);
      }
    };

    geocode();
  }, [address]);

  if (loading) {
    return <div className={`${className} bg-gray-100 animate-pulse flex items-center justify-center`}>
      <span className="text-sm text-gray-400">Loading map...</span>
    </div>;
  }

  if (!position) {
    return null; // Don't show map if geocoding failed
  }

  return (
    <div className={className} style={{ zIndex: 0 }}>
      <MapContainer
        center={position}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%", borderRadius: "0.75rem" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={defaultIcon}>
          <Popup>
            <strong>{venueName || "Event Venue"}</strong>
            <br />
            {address}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
}
