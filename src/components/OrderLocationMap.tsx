import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

interface OrderLocationMapProps {
  latitude: number;
  longitude: number;
  address: string;
}

const OrderLocationMap = ({ latitude, longitude, address }: OrderLocationMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current) return;

    // Initialize map with Mapbox public token
    mapboxgl.accessToken = 'pk.eyJ1IjoibG92YWJsZS1haSIsImEiOiJjbTN2YjlrNzkwMzJrMnFzN29yNGU0MzkyIn0.lc2PaoKFb7VzWy9YBu7o_g';
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [longitude, latitude],
      zoom: 14,
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl(),
      'top-right'
    );

    // Add a marker at the delivery location
    new mapboxgl.Marker({ color: 'hsl(var(--primary))' })
      .setLngLat([longitude, latitude])
      .setPopup(
        new mapboxgl.Popup({ offset: 25 })
          .setHTML(`<div class="p-2"><strong>Delivery Location</strong><p class="text-sm mt-1">${address}</p></div>`)
      )
      .addTo(map.current);

    // Cleanup
    return () => {
      map.current?.remove();
    };
  }, [latitude, longitude, address]);

  return (
    <div className="w-full h-[400px] rounded-lg overflow-hidden border border-border">
      <div ref={mapContainer} className="w-full h-full" />
    </div>
  );
};

export default OrderLocationMap;
