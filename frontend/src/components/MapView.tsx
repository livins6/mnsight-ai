import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { ManganeseOccurrence, MineLocation } from '../types';

// Fix Leaflet default icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface MapViewProps {
  occurrences: ManganeseOccurrence[];
  mines: MineLocation[];
  onLocationClick: (lat: number, lon: number) => void;
  selectedLocation?: { lat: number; lon: number } | null;
  prospectivityLayer?: Array<{ lat: number; lon: number; score: number; confidence: number }>;
  drillCandidates?: Array<{ latitude: number; longitude: number; rank: number; score: number }>;
  flyToTarget?: { lat: number; lon: number; zoom?: number } | null;
}

const MnIcon = L.divIcon({
  className: 'custom-marker mn-marker',
  html: `<div style="
    width: 14px; height: 14px; border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #b5651d, #8B4513 60%);
    border: 2px solid rgba(255,255,255,0.9);
    box-shadow: 0 0 12px rgba(139,69,19,0.9), 0 2px 6px rgba(0,0,0,0.5);
    animation: pulse-dot 2.4s ease-in-out infinite;
  "></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

const MineIcon = L.divIcon({
  className: 'custom-marker mine-marker',
  html: `<div style="
    width: 17px; height: 17px; border-radius: 4px;
    background: linear-gradient(135deg, #ffd700, #ffa000);
    border: 2px solid rgba(0,0,0,0.7);
    box-shadow: 0 0 14px rgba(255,215,0,0.8), 0 2px 6px rgba(0,0,0,0.5);
    animation: pulse-dot 2s ease-in-out infinite;
  "></div>`,
  iconSize: [17, 17],
  iconAnchor: [8, 8],
});

const SelectedIcon = L.divIcon({
  className: 'custom-marker selected-marker',
  html: `<div style="
    width: 22px; height: 22px; border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #ff7a7a, #ff4444 60%);
    border: 3px solid #fff;
    box-shadow: 0 0 18px rgba(255,68,68,0.9);
    animation: pulse-dot 1.2s ease-in-out infinite;
  "></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

const DrillIcon = L.divIcon({
  className: 'custom-marker drill-marker',
  html: `<div style="
    width: 13px; height: 13px; border-radius: 50%;
    background: radial-gradient(circle at 35% 35%, #7dffb0, #00ff88 60%);
    border: 2px solid #006633;
    box-shadow: 0 0 14px rgba(0,255,136,0.9);
    animation: pulse-dot 1.6s ease-in-out infinite;
  "></div>`,
  iconSize: [13, 13],
  iconAnchor: [6, 6],
});

export default function MapView({
  occurrences, mines, onLocationClick, selectedLocation,
  prospectivityLayer = [], drillCandidates = [], flyToTarget = null,
}: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layersRef = useRef<{
    mnLayer: L.LayerGroup;
    mineLayer: L.LayerGroup;
    selectedLayer: L.LayerGroup;
    prospectivityLayer: L.LayerGroup;
    drillLayer: L.LayerGroup;
  } | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current, {
      center: [21.75, 80.15],
      zoom: 8,
      zoomControl: true,
      attributionControl: true,
    });

    // Base layers
    const osm = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    });

    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: '© Esri', maxZoom: 19 }
    );

    const topo = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenTopoMap',
      maxZoom: 17,
    });

    const terrain = L.tileLayer(
      'https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg',
      { attribution: '© Stamen Design', maxZoom: 18 }
    );

    satellite.addTo(map);

    L.control.layers({
      '🗺️ OpenStreetMap': osm,
      '🛰️ Satellite': satellite,
      '🏔️ Topographic': topo,
      '⛰️ Terrain': terrain,
    }, {}, { position: 'topright' }).addTo(map);

    // Scale control
    (L.control as any).scale({ imperial: false }).addTo(map);

    // Coordinate display
    const coordControl = (L.control as any)({ position: 'bottomleft' });
    coordControl.onAdd = function () {
      const div = L.DomUtil.create('div', 'coord-display');
      div.style.cssText = 'background:rgba(0,0,0,0.7);color:#fff;padding:4px 8px;border-radius:4px;font:12px monospace;';
      map.on('mousemove', function (e) {
        div.innerHTML = `${e.latlng.lat.toFixed(4)}°N, ${e.latlng.lng.toFixed(4)}°E`;
      });
      return div;
    };
    coordControl.addTo(map);

    // Click handler
    map.on('click', (e: L.LeafletMouseEvent) => {
      onLocationClick(e.latlng.lat, e.latlng.lng);
    });

    // Dynamic radar sweep overlay (subtle animated gradient)
    const radarOverlay = L.layerGroup().addTo(map);
    const radarDiv = L.DomUtil.create('div', 'radar-sweep');
    radarDiv.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:400;' +
      'background:radial-gradient(circle at 50% 50%, rgba(255,152,0,0.05), transparent 60%);' +
      'animation:orb-drift 12s ease-in-out infinite;';
    map.getContainer().appendChild(radarDiv);

    // Layer groups
    const mnLayer = L.layerGroup().addTo(map);
    const mineLayer = L.layerGroup().addTo(map);
    const selectedLayer = L.layerGroup().addTo(map);
    const prospectivityLG = L.layerGroup().addTo(map);
    const drillLG = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    layersRef.current = { mnLayer, mineLayer, selectedLayer, prospectivityLayer: prospectivityLG, drillLayer: drillLG };

    // Keep the map correct when its container resizes (side panel opens/closes)
    let resizeTimer: ReturnType<typeof setTimeout>;
    const resizeObserver = new ResizeObserver(() => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        map.invalidateSize();
      }, 250);
    });
    resizeObserver.observe(map.getContainer());

    return () => {
      resizeObserver.disconnect();
      clearTimeout(resizeTimer);
      if (radarDiv.parentNode) radarDiv.parentNode.removeChild(radarDiv);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Fly to a target location when requested (search box)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !flyToTarget) return;
    map.flyTo([flyToTarget.lat, flyToTarget.lon], flyToTarget.zoom ?? 13, { duration: 1.2 });
  }, [flyToTarget]);

  // Update manganese occurrences
  useEffect(() => {
    const layers = layersRef.current;
    if (!layers) return;

    layers.mnLayer.clearLayers();
    occurrences.forEach((occ) => {
      const marker = L.marker([occ.latitude, occ.longitude], { icon: MnIcon });
      marker.bindPopup(`
        <div style="font-family:system-ui;min-width:180px">
          <b style="color:#8B4513">⛏️ ${occ.name}</b><br>
          <small>${occ.state} — ${occ.district}</small><br>
          <hr style="margin:4px 0;border-color:#ddd">
          <b>Formation:</b> ${occ.formation || 'Unknown'}<br>
          <b>Host Rock:</b> ${occ.host_rock || 'Unknown'}<br>
          <b>Grade:</b> ${occ.grade_info || 'Unknown'}<br>
          <b>Type:</b> ${occ.mineralization_type || 'Unknown'}<br>
          <small style="color:#666">${occ.latitude.toFixed(4)}°N, ${occ.longitude.toFixed(4)}°E</small>
        </div>
      `);
      layers.mnLayer.addLayer(marker);
    });
  }, [occurrences]);

  // Update mines
  useEffect(() => {
    const layers = layersRef.current;
    if (!layers) return;

    layers.mineLayer.clearLayers();
    mines.forEach((mine) => {
      const marker = L.marker([mine.latitude, mine.longitude], { icon: MineIcon });
      marker.bindPopup(`
        <div style="font-family:system-ui;min-width:180px">
          <b style="color:#B8860B">🏭 ${mine.name}</b><br>
          <small>${mine.state} — ${mine.district}</small><br>
          <hr style="margin:4px 0;border-color:#ddd">
          <b>Operator:</b> ${mine.operator || 'Unknown'}<br>
          <b>Status:</b> <span style="color:${mine.status === 'active' ? 'green' : 'red'}">${mine.status || 'Unknown'}</span><br>
          <small style="color:#666">${mine.latitude.toFixed(4)}°N, ${mine.longitude.toFixed(4)}°E</small>
        </div>
      `);
      layers.mineLayer.addLayer(marker);
    });
  }, [mines]);

  // Update selected location
  useEffect(() => {
    const layers = layersRef.current;
    if (!layers) return;

    layers.selectedLayer.clearLayers();
    if (selectedLocation) {
      const marker = L.marker([selectedLocation.lat, selectedLocation.lon], { icon: SelectedIcon });
      marker.bindPopup(`
        <div style="font-family:system-ui">
          <b>📍 Selected Location</b><br>
          <small>${selectedLocation.lat.toFixed(4)}°N, ${selectedLocation.lon.toFixed(4)}°E</small>
        </div>
      `);
      layers.selectedLayer.addLayer(marker);
    }
  }, [selectedLocation]);

  // Update prospectivity heatmap
  useEffect(() => {
    const layers = layersRef.current;
    if (!layers) return;

    layers.prospectivityLayer.clearLayers();
    prospectivityLayer.forEach((cell, i) => {
      // Color: green (high) → yellow (mid) → red (low)
      const score = cell.score;
      const r = score < 0.5 ? 255 : Math.round(255 * (1 - score));
      const g = score > 0.5 ? 180 : Math.round(180 * score * 2);
      const color = `rgb(${r},${g},60)`;

      const rect = L.rectangle(
        [[cell.lat - 0.025, cell.lon - 0.025], [cell.lat + 0.025, cell.lon + 0.025]],
        {
          color,
          weight: 0.5,
          fillColor: color,
          fillOpacity: 0.3,
          className: `prospectivity-cell cell-${i % 8}`,
        }
      );
      rect.bindPopup(`
        <div style="font-family:system-ui">
          <b>Prospectivity: ${(score * 100).toFixed(1)}%</b><br>
          <small>Confidence: ${(cell.confidence * 100).toFixed(0)}%</small><br>
          <small>${cell.lat.toFixed(2)}°N, ${cell.lon.toFixed(2)}°E</small>
        </div>
      `);
      layers.prospectivityLayer.addLayer(rect);
    });
  }, [prospectivityLayer]);

  // Update drill candidates
  useEffect(() => {
    const layers = layersRef.current;
    if (!layers) return;

    layers.drillLayer.clearLayers();
    drillCandidates.forEach((c) => {
      const marker = L.marker([c.latitude, c.longitude], { icon: DrillIcon });
      marker.bindPopup(`
        <div style="font-family:system-ui">
          <b style="color:#006633">🎯 Drill Candidate #${c.rank}</b><br>
          <b>Prospectivity:</b> ${(c.score * 100).toFixed(1)}%<br>
          <small>${c.latitude.toFixed(4)}°N, ${c.longitude.toFixed(4)}°E</small>
        </div>
      `);
      layers.drillLayer.addLayer(marker);
    });
  }, [drillCandidates]);

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: '100%',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      }}
    />
  );
}
