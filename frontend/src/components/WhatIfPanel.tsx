import { useState } from 'react';
import { useWhatIf } from '../hooks/useApi';
import { Sliders, Play, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react';
import type { WhatIfParameters } from '../types';

export default function WhatIfPanel() {
  const { result, loading, simulate } = useWhatIf();
  const [params, setParams] = useState<WhatIfParameters>({
    rainfall_change_pct: 0,
    equipment_uptime_pct: 85,
    blast_delay_days: 0,
    production_target_change_pct: 0,
    new_mine_open: false,
    rainfall_scenario: 'normal',
  });

  const handleSimulate = () => simulate(params);

  const update = (field: keyof WhatIfParameters, value: any) => {
    setParams((p) => ({ ...p, [field]: value }));
  };

  return (
    <div style={{
      background: 'rgba(10,18,32,0.85)', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      overflow: 'hidden', fontFamily: 'system-ui, sans-serif', color: '#e8ecf5',
      border: '1px solid rgba(255,255,255,0.1)',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #4a148c 0%, #7b1fa2 100%)',
        color: '#fff', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Sliders size={18} />
        <span style={{ fontSize: 15, fontWeight: 700 }}>What-If Simulator</span>
      </div>

      <div style={{ padding: 16 }}>
        {/* Rainfall Scenario */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'block', marginBottom: 4 }}>
            🌧️ Weather Scenario
          </label>
          <div style={{ display: 'flex', gap: 6 }}>
            {['normal', 'drought', 'flood', 'monsoon_heavy'].map((s) => (
              <button
                key={s}
                onClick={() => update('rainfall_scenario', s)}
                style={{
                  flex: 1, padding: '6px 4px', borderRadius: 6, border: '2px solid',
                  borderColor: params.rainfall_scenario === s ? '#ab47bc' : 'rgba(255,255,255,0.15)',
                  background: params.rainfall_scenario === s ? 'rgba(171,71,188,0.2)' : 'rgba(255,255,255,0.04)',
                  color: params.rainfall_scenario === s ? '#ce93d8' : 'rgba(255,255,255,0.6)',
                  fontWeight: params.rainfall_scenario === s ? 700 : 400,
                  fontSize: 11, cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
                {s === 'normal' ? '☀️ Normal' : s === 'drought' ? '🏜️ Drought' : s === 'flood' ? '🌊 Flood' : '⛈️ Heavy'}
              </button>
            ))}
          </div>
        </div>

        {/* Rainfall Change */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
            <span>🌧️ Rainfall Change</span>
            <span style={{ color: '#7b1fa2' }}>{params.rainfall_change_pct > 0 ? '+' : ''}{params.rainfall_change_pct}%</span>
          </label>
          <input
            type="range" min={-50} max={100} step={5}
            value={params.rainfall_change_pct}
            onChange={(e) => update('rainfall_change_pct', Number(e.target.value))}
            style={{ width: '100%', accentColor: '#7b1fa2' }}
          />
        </div>

        {/* Equipment Uptime */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
            <span>⚙️ Equipment Uptime</span>
            <span style={{ color: params.equipment_uptime_pct < 75 ? '#e53935' : '#2e7d32' }}>
              {params.equipment_uptime_pct}%
            </span>
          </label>
          <input
            type="range" min={30} max={100} step={5}
            value={params.equipment_uptime_pct}
            onChange={(e) => update('equipment_uptime_pct', Number(e.target.value))}
            style={{ width: '100%', accentColor: '#7b1fa2' }}
          />
        </div>

        {/* Blast Delays */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
            <span>💥 Blast Delays</span>
            <span style={{ color: params.blast_delay_days > 10 ? '#e53935' : '#555' }}>
              {params.blast_delay_days} days
            </span>
          </label>
          <input
            type="range" min={0} max={60} step={5}
            value={params.blast_delay_days}
            onChange={(e) => update('blast_delay_days', Number(e.target.value))}
            style={{ width: '100%', accentColor: '#7b1fa2' }}
          />
        </div>

        {/* Target Change */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ fontSize: 12, fontWeight: 600, display: 'flex', justifyContent: 'space-between' }}>
            <span>🎯 Target Change</span>
            <span style={{ color: '#7b1fa2' }}>{params.production_target_change_pct > 0 ? '+' : ''}{params.production_target_change_pct}%</span>
          </label>
          <input
            type="range" min={-30} max={50} step={5}
            value={params.production_target_change_pct}
            onChange={(e) => update('production_target_change_pct', Number(e.target.value))}
            style={{ width: '100%', accentColor: '#7b1fa2' }}
          />
        </div>

        {/* New Mine */}
        <div style={{ marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <input
            type="checkbox"
            checked={params.new_mine_open}
            onChange={(e) => update('new_mine_open', e.target.checked)}
            style={{ accentColor: '#7b1fa2' }}
          />
          <label style={{ fontSize: 12, fontWeight: 600 }}>🏭 Open New Mine (+15% production)</label>
        </div>

        {/* Simulate Button */}
        <button
          onClick={handleSimulate}
          disabled={loading}
          style={{
            width: '100%', padding: '10px 16px', borderRadius: 8, border: 'none',
            background: 'linear-gradient(135deg, #7b1fa2, #4a148c)',
            color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          <Play size={16} />
          {loading ? 'Simulating...' : 'Run Simulation'}
        </button>

        {/* Results */}
        {result && (
          <div style={{ marginTop: 16, padding: 14, background: 'rgba(171,71,188,0.1)', borderRadius: 10, border: '1px solid rgba(171,71,188,0.25)' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#4a148c', marginBottom: 10 }}>
              Simulation Results
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <div style={{ flex: 1, textAlign: 'center', padding: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: '#888' }}>BASE</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>{Math.round(result.base_predicted / 1000)}kt</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', color: '#7b1fa2' }}>
                <ArrowRight size={18} />
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: '#888' }}>SCENARIO</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: result.impact_on_production >= 0 ? '#2e7d32' : '#c62828' }}>
                  {Math.round(result.scenario_predicted / 1000)}kt
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex', gap: 8, padding: '6px 10px', borderRadius: 8,
              background: result.impact_on_production >= 0 ? '#e8f5e9' : '#fce4ec',
              marginBottom: 10, fontSize: 12, alignItems: 'center',
            }}>
              {result.impact_on_production >= 0 ? <TrendingUp size={14} color="#2e7d32" /> : <TrendingDown size={14} color="#c62828" />}
              <span style={{ fontWeight: 600, color: result.impact_on_production >= 0 ? '#2e7d32' : '#c62828' }}>
                {result.impact_on_production >= 0 ? '+' : ''}{Math.round(result.impact_on_production / 1000)}kt
                ({result.impact_on_production >= 0 ? '+' : ''}{((result.impact_on_production / result.base_predicted) * 100).toFixed(0)}%)
              </span>
            </div>

            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>
              <b>Shortfall Risk:</b> {((result.impact_on_shortfall_risk) > 0 ? 'Increased by ' : 'Decreased by ')
                }{Math.abs(result.impact_on_shortfall_risk * 100).toFixed(1)}%
            </div>

            {result.recommendations.length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#4a148c', marginBottom: 4 }}>Recommendations:</div>
                {result.recommendations.map((r, i) => (
                  <div key={i} style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', marginBottom: 2 }}>→ {r}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
