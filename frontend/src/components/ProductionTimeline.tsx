import { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, TrendingDown, Minus, ChevronDown } from 'lucide-react';

export interface HistoryPoint {
  month: string;
  target_tonnes: number;
  actual_tonnes: number;
}

interface Props {
  mine: string;
  onMineChange: (mine: string) => void;
  mines: string[];
}

const fetchHistory = async (mineName: string): Promise<HistoryPoint[]> => {
  const res = await fetch(`/api/production/history?mine_name=${encodeURIComponent(mineName)}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  return data.data.map((d: any) => ({
    month: d.month,
    target_tonnes: d.target_tonnes,
    actual_tonnes: d.actual_tonnes,
  }));
};

export default function ProductionTimeline({ mine, onMineChange, mines }: Props) {
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchHistory(mine)
      .then((data) => {
        if (!cancelled) setHistory(data);
      })
      .catch((e: any) => {
        if (!cancelled) setError(e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [mine]);

  // Last 13 months for the strip
  const recent = history.slice(-13).map((d) => ({
    month: d.month.slice(5), // "2025-08" -> "08"
    actual: Math.round(d.actual_tonnes / 1000),
    target: Math.round(d.target_tonnes / 1000),
  }));

  // Trend: compare avg actual of last 3 months vs previous 3
  let trend: 'up' | 'down' | 'flat' = 'flat';
  let deltaPct = 0;
  if (history.length >= 6) {
    const last3 = history.slice(-3).reduce((s, d) => s + d.actual_tonnes, 0) / 3;
    const prev3 = history.slice(-6, -3).reduce((s, d) => s + d.actual_tonnes, 0) / 3;
    if (prev3 > 0) {
      deltaPct = ((last3 - prev3) / prev3) * 100;
      trend = deltaPct > 2 ? 'up' : deltaPct < -2 ? 'down' : 'flat';
    }
  }

  // Shortfall in recent window
  const recentHistory = history.slice(-6);
  const avgActual = recentHistory.length
    ? recentHistory.reduce((s, d) => s + d.actual_tonnes, 0) / recentHistory.length : 0;
  const avgTarget = recentHistory.length
    ? recentHistory.reduce((s, d) => s + d.target_tonnes, 0) / recentHistory.length : 0;
  const shortfallPct = avgTarget > 0 ? Math.max(0, ((avgTarget - avgActual) / avgTarget) * 100) : 0;

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? '#81c784' : trend === 'down' ? '#ef5350' : 'rgba(255,255,255,0.5)';

  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', gap: 0, height: '100%',
      color: '#e8ecf5',
    }}>
      {/* Mine selector */}
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '0 14px', borderRight: '1px solid rgba(255,255,255,0.08)',
        minWidth: 168,
      }}>
        <div style={{ fontSize: 9, letterSpacing: 1.2, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', marginBottom: 4 }}>
          Live Timeline
        </div>
        <div style={{ position: 'relative' }}>
          <select
            value={mine}
            onChange={(e) => onMineChange(e.target.value)}
            style={{
              width: '100%', appearance: 'none', WebkitAppearance: 'none',
              padding: '6px 24px 6px 10px', borderRadius: 8,
              background: 'rgba(255,255,255,0.06)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.14)', fontSize: 12, fontWeight: 600,
              cursor: 'pointer', outline: 'none',
            }}
          >
            {mines.map((m) => <option key={m} value={m} style={{ background: '#0a1220', color: '#fff' }}>{m}</option>)}
          </select>
          <ChevronDown size={12} style={{
            position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
            pointerEvents: 'none', color: 'rgba(255,255,255,0.5)',
          }} />
        </div>
      </div>

      {/* Chart */}
      <div style={{ flex: 1, minWidth: 0, height: '100%', padding: '4px 8px' }}>
        {loading ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
            Loading…
          </div>
        ) : error ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: '#ef5350' }}>
            Timeline unavailable
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={recent} margin={{ top: 6, right: 6, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="tlActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff9800" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#ff9800" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="tlTarget" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4fc3f7" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#4fc3f7" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.45)' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.45)' }} axisLine={false} tickLine={false} width={30} domain={[0, 'auto']} />
              <Tooltip
                contentStyle={{
                  background: 'rgba(10,18,32,0.95)', border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 8, fontSize: 11, color: '#fff',
                }}
                labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                formatter={(value: any, name: string) => [`${value} kt`, name === 'actual' ? 'Actual' : 'Target']}
              />
              <ReferenceLine y={0} stroke="rgba(255,255,255,0.1)" />
              <Area type="monotone" dataKey="target" stroke="#4fc3f7" strokeWidth={1.5} strokeDasharray="4 3" fill="url(#tlTarget)" name="target" />
              <Area type="monotone" dataKey="actual" stroke="#ff9800" strokeWidth={1.8} fill="url(#tlActual)" name="actual" />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Metrics */}
      <div style={{
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '0 14px', borderLeft: '1px solid rgba(255,255,255,0.08)',
        minWidth: 128, gap: 4,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
          <TrendIcon size={13} color={trendColor} />
          <span style={{ color: 'rgba(255,255,255,0.55)' }}>3-mo trend</span>
          <span style={{ fontWeight: 700, color: trendColor }}>{deltaPct >= 0 ? '+' : ''}{deltaPct.toFixed(1)}%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
          <span style={{ width: 13, textAlign: 'center' }}>📉</span>
          <span style={{ color: 'rgba(255,255,255,0.55)' }}>Shortfall</span>
          <span style={{ fontWeight: 700, color: shortfallPct > 20 ? '#ef5350' : shortfallPct > 8 ? '#ffb74d' : '#81c784' }}>
            {shortfallPct.toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}