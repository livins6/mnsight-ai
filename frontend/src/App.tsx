import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MapView from './components/MapView';
import LocationPanel from './components/LocationPanel';
import ProductionPanel from './components/ProductionPanel';
import ProductionTimeline from './components/ProductionTimeline';
import SearchBox from './components/SearchBox';
import WhatIfPanel from './components/WhatIfPanel';
import DrillPanel from './components/DrillPanel';
import { useLocationIntelligence, useMapData } from './hooks/useApi';
import type { DrillCandidate } from './types';
import { Satellite, Factory, Sliders, Crosshair, Eye, EyeOff, Layers } from 'lucide-react';

type ActiveTab = 'map' | 'production' | 'simulator' | 'drill';

const TABS = [
  { id: 'map' as const, label: 'Location Intel', icon: <Satellite size={15} />, color: '#ff9800' },
  { id: 'production' as const, label: 'Production', icon: <Factory size={15} />, color: '#4caf50' },
  { id: 'simulator' as const, label: 'What-If', icon: <Sliders size={15} />, color: '#ab47bc' },
  { id: 'drill' as const, label: 'Drill Here', icon: <Crosshair size={15} />, color: '#ef5350' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('map');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [showLocationPanel, setShowLocationPanel] = useState(false);
  const [showLayers, setShowLayers] = useState(true);
  const [prospectivityCells, setProspectivityCells] = useState<Array<{ lat: number; lon: number; score: number; confidence: number }>>([]);
  const [drillCandidates, setDrillCandidates] = useState<Array<{ latitude: number; longitude: number; rank: number; score: number }>>([]);
  const [selectedMine, setSelectedMine] = useState('Balaghat Mine');
  const [flyToTarget, setFlyToTarget] = useState<{ lat: number; lon: number; zoom?: number } | null>(null);

  const MINE_NAMES = [
    'Balaghat Mine', 'Tirodi Mine', 'Ukwa Mine', 'Kandri Mine', 'Munsar Mine',
    'Beldongri Mine', 'Gumgaon Mine', 'Chikla Mine', 'Dongri Buzurg Mine', 'Sitapatore Mine',
  ];

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

  // Handle search result selection: fly to location + load intel
  const handleSearchSelect = useCallback(async (lat: number, lon: number, label: string, zoom?: number) => {
    setFlyToTarget({ lat, lon, zoom });
    setSelectedLocation({ lat, lon });
    setActiveTab('map');
    await fetchIntel(lat, lon);
    setShowLocationPanel(true);
  }, [fetchIntel]);

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

  // Responsive: panel never exceeds 46% of viewport so the map always stays visible
  const panelWidth = activeTab === 'production' ? 520 : 460;
  const panelCss = `min(${panelWidth}px, 46vw)`;

  return (
    <div style={{
      width: '100vw', height: '100vh', position: 'relative', overflow: 'hidden',
      background: 'radial-gradient(ellipse at 20% 0%, #0f2036 0%, #080e1a 45%, #05080f 100%)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* subtle ambient glow */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0 }}>
        <div style={{
          position: 'absolute', width: 480, height: 480, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,152,0,0.07), transparent 70%)',
          top: -160, right: '10%', filter: 'blur(60px)',
        }} />
        <div style={{
          position: 'absolute', width: 420, height: 420, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(79,195,247,0.06), transparent 70%)',
          bottom: -140, left: '8%', filter: 'blur(60px)',
        }} />
      </div>

      {/* ── Top bar ── */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'relative', zIndex: 100,
          display: 'flex', alignItems: 'center', gap: 18,
          padding: '0 20px', height: 58,
          background: 'rgba(8,14,26,0.72)',
          backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: 'linear-gradient(135deg, #ff9800, #f44336)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15, fontWeight: 900, color: '#fff',
            boxShadow: '0 2px 12px rgba(255,152,0,0.35)',
          }}>M</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: -0.3 }}>
              MnSight <span style={{ color: '#ff9800' }}>AI</span>
            </div>
            <div style={{ fontSize: 8.5, color: 'rgba(255,255,255,0.45)', letterSpacing: 1.2, marginTop: 2 }}>
              SIH 26009 · MOIL LTD
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '8px 14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: activeTab === tab.id ? 'rgba(255,255,255,0.07)' : 'transparent',
                color: activeTab === tab.id ? tab.color : 'rgba(255,255,255,0.55)',
                fontSize: 12.5, fontWeight: 600, position: 'relative',
                transition: 'color 0.25s, background 0.25s',
              }}
              onMouseEnter={(e) => { if (activeTab !== tab.id) e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
              onMouseLeave={(e) => { if (activeTab !== tab.id) e.currentTarget.style.background = 'transparent'; }}
            >
              {tab.icon}
              {tab.label}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="tab-underline"
                  style={{
                    position: 'absolute', bottom: 2, left: '18%', right: '18%',
                    height: 2, borderRadius: 2,
                    background: `linear-gradient(90deg, transparent, ${tab.color}, transparent)`,
                  }}
                  transition={{ type: 'spring', stiffness: 400, damping: 35 }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Search box */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
          <SearchBox
            occurrences={occurrences}
            mines={mines}
            onSelect={handleSearchSelect}
          />

          {/* layer toggle */}
          <button
            onClick={() => setShowLayers(!showLayers)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 12px', borderRadius: 9, cursor: 'pointer',
              border: `1px solid ${showLayers ? 'rgba(76,175,80,0.35)' : 'rgba(255,255,255,0.12)'}`,
              background: showLayers ? 'rgba(76,175,80,0.1)' : 'transparent',
              color: showLayers ? '#81c784' : 'rgba(255,255,255,0.5)',
              fontSize: 11, fontWeight: 600, transition: 'all 0.25s',
            }}
          >
            {showLayers ? <Eye size={13} /> : <EyeOff size={13} />}
            Prospectivity
          </button>
        </div>
      </motion.header>

      {/* ── Main area ── */}
      <div style={{ position: 'relative', zIndex: 1, flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Map container */}
        <div
          style={{
            position: 'relative', height: '100%', flexShrink: 0,
            width: activeTab === 'map' ? '100%' : `calc(100% - ${panelCss})`,
            opacity: activeTab === 'map' ? 1 : 0.55,
            transition: 'width 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.5s ease',
          }}
        >
          <div className="map-wrap" style={{ height: '100%', borderRadius: 0, minHeight: 0 }}>
            <MapView
              occurrences={occurrences}
              mines={mines}
              onLocationClick={handleMapClick}
              selectedLocation={selectedLocation}
              prospectivityLayer={prospectivityCells}
              drillCandidates={drillCandidates}
              flyToTarget={flyToTarget}
            />
          </div>

          {/* Legend */}
          {showLayers && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              style={{
                position: 'absolute', bottom: 20, left: 20, zIndex: 999,
                background: 'rgba(8,14,26,0.82)', backdropFilter: 'blur(14px)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
                padding: '12px 16px', color: '#e8ecf5', fontSize: 11,
                boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Layers size={12} color="#ff9800" /> Layers
              </div>
              {[
                { color: '#2e7d32', label: 'High prospectivity (>70%)' },
                { color: '#8bc34a', label: 'Medium-High (50-70%)' },
                { color: '#ffb300', label: 'Medium (30-50%)' },
                { color: '#ff7043', label: 'Low (<30%)' },
              ].map((item) => (
                <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color, opacity: 0.6 }} />
                  <span style={{ color: 'rgba(255,255,255,0.75)' }}>{item.label}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 8, paddingTop: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#b5651d' }} />
                  <span style={{ color: 'rgba(255,255,255,0.75)' }}>Mn Occurrence</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 9, height: 9, borderRadius: 2, background: '#ffd700' }} />
                  <span style={{ color: 'rgba(255,255,255,0.75)' }}>MOIL Mine</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#00ff88' }} />
                  <span style={{ color: 'rgba(255,255,255,0.75)' }}>Drill Candidate</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Stats chips */}
          <div style={{ position: 'absolute', top: 16, left: 20, zIndex: 999, display: 'flex', gap: 8 }}>
            {[
              { icon: '⛏️', count: occurrences.length, label: 'Mn Occurrences' },
              { icon: '🏭', count: mines.length, label: 'MOIL Mines' },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: 'rgba(8,14,26,0.82)', backdropFilter: 'blur(14px)',
                  border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10,
                  padding: '7px 12px', fontSize: 11,
                  boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
                }}
              >
                <span style={{ fontSize: 13 }}>{s.icon}</span>
                <span style={{ color: '#ffb74d', fontWeight: 800, fontSize: 13 }}>{s.count}</span>
                <span style={{ color: 'rgba(255,255,255,0.6)' }}>{s.label}</span>
              </motion.div>
            ))}
          </div>

          {/* ── Production timeline strip ── */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            style={{
              position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)',
              zIndex: 998, height: 84,
              background: 'rgba(8,14,26,0.85)', backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14,
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
              maxWidth: 'min(620px, calc(100% - 32px))',
              width: 'calc(100% - 32px)',
              overflow: 'hidden',
            }}
          >
            <ProductionTimeline
              mine={selectedMine}
              onMineChange={setSelectedMine}
              mines={MINE_NAMES}
            />
          </motion.div>
        </div>

        {/* ── Side panel (non-map tabs) ── */}
        <AnimatePresence>
          {activeTab !== 'map' && (
            <motion.aside
              key="side-panel"
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 40, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              style={{
                width: panelCss, height: '100%', flexShrink: 0,
                background: 'rgba(8,14,26,0.6)', backdropFilter: 'blur(14px)',
                borderLeft: '1px solid rgba(255,255,255,0.08)',
                overflowY: 'auto', padding: 16,
              }}
            >
              {activeTab === 'production' && (
                <ProductionPanel
                  onDrillHere={handleDrillHere}
                  mine={selectedMine}
                  onMineChange={setSelectedMine}
                />
              )}
              {activeTab === 'simulator' && <WhatIfPanel />}
              {activeTab === 'drill' && <DrillPanel onSelectCandidate={handleDrillSelect} />}
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* ── Location Intelligence Panel ── */}
      <AnimatePresence>
        {showLocationPanel && intelData && activeTab === 'map' && (
          <motion.div
            initial={{ x: 60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 60, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
              position: 'absolute', top: 58, right: 0, bottom: 0, width: 430,
              zIndex: 1500, pointerEvents: 'none',
            }}
          >
            <div style={{ height: '100%', pointerEvents: 'auto' }}>
              <LocationPanel
                data={intelData}
                onClose={() => setShowLocationPanel(false)}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading overlay */}
      <AnimatePresence>
        {intelLoading && activeTab === 'map' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            style={{
              position: 'absolute', top: '45%', left: '50%',
              transform: 'translate(-50%, -50%)', zIndex: 3000,
              background: 'rgba(8,14,26,0.92)', backdropFilter: 'blur(16px)',
              borderRadius: 14, padding: '20px 32px', textAlign: 'center',
              border: '1px solid rgba(255,152,0,0.2)',
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.6, repeat: Infinity, ease: 'linear' }}
              style={{ fontSize: 26, marginBottom: 8, display: 'inline-block' }}
            >
              🧠
            </motion.div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>Analyzing Location…</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
              Computing prospectivity · spectral analysis · geology
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Status bar ── */}
      <div style={{
        position: 'relative', zIndex: 100,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '6px 20px', height: 30,
        background: 'rgba(8,14,26,0.72)', backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        fontSize: 10, color: 'rgba(255,255,255,0.4)',
        flexShrink: 0,
      }}>
        <span>MnSight AI v1.0 — SIH 26009 — Ministry of Steel / MOIL Ltd.</span>
        <span style={{ textAlign: 'right' }}>
          AI-assisted Prospectivity (NOT Reserve Estimation) · Sentinel-2 = surface indicators only
        </span>
      </div>
    </div>
  );
}