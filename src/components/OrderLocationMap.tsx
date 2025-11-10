import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface OrderLocationMapProps {
  latitude: number;
  longitude: number;
  address: string;
}

const OrderLocationMap = ({ latitude, longitude, address }: OrderLocationMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;
    
    // Validate coordinates
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      setError('Invalid coordinates');
      setIsLoading(false);
      return;
    }

    // Cleanup previous map if exists
    if (map.current) {
      map.current.remove();
      map.current = null;
    }

    try {
      // Create map instance using OpenStreetMap (free, no token needed)
      const mapInstance = L.map(mapContainer.current, {
        center: [latitude, longitude],
        zoom: 14,
        zoomControl: true,
      });

      // Add OpenStreetMap tiles
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapInstance);

      map.current = mapInstance;

      // Add marker at the delivery location
      const marker = L.marker([latitude, longitude], {
        icon: DefaultIcon,
      }).addTo(mapInstance);

      markerRef.current = marker;

      // Add popup to marker
      marker.bindPopup(
        `<div style="padding: 8px;">
          <strong>Delivery Location</strong>
          <p style="margin-top: 4px; font-size: 14px;">${address || 'No address provided'}</p>
        </div>`
      ).openPopup();

      // Map loaded successfully
      mapInstance.whenReady(() => {
        setIsLoading(false);
        setError(null);
      });

    } catch (err) {
      console.error('Error initializing map:', err);
      setError('Failed to initialize map');
      setIsLoading(false);
    }

    // Cleanup
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [latitude, longitude, address]);

  if (error) {
    return (
      <div className="w-full h-[400px] rounded-lg border border-border flex items-center justify-center bg-muted">
        <p className="text-muted-foreground">{error}</p>
      </div>
    );
  }

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden border border-border relative">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
          <p className="text-muted-foreground">Loading map...</p>
        </div>
      )}
      <div ref={mapContainer} className="w-full h-full" style={{ minHeight: '400px' }} />
    </div>
  );
};

export default OrderLocationMap;
