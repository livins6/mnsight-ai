import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Factory, Mountain, CornerDownLeft, Globe, Loader2 } from 'lucide-react';
import type { ManganeseOccurrence, MineLocation } from '../types';

interface SearchResult {
  kind: 'mine' | 'district' | 'occurrence' | 'coordinate' | 'place';
  label: string;
  sublabel: string;
  lat: number;
  lon: number;
  zoom?: number;
}

interface Props {
  occurrences: ManganeseOccurrence[];
  mines: MineLocation[];
  onSelect: (lat: number, lon: number, label: string, zoom?: number) => void;
}

interface GeoResult {
  display_name: string;
  lat: number;
  lon: number;
  type: string;
  boundingbox: number[] | null;
}

// Derive a sensible map zoom from Nominatim's [south,north,west,east] bbox
// so a city lands at ~z12 and a village closer (~z16).
function zoomFromBbox(bbox: number[] | null, lat: number): number | undefined {
  if (!bbox || bbox.length !== 4) return undefined;
  const lonSpan = Math.abs(bbox[3] - bbox[2]);
  const latSpan = Math.abs(bbox[1] - bbox[0]);
  const latRad = (Math.abs(lat) * Math.PI) / 180;
  const span = Math.max(lonSpan, latSpan / Math.max(Math.cos(latRad), 0.05));
  if (span <= 0) return undefined;
  const z = Math.round(Math.log2(2160 / span));
  return Math.min(16, Math.max(9, z));
}

// Try to parse "lat, lon", "lat lon", "lat;lon", or "lat,lon" input
function parseCoordinates(q: string): { lat: number; lon: number } | null {
  const cleaned = q.trim().replace(/°/g, '').replace(/N|E|north|east/gi, '').trim();
  // Accept both "lat, lon" and "lat lon" and "lat lon" with optional degree symbols
  const m = cleaned.match(/^(-?\d+(?:\.\d+)?)\s*[,;\s]\s*(-?\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const lat = parseFloat(m[1]);
  const lon = parseFloat(m[2]);
  if (isNaN(lat) || isNaN(lon)) return null;
  if (lat < -90 || lat > 90) return null;
  if (lon < -180 || lon > 180) return null;
  return { lat, lon };
}

export default function SearchBox({ occurrences, mines, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced geocoding fallback (Nominatim via /api/geocode) for queries
  // that are no known mine/district/occurrence. Race-guarded + abortable.
  const [geoResults, setGeoResults] = useState<SearchResult[]>([]);
  const [geoLoading, setGeoLoading] = useState(false);
  const geoSeq = useRef(0);
  const geoAbort = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = query.trim();
    const seq = ++geoSeq.current;
    if (geoAbort.current) geoAbort.current.abort();
    if (q.length < 3) {
      setGeoResults([]);
      setGeoLoading(false);
      return;
    }
    const timer = setTimeout(async () => {
      const ctrl = new AbortController();
      geoAbort.current = ctrl;
      setGeoLoading(true);
      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}&limit=4`, { signal: ctrl.signal });
        if (!res.ok) throw new Error(`geocode ${res.status}`);
        const json = await res.json();
        if (seq !== geoSeq.current) return; // stale response
        const mapped: SearchResult[] = ((json.results || []) as GeoResult[])
          .map((r) => {
            const parts = (r.display_name || '').split(',').map((p) => p.trim()).filter(Boolean);
            const label = parts[0] || r.display_name || 'Unknown place';
            const sublabel = parts.slice(1, 4).join(', ');
            return {
              kind: 'place' as const,
              label,
              sublabel: sublabel || r.type,
              lat: r.lat,
              lon: r.lon,
              zoom: zoomFromBbox(r.boundingbox, r.lat),
            };
          });
        setGeoResults(mapped);
      } catch (e) {
        if (seq === geoSeq.current && (e as Error).name !== 'AbortError') setGeoResults([]);
      } finally {
        if (seq === geoSeq.current) setGeoLoading(false);
      }
    }, 500);
    return () => {
      clearTimeout(timer);
      if (geoAbort.current) geoAbort.current.abort();
    };
  }, [query]);

  const results = useMemo<SearchResult[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const out: SearchResult[] = [];

    // 1. Mines by name
    mines
      .filter((m) => m.name.toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((m) => {
        out.push({
          kind: 'mine',
          label: m.name,
          sublabel: `${m.state} — ${m.district ?? ''}`.trim().replace(/—\s*$/, ''),
          lat: m.latitude,
          lon: m.longitude,
        });
      });

    // 2. Occurrences by name or district
    occurrences
      .filter((o) => o.name.toLowerCase().includes(q) || (o.district ?? '').toLowerCase().includes(q))
      .slice(0, 4)
      .forEach((o) => {
        out.push({
          kind: 'occurrence',
          label: o.name,
          sublabel: `${o.district ?? ''} district — ${o.formation ?? ''}`.trim(),
          lat: o.latitude,
          lon: o.longitude,
        });
      });

    // 3. District aggregation (unique districts not already matched)
    const seenDistricts = new Set(out.map((r) => r.sublabel.split(' district')[0]));
    occurrences
      .map((o) => o.district)
      .filter((d): d is string => !!d && d.toLowerCase().includes(q) && !seenDistricts.has(d))
      .slice(0, 3)
      .forEach((district) => {
        const first = occurrences.find((o) => o.district === district);
        if (first) {
          out.push({
            kind: 'district',
            label: district,
            sublabel: `${first.state} — district center`,
            lat: first.latitude,
            lon: first.longitude,
          });
        }
      });

    // 4. Coordinates
    const coord = parseCoordinates(query);
    if (coord) {
      out.push({
        kind: 'coordinate',
        label: `${coord.lat.toFixed(4)}°N, ${coord.lon.toFixed(4)}°E`,
        sublabel: 'Exact coordinate',
        lat: coord.lat,
        lon: coord.lon,
      });
    }

    // Deduplicate by label, keep order
    const seen = new Set<string>();
    return out.filter((r) => {
      const key = r.label.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 8);
  }, [query, occurrences, mines]);

  // Merge local matches (mines/districts/occurrences/coords) with async
  // geocoded places, dedup by label, cap at 8 rows.
  const allResults = useMemo(() => {
    if (!results.length && !geoResults.length) return results;
    const seen = new Set(results.map((r) => r.label.toLowerCase()));
    const merged = [...results];
    for (const g of geoResults) {
      const key = g.label.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(g);
      }
    }
    return merged.slice(0, 8);
  }, [results, geoResults]);

  const open = focused && allResults.length > 0;
  const showLoading = focused && query.trim().length >= 3 && geoLoading && allResults.length === 0;

  const pick = (r: SearchResult) => {
    onSelect(r.lat, r.lon, r.label, r.zoom);
    setQuery('');
    setFocused(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && allResults.length > 0) {
      pick(allResults[0]);
    } else if (e.key === 'Escape') {
      setFocused(false);
    }
  };

  const KindIcon = ({ kind }: { kind: SearchResult['kind'] }) => {
    if (kind === 'mine') return <Factory size={12} color="#ffd700" />;
    if (kind === 'district') return <Mountain size={12} color="#ffb74d" />;
    if (kind === 'coordinate') return <MapPin size={12} color="#4fc3f7" />;
    if (kind === 'place') return <Globe size={12} color="#26c6da" />;
    return <MapPin size={12} color="#b5651d" />;
  };

  return (
    <div ref={boxRef} style={{ position: 'relative', width: 260 }}>
      <div style={{ position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setFocused(true); }}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 120)}
          onKeyDown={handleKeyDown}
          placeholder="Search mine, place, or lat/lon…"
          style={{
            width: '100%', padding: '7px 10px 7px 30px', borderRadius: 9,
            background: 'rgba(255,255,255,0.06)', color: '#fff',
            border: focused ? '1px solid rgba(255,152,0,0.45)' : '1px solid rgba(255,255,255,0.12)',
            fontSize: 12, outline: 'none', transition: 'border-color 0.2s',
          }}
        />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
              background: 'rgba(8,14,26,0.96)', backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
              boxShadow: '0 16px 50px rgba(0,0,0,0.6)', zIndex: 3000,
              overflow: 'hidden', maxHeight: 320, overflowY: 'auto',
            }}
          >
            {showLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', fontSize: 11, color: 'rgba(255,255,255,0.45)' }}>
                <Loader2 size={12} style={{ animation: 'spin-slow 0.9s linear infinite' }} />
                Searching for “{query.trim()}”…
              </div>
            )}
            {allResults.map((r, i) => (
              <div
                key={`${r.kind}-${r.label}-${i}`}
                onClick={() => pick(r)}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 9,
                  padding: '9px 12px', cursor: 'pointer',
                  borderBottom: i < results.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                  background: 'rgba(255,255,255,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <KindIcon kind={r.kind} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.label}
                    {r.kind === 'place' && (
                      <span style={{ marginLeft: 6, fontSize: 8.5, fontWeight: 600, color: '#26c6da', border: '1px solid rgba(38,198,218,0.35)', borderRadius: 4, padding: '0 4px', verticalAlign: 1 }}>MAP</span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {r.sublabel}
                  </div>
                </div>
                {i === 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>
                    <CornerDownLeft size={10} /> enter
                  </div>
                )}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}