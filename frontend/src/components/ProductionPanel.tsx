import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, Area, AreaChart } from 'recharts';
import { useProductionForecast } from '../hooks/useApi';
import { BarChart3, TrendingDown, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import type { ProductionForecast } from '../types';

const MINE_NAMES = [
  'Dongri Buzurg Mine', 'Munsur Buzurg Mine', 'Kandri Mine', 'Kosmi Mine',
  'Shahi Mine', 'Tirodi Mine', 'Jagannathpur Mine', 'Chikla Mine',
  'Balaghat Mine', 'Witdongri Mine',
];

interface Props {
  onDrillHere?: () => void;
}

function RiskBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    high: '#e53935', medium: '#fb8c00', low: '#43a047',
  };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: colors[level] || '#888', color: '#fff',
      padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 700,
    }}>
      {level === 'high' ? <TrendingDown size={11} /> : level === 'low' ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}
      {level.toUpperCase()} RISK
    </span>
  );
}

export default function ProductionPanel({ onDrillHere }: Props) {
  const [selectedMine, setSelectedMine] = useState('Dongri Buzurg Mine');
  const [monthsAhead, setMonthsAhead] = useState(6);
  const { forecasts, loading, fetchForecast } = useProductionForecast();
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const handleFetch = () => {
    fetchForecast(selectedMine, monthsAhead);
  };

  // Transform for chart
  const chartData = forecasts.map((f) => ({
    month: f.month,
    predicted: Math.round(f.predicted_tonnes / 1000),
    target: Math.round(f.predicted_target / 1000),
    risk: Math.round(f.shortfall_risk * 100),
  }));

  const avgRisk = forecasts.length > 0
    ? forecasts.reduce((s, f) => s + f.shortfall_risk, 0) / forecasts.length
    : 0;

  return (
    <div style={{
      background: '#fff', borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
      overflow: 'hidden', fontFamily: 'system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1b5e20 0%, #2e7d32 100%)',
        color: '#fff', padding: '14px 16px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <BarChart3 size={18} />
          <span style={{ fontSize: 15, fontWeight: 700 }}>Production Forecasting</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: 11, opacity: 0.8 }}>Mine</label>
            <select
              value={selectedMine}
              onChange={(e) => setSelectedMine(e.target.value)}
              style={{
                width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 12,
              }}
            >
              {MINE_NAMES.map((m) => <option key={m} value={m} style={{ color: '#333' }}>{m}</option>)}
            </select>
          </div>
          <div style={{ width: 80 }}>
            <label style={{ fontSize: 11, opacity: 0.8 }}>Months</label>
            <select
              value={monthsAhead}
              onChange={(e) => setMonthsAhead(Number(e.target.value))}
              style={{
                width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.3)',
                background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 12,
              }}
            >
              {[3, 6, 9, 12, 18, 24].map((n) => <option key={n} value={n} style={{ color: '#333' }}>{n} mo</option>)}
            </select>
          </div>
          <button
            onClick={handleFetch}
            disabled={loading}
            style={{
              padding: '6px 14px', borderRadius: 6, border: 'none',
              background: '#fff', color: '#1b5e20', fontWeight: 700,
              fontSize: 12, cursor: 'pointer',
            }}
          >
            {loading ? '...' : 'Forecast'}
          </button>
        </div>
      </div>

      {forecasts.length > 0 && (
        <>
          {/* Risk Summary */}
          <div style={{
            display: 'flex', gap: 12, padding: '12px 16px',
            background: avgRisk > 0.15 ? '#fff3e0' : avgRisk > 0.08 ? '#fffde7' : '#e8f5e9',
            borderBottom: '1px solid #e0e0e0',
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#666' }}>Avg Shortfall Risk</div>
              <div style={{ fontSize: 22, fontWeight: 700, color: avgRisk > 0.15 ? '#e65100' : avgRisk > 0.08 ? '#f57f17' : '#2e7d32' }}>
                {(avgRisk * 100).toFixed(0)}%
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: '#666' }}>Period</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{forecasts[0]?.month} → {forecasts[forecasts.length - 1]?.month}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <RiskBadge level={avgRisk > 0.15 ? 'high' : avgRisk > 0.08 ? 'medium' : 'low'} />
            </div>
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #e8e8e8' }}>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <ReferenceLine y={0} stroke="#ccc" />
                  <Area type="monotone" dataKey="target" stackId="1" stroke="#90caf9" fill="#bbdefb" name="Target (kt)" />
                  <Area type="monotone" dataKey="predicted" stackId="2" stroke="#43a047" fill="#a5d6a7" name="Predicted (kt)" />
                  <Line type="monotone" dataKey="risk" stroke="#e53935" name="Risk %" strokeDasharray="5 5" yAxisId={0} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Forecast Details */}
          <div style={{ maxHeight: 250, overflowY: 'auto' }}>
            {forecasts.map((f, i) => (
              <div
                key={i}
                style={{
                  padding: '10px 16px', borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer', transition: 'background 0.2s',
                }}
                onClick={() => setExpandedIdx(expandedIdx === i ? null : i)}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f8f8f8')}
                onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: 13 }}>{f.month}</span>
                    <span style={{ fontSize: 12, color: '#666', marginLeft: 8 }}>
                      {Math.round(f.predicted_tonnes / 1000)}kt / {Math.round(f.predicted_target / 1000)}kt
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <RiskBadge level={f.risk_level} />
                    {expandedIdx === i ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </div>

                {expandedIdx === i && (
                  <div style={{ marginTop: 8, padding: '8px 10px', background: '#fafafa', borderRadius: 8, fontSize: 12 }}>
                    <div style={{ marginBottom: 6 }}>
                      <b>Contributing Factors:</b>
                      {f.contributing_factors.map((cf: any, j: number) => (
                        <div key={j} style={{ marginLeft: 8, color: cf.impact === 'high' ? '#c62828' : '#555' }}>
                          • {cf.factor} — {cf.description}
                        </div>
                      ))}
                    </div>
                    {f.recommended_actions.length > 0 && (
                      <div>
                        <b>Recommended Actions:</b>
                        {f.recommended_actions.map((act: string, j: number) => (
                          <div key={j} style={{ marginLeft: 8, color: '#1565c0' }}>→ {act}</div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {forecasts.length === 0 && !loading && (
        <div style={{ padding: 32, textAlign: 'center', color: '#999', fontSize: 13 }}>
          Select a mine and click "Forecast" to see production predictions.
        </div>
      )}
    </div>
  );
}
