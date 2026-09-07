import { useState, useEffect, useCallback } from 'react';
import MapView from './components/MapView';
import LocationPanel from './components/LocationPanel';
import ProductionPanel from './components/ProductionPanel';
import WhatIfPanel from './components/WhatIfPanel';
import DrillPanel from './components/DrillPanel';
import { useLocationIntelligence, useMapData } from './hooks/useApi';
import type { LocationIntelligence, DrillCandidate } from './types';
import { MapPin, Layers, Factory, Sliders, Target, Eye, EyeOff, ChevronLeft, ChevronRight, Menu } from 'lucide-react';

type ActiveTab = 'map' | 'production' | 'simulator' | 'drill';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('map');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [showLocationPanel, setShowLocationPanel] = useState(false);
  const [showLayers, setShowLayers] = useState(true);
  const [prospectivityCells, setProspectivityCells] = useState<Array<{ lat: number; lon: number; score: number; confidence: number }>>([]);
  const [drillCandidates, setDrillCandidates] = useState<Array<{ latitude: number; longitude: number; rank: number; score: number }>>([]);

  const { data: intelData, loading: intelLoading, fetchIntel } = useLocationIntelligence();
  const { occurrences, mines, fetchMapData } = useMapData();

  // Fetch map data on mount
  useEffect(() => {
    fetchMapData();
  }, [fetchMapData]);

  // Generate prospectivity grid on layer toggle
  useEffect(() => {
    if (!showLayers) {
      setProspectivityCells([]);
      return;
    }

    async function loadGrid() {
      try {
        const res = await fetch('/api/prospectivity-grid?lat_min=21.0&lat_max=22.5&lon_min=79.0&lon_max=81.0&resolution=0.1');
        const data = await res.json();
        setProspectivityCells(
          data.cells.map((c: any) => ({
            lat: c.lat,
            lon: c.lon,
            score: c.prospectivity,
            confidence: c.confidence,
          }))
        );
      } catch (e) {
        console.error('Grid load error:', e);
      }
    }

    loadGrid();
  }, [showLayers]);

  // Handle map click
  const handleMapClick = useCallback(async (lat: number, lon: number) => {
    setSelectedLocation({ lat, lon });
    await fetchIntel(lat, lon);
    setShowLocationPanel(true);
    setActiveTab('map');
  }, [fetchIntel]);

  // Handle drill candidate select
  const handleDrillSelect = useCallback(async (lat: number, lon: number) => {
    setSelectedLocation({ lat, lon });
    await fetchIntel(lat, lon);
    setShowLocationPanel(true);
  }, [fetchIntel]);

  // Handle Drill Here button from location panel
  const handleDrillHere = useCallback(async () => {
    if (!selectedLocation) return;
    try {
      const res = await fetch(
        `/api/drill-prioritization?center_lat=${selectedLocation.lat}&center_lon=${selectedLocation.lon}&radius_km=15`
      );
      const data = await res.json();
      setDrillCandidates(
        data.candidates.map((c: any) => ({
          latitude: c.latitude,
          longitude: c.longitude,
          rank: c.rank,
          score: c.prospectivity_score,
        }))
      );
    } catch (e) {
      console.error('Drill candidates error:', e);
    }
  }, [selectedLocation]);

  return (
    <div style={{
      width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif', overflow: 'hidden',
    }}>
      {/* Top Navigation */}
      <div style={{
        background: 'linear-gradient(135deg, #0d1b2a 0%, #1b2838 100%)',
        color: '#fff', padding: '0 16px', height: 52,
        display: 'flex', alignItems: 'center', gap: 0,
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)', zIndex: 100,
        flexShrink: 0,
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 24 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #ff9800, #f44336)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, fontWeight: 800, color: '#fff',
          }}>M</div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.5 }}>
              MnSight <span style={{ color: '#ff9800' }}>AI</span>
            </div>
            <div style={{ fontSize: 9, opacity: 0.6, marginTop: -2 }}>
              AI + Space Technology Mining Intelligence
            </div>
          </div>
        </div>

        {/* Nav Tabs */}
        <div style={{ display: 'flex', gap: 2, flex: 1 }}>
          {([
            { id: 'map' as const, label: '🗺️ Location Intel', icon: <MapPin size={14} /> },
            { id: 'production' as const, label: '📊 Production', icon: <Factory size={14} /> },
            { id: 'simulator' as const, label: '🔮 What-If', icon: <Sliders size={14} /> },
            { id: 'drill' as const, label: '🎯 Drill Here', icon: <Target size={14} /> },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 8, border: 'none',
                background: activeTab === tab.id ? 'rgba(255,255,255,0.15)' : 'transparent',
                color: activeTab === tab.id ? '#ff9800' : 'rgba(255,255,255,0.6)',
                fontSize: 12, fontWeight: activeTab === tab.id ? 700 : 400,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => setShowLayers(!showLayers)}
            style={{
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '6px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)',
              background: showLayers ? 'rgba(255,255,255,0.15)' : 'transparent',
              color: showLayers ? '#4caf50' : 'rgba(255,255,255,0.5)',
              fontSize: 11, cursor: 'pointer',
            }}
          >
            {showLayers ? <Eye size={12} /> : <EyeOff size={12} />}
            Prospectivity
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden', position: 'relative' }}>
        {/* Map (always visible) */}
        <div style={{
          flex: 1, position: 'relative',
          opacity: activeTab === 'map' ? 1 : 0.4,
          transition: 'opacity 0.3s',
          pointerEvents: activeTab === 'map' ? 'auto' : 'none',
        }}>
          <MapView
            occurrences={occurrences}
            mines={mines}
            onLocationClick={handleMapClick}
            selectedLocation={selectedLocation}
            prospectivityLayer={prospectivityCells}
            drillCandidates={drillCandidates}
          />

          {/* Layer legend */}
          {showLayers && activeTab === 'map' && (
            <div style={{
              position: 'absolute', bottom: 20, left: 20, zIndex: 999,
              background: 'rgba(255,255,255,0.95)', borderRadius: 10, padding: '10px 14px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.15)', fontSize: 11,
            }}>
              <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 12 }}>Prospectivity Legend</div>
              {[
                { color: '#2e7d32', label: 'High (>70%)' },
                { color: '#8bc34a', label: 'Medium-High (50-70%)' },
                { color: '#ffb300', label: 'Medium (30-50%)' },
                { color: '#ff7043', label: 'Low (<30%)' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 3, background: item.color, opacity: 0.5 }} />
                  <span>{item.label}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #eee', marginTop: 6, paddingTop: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#8B4513', border: '1px solid #fff' }} />
                  <span>Mn Occurrence</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: '#FFD700', border: '1px solid #000' }} />
                  <span>MOIL Mine</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#00ff88', border: '1px solid #006633' }} />
                  <span>Drill Candidate</span>
                </div>
              </div>
            </div>
          )}

          {/* Quick stats overlay */}
          <div style={{
            position: 'absolute', top: 12, left: 12, zIndex: 999,
            display: 'flex', gap: 8,
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.95)', borderRadius: 8, padding: '6px 12px',
              boxShadow: '0 1px 6px rgba(0,0,0,0.12)', fontSize: 11, fontWeight: 600,
            }}>
              <span style={{ color: '#8B4513' }}>⛏️</span> {occurrences.length} Mn Occurrences
            </div>
            <div style={{
              background: 'rgba(255,255,255,0.95)', borderRadius: 8, padding: '6px 12px',
              boxShadow: '0 1px 6px rgba(0,0,0,0.12)', fontSize: 11, fontWeight: 600,
            }}>
              <span style={{ color: '#B8860B' }}>🏭</span> {mines.length} MOIL Mines
            </div>
          </div>
        </div>

        {/* Right sidebar for non-map tabs */}
        {activeTab !== 'map' && (
          <div style={{
            width: activeTab === 'production' ? 500 : 400,
            overflowY: 'auto', padding: 16, background: '#f5f5f5',
            flexShrink: 0,
          }}>
            {activeTab === 'production' && <ProductionPanel onDrillHere={handleDrillHere} />}
            {activeTab === 'simulator' && <WhatIfPanel />}
            {activeTab === 'drill' && <DrillPanel onSelectCandidate={handleDrillSelect} />}
          </div>
        )}

        {/* Location Intelligence Panel */}
        {showLocationPanel && intelData && activeTab === 'map' && (
          <LocationPanel
            data={intelData}
            onClose={() => setShowLocationPanel(false)}
          />
        )}

        {/* Loading overlay for intel */}
        {intelLoading && activeTab === 'map' && (
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)', zIndex: 2000,
            background: 'rgba(255,255,255,0.95)', borderRadius: 12, padding: '20px 30px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)', textAlign: 'center',
          }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>🧠</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Analyzing Location...</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Computing prospectivity, spectral analysis, and geological context</div>
          </div>
        )}
      </div>

      {/* Status bar */}
      <div style={{
        background: '#0d1b2a', color: 'rgba(255,255,255,0.5)',
        padding: '4px 16px', fontSize: 10, display: 'flex', justifyContent: 'space-between',
        flexShrink: 0,
      }}>
        <span>MnSight AI v1.0 — SIH 26009 — Ministry of Steel / MOIL Ltd.</span>
        <span>AI-assisted Prospectivity (NOT Reserve Estimation) | Click any location for intelligence report</span>
      </div>
    </div>
  );
}
