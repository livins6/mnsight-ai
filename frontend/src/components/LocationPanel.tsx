import type { LocationIntelligence } from '../types';
import { MapPin, Layers, Mountain, Cloud, Compass, Target, AlertTriangle, CheckCircle, Brain, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface Props {
  data: LocationIntelligence;
  onClose: () => void;
}

function ScoreGauge({ score, label, color }: { score: number; label: string; color: string }) {
  const pct = Math.round(score * 100);
  return (
    <div style={{ textAlign: 'center', flex: 1, minWidth: 80 }}>
      <svg viewBox="0 0 100 60" style={{ width: '100%', maxWidth: 100 }}>
        <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke="#e0e0e0" strokeWidth="8" strokeLinecap="round" />
        <path
          d="M 10 55 A 40 40 0 0 1 90 55"
          fill="none" stroke={color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={`${pct * 1.26} 126`}
        />
        <text x="50" y="45" textAnchor="middle" fontSize="16" fontWeight="bold" fill={color}>{pct}%</text>
      </svg>
      <div style={{ fontSize: 11, color: '#666', marginTop: -4 }}>{label}</div>
    </div>
  );
}

function FeatureBar({ name, value, max, color }: { name: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
        <span>{name}</span>
        <span style={{ fontWeight: 600 }}>{typeof value === 'number' ? (value < 1 && value > -1 ? value.toFixed(4) : value.toFixed(2)) : value}</span>
      </div>
      <div style={{ height: 6, background: '#eee', borderRadius: 3 }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.5s' }} />
      </div>
    </div>
  );
}

function Section({ title, icon, children, defaultOpen = true }: { title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '10px 12px', background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 700, color: '#e8ecf5', textAlign: 'left',
        }}
      >
        {icon}
        <span style={{ flex: 1 }}>{title}</span>
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && <div style={{ padding: '0 12px 12px' }}>{children}</div>}
    </div>
  );
}

function riskColor(risk: string) {
  switch (risk) {
    case 'high': return '#e53935';
    case 'medium': return '#fb8c00';
    case 'low': return '#43a047';
    default: return '#888';
  }
}

export default function LocationPanel({ data, onClose }: Props) {
  const { prospectivity: p, spectral, terrain, environmental, geological, shap_top_features, recommendations } = data;

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, width: 420, height: '100%',
      background: 'rgba(8,14,26,0.92)',
      backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
      boxShadow: '-6px 0 40px rgba(0,0,0,0.5), inset -1px 0 0 rgba(255,255,255,0.08)',
      overflowY: 'auto', zIndex: 1000, fontFamily: 'system-ui, sans-serif',
      color: '#e8ecf5',
      borderRadius: '18px 0 0 18px',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a237e 0%, #283593 100%)',
        color: '#fff', padding: '16px 16px 12px', position: 'relative',
        borderBottom: '1px solid rgba(255,255,255,0.12)',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 12, right: 12, background: 'rgba(255,255,255,0.2)',
            border: 'none', borderRadius: '50%', width: 28, height: 28, color: '#fff',
            cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >×</button>

        <div style={{ fontSize: 11, opacity: 0.8, marginBottom: 4 }}>📍 LOCATION INTELLIGENCE</div>
        <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>
          <MapPin size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          {data.latitude.toFixed(4)}°N, {data.longitude.toFixed(4)}°E
        </div>
        <div style={{ fontSize: 12, opacity: 0.85 }}>{geological.formation} — {geological.rock_type}</div>
        <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4 }}>
          {data.district ? `${data.district}, ` : ''}{data.state}
        </div>

        {/* Score gauges */}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <ScoreGauge score={p.prospectivity_score} label="Prospectivity" color={p.prospectivity_score > 0.6 ? '#43a047' : p.prospectivity_score > 0.3 ? '#fb8c00' : '#e53935'} />
          <ScoreGauge score={p.confidence} label="Confidence" color={p.confidence > 0.6 ? '#1e88e5' : p.confidence > 0.3 ? '#fb8c00' : '#e53935'} />
          <div style={{ textAlign: 'center', flex: 1, minWidth: 80 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              background: riskColor(p.confidence_level), color: '#fff',
              padding: '4px 10px', borderRadius: 12, fontSize: 12, fontWeight: 700,
              marginTop: 8,
            }}>
              {p.confidence_level.toUpperCase()}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>Quality</div>
          </div>
        </div>
      </div>

      {/* Geological Context */}
      <Section title="Geological Context" icon={<Layers size={14} color="#ffb74d" />}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
          <div><b>Formation:</b><br />{geological.formation}</div>
          <div><b>Rock Type:</b><br />{geological.rock_type}</div>
          <div><b>Dist. to Mn Deposit:</b><br />{geological.distance_to_known_mn_km} km</div>
          <div><b>Dist. to Fault:</b><br />{geological.distance_to_fault_km} km</div>
          <div><b>Mn Occurrences (10km):</b><br />{geological.mn_occurrence_count_10km}</div>
          <div><b>Lithology Score:</b><br />{(geological.lithology_score * 100).toFixed(0)}%</div>
        </div>
      </Section>

      {/* Spectral Analysis */}
      <Section title="Spectral Analysis (Sentinel-2)" icon={<Compass size={14} color="#1565c0" />}>
        <FeatureBar name="NDVI" value={spectral.ndvi} max={1} color="#4caf50" />
        <FeatureBar name="NDWI" value={spectral.ndwi + 1} max={2} color="#2196f3" />
        <FeatureBar name="SAVI" value={spectral.savi} max={1} color="#ff9800" />
        <FeatureBar name="SWIR Ratio" value={spectral.swir_ratio} max={2} color="#9c27b0" />
        <FeatureBar name="Red-Edge NDVI" value={spectral.red_edge_ndvi} max={1} color="#e91e63" />
        <FeatureBar name="Iron Oxide Ratio" value={spectral.iron_oxide_ratio} max={3} color="#f44336" />
        <FeatureBar name="Ferrous Mineral" value={spectral.ferrous_mineral} max={2} color="#795548" />
      </Section>

      {/* Terrain */}
      <Section title="Terrain (DEM)" icon={<Mountain size={14} color="#5d4037" />} defaultOpen={false}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
          <div><b>Elevation:</b><br />{terrain.elevation_m} m</div>
          <div><b>Slope:</b><br />{terrain.slope_deg}°</div>
          <div><b>Aspect:</b><br />{terrain.aspect_deg}°</div>
          <div><b>Curvature:</b><br />{terrain.curvature}</div>
          <div><b>Ruggedness:</b><br />{terrain.ruggedness}</div>
          <div><b>Hillshade:</b><br />{terrain.hillshade}</div>
        </div>
      </Section>

      {/* Environmental */}
      <Section title="Environmental" icon={<Cloud size={14} color="#00897b" />} defaultOpen={false}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
          <div><b>Soil Moisture:</b><br />{environmental.soil_moisture}</div>
          <div><b>LST:</b><br />{environmental.land_surface_temp_c}°C</div>
          <div><b>Rainfall (30d):</b><br />{environmental.rainfall_30d_mm} mm</div>
          <div><b>Rainfall (7d):</b><br />{environmental.rainfall_7d_mm} mm</div>
          <div><b>Rainfall Anomaly:</b><br />{environmental.rainfall_anomaly > 0 ? '+' : ''}{(environmental.rainfall_anomaly * 100).toFixed(0)}%</div>
        </div>
      </Section>

      {/* AI Explanation */}
      <Section title="🧠 AI Explanation (Why?)" icon={<Brain size={14} color="#ce93d8" />}>
        <div style={{ fontSize: 12, marginBottom: 8 }}>
          <div style={{
            background: 'rgba(206,147,216,0.12)', padding: '8px 10px', borderRadius: 8,
            fontSize: 11, color: '#ce93d8', lineHeight: 1.5,
          }}>
            The prospectivity score of <b>{(p.prospectivity_score * 100).toFixed(1)}%</b> is driven primarily by:
          </div>
        </div>
        {shap_top_features.slice(0, 8).map((f, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0',
            borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 12,
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              background: f.direction === 'positive' ? '#e8f5e9' : '#fbe9e7',
              color: f.direction === 'positive' ? '#2e7d32' : '#c62828',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, fontWeight: 700, flexShrink: 0,
            }}>
              {f.direction === 'positive' ? '+' : '−'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{f.feature_name}</div>
              <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11 }}>{f.description}</div>
            </div>
            <div style={{
              fontSize: 11, fontWeight: 700, color: f.direction === 'positive' ? '#2e7d32' : '#c62828',
            }}>
              {f.shap_value > 0 ? '+' : ''}{(f.shap_value * 100).toFixed(2)}
            </div>
          </div>
        ))}
      </Section>

      {/* Recommendations */}
      <Section title="🎯 Recommendations" icon={<Lightbulb size={14} color="#f9a825" />}>
        {recommendations.map((rec, i) => (
          <div key={i} style={{
            background: rec.priority === 'high' ? 'rgba(255,152,0,0.12)' : rec.priority === 'medium' ? 'rgba(79,195,247,0.1)' : 'rgba(255,255,255,0.05)',
            borderLeft: `3px solid ${rec.priority === 'high' ? '#e65100' : rec.priority === 'medium' ? '#1565c0' : '#9e9e9e'}`,
            padding: '8px 10px', borderRadius: '0 8px 8px 0', marginBottom: 8, fontSize: 12,
          }}>
            <div style={{ fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
              <span>{rec.action}</span>
              <span style={{
                fontSize: 10, padding: '1px 6px', borderRadius: 8,
                background: rec.priority === 'high' ? '#e65100' : rec.priority === 'medium' ? '#1565c0' : '#757575',
                color: '#fff',
              }}>{rec.priority}</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>{rec.rationale}</div>
            {rec.estimated_cost && (
              <div style={{ marginTop: 4, fontSize: 11 }}>
                <b>Est. Cost:</b> {rec.estimated_cost} {rec.timeline && `| <b>Timeline:</b> ${rec.timeline}`}
              </div>
            )}
          </div>
        ))}
      </Section>

      {/* Data Provenance */}
      <Section title="📋 Data Provenance" icon={<AlertTriangle size={14} color="#90a4ae" />} defaultOpen={false}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
          {Object.entries(data.data_provenance).map(([key, val]) => (
            <div key={key} style={{ marginBottom: 4 }}>
              <b>{key}:</b> {val}
            </div>
          ))}
        </div>
      </Section>

      {/* Model disclaimer */}
      <div style={{
        padding: '12px', background: 'rgba(255,152,0,0.1)', borderTop: '1px solid rgba(255,152,0,0.25)',
        fontSize: 11, color: '#ffcc80', lineHeight: 1.5,
      }}>
        <AlertTriangle size={12} style={{ verticalAlign: 'middle', marginRight: 4 }} />
        <b>Scientific Disclaimer:</b> This is AI-assisted <b>manganese prospectivity / resource potential</b>.
        Sentinel-2 provides surface indicators only. Actual mineral reserve estimation requires geological
        validation, drilling, and appropriate resource/reserve estimation standards (e.g., JORC, NCRB).
      </div>
    </div>
  );
}
