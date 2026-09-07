import { useState } from 'react';
import { useDrillCandidates } from '../hooks/useApi';
import { Target, MapPin, ChevronRight, Award, Clock, IndianRupee } from 'lucide-react';
import type { DrillCandidate } from '../types';

interface Props {
  onSelectCandidate: (lat: number, lon: number) => void;
}

export default function DrillPanel({ onSelectCandidate }: Props) {
  const { candidates, loading, fetchCandidates } = useDrillCandidates();
  const [centerLat, setCenterLat] = useState('21.75');
  const [centerLon, setCenterLon] = useState('80.15');

  const handleSearch = () => {
    fetchCandidates(parseFloat(centerLat), parseFloat(centerLon));
  };

  return (
    <div style={{
      background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      overflow: 'hidden', fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #e65100 0%, #f57c00 100%)',
        color: '#fff', padding: '14px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Target size={18} />
          <span style={{ fontSize: 15, fontWeight: 700 }}>Drill Here Next</span>
        </div>
        <div style={{ fontSize: 11, opacity: 0.85, lineHeight: 1.4 }}>
          AI-ranked exploration priorities based on prospectivity, geological context, and proximity to known deposits.
        </div>
      </div>

      <div style={{ padding: 16 }}>
        {/* Search */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: '#888' }}>Center Lat</label>
            <input
              type="number" step="0.01" value={centerLat}
              onChange={(e) => setCenterLat(e.target.value)}
              style={{
                width: '100%', padding: '6px 8px', borderRadius: 6,
                border: '1px solid #ddd', fontSize: 12,
              }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, color: '#888' }}>Center Lon</label>
            <input
              type="number" step="0.01" value={centerLon}
              onChange={(e) => setCenterLon(e.target.value)}
              style={{
                width: '100%', padding: '6px 8px', borderRadius: 6,
                border: '1px solid #ddd', fontSize: 12,
              }}
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading}
            style={{
              padding: '6px 14px', borderRadius: 6, border: 'none',
              background: '#e65100', color: '#fff', fontWeight: 700,
              fontSize: 12, cursor: 'pointer', alignSelf: 'flex-end',
            }}
          >
            {loading ? '...' : 'Rank'}
          </button>
        </div>

        {/* Candidates */}
        {candidates.length > 0 && (
          <div style={{ maxHeight: 350, overflowY: 'auto' }}>
            {candidates.map((c) => (
              <div
                key={c.rank}
                onClick={() => onSelectCandidate(c.latitude, c.longitude)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  border: '1px solid #eee', borderRadius: 10, marginBottom: 8,
                  cursor: 'pointer', transition: 'all 0.2s',
                  background: c.rank <= 3 ? '#fff8e1' : '#fff',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#e65100'; e.currentTarget.style.background = '#fff3e0'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#eee'; e.currentTarget.style.background = c.rank <= 3 ? '#fff8e1' : '#fff'; }}
              >
                {/* Rank badge */}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: c.rank <= 3 ? 'linear-gradient(135deg, #e65100, #f57c00)' : '#e0e0e0',
                  color: c.rank <= 3 ? '#fff' : '#555',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: 13, flexShrink: 0,
                }}>
                  #{c.rank}
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>
                      {(c.prospectivity_score * 100).toFixed(0)}% Prospectivity
                    </span>
                    <span style={{
                      fontSize: 10, padding: '1px 6px', borderRadius: 8,
                      background: c.confidence > 0.6 ? '#e8f5e9' : '#fff3e0',
                      color: c.confidence > 0.6 ? '#2e7d32' : '#e65100',
                    }}>
                      {(c.confidence * 100).toFixed(0)}% conf.
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#666', marginTop: 2, lineHeight: 1.3 }}>
                    {c.priority_reason}
                  </div>
                  <div style={{ fontSize: 10, color: '#999', marginTop: 2 }}>
                    {c.latitude.toFixed(4)}°N, {c.longitude.toFixed(4)}°E
                  </div>
                </div>

                <ChevronRight size={16} color="#ccc" />
              </div>
            ))}
          </div>
        )}

        {candidates.length === 0 && !loading && (
          <div style={{ padding: 24, textAlign: 'center', color: '#999', fontSize: 13 }}>
            Set a center point and click "Rank" to find the best drill locations.
          </div>
        )}
      </div>
    </div>
  );
}
