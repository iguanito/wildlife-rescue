import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icon broken by bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Jaguar Rescue Center, Puerto Viejo de Talamanca
const CR_CENTER = [9.6443, -82.7561];

function ClickHandler({ onSelect }) {
  useMapEvents({
    click(e) {
      onSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export default function MapPicker({ latitude, longitude, onSelect }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">Location on Map</label>
      <p className="text-xs text-gray-400 mb-2">Click on the map to pin the location where the animal was found.</p>
      <div className="rounded-md overflow-hidden border border-gray-300" style={{ height: 320 }}>
        <MapContainer
          center={latitude && longitude ? [latitude, longitude] : CR_CENTER}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onSelect={onSelect} />
          {latitude && longitude && (
            <Marker position={[latitude, longitude]} />
          )}
        </MapContainer>
      </div>
      {latitude && longitude ? (
        <p className="text-xs text-gray-500 mt-1.5">
          {Number(latitude).toFixed(6)}, {Number(longitude).toFixed(6)}
          <button
            type="button"
            onClick={() => onSelect(null, null)}
            className="ml-2 text-red-400 hover:text-red-600"
          >
            Clear
          </button>
        </p>
      ) : (
        <p className="text-xs text-gray-400 mt-1.5">No location selected</p>
      )}
    </div>
  );
}
