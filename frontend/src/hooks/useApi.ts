import { useState, useCallback } from 'react';
import type { LocationIntelligence, ProductionForecast, WhatIfParameters, WhatIfResult, DrillCandidate, ManganeseOccurrence, MineLocation } from '../types';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function useLocationIntelligence() {
  const [data, setData] = useState<LocationIntelligence | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIntel = useCallback(async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchJson<LocationIntelligence>('/location-intelligence', {
        method: 'POST',
        body: JSON.stringify({ latitude: lat, longitude: lon }),
      });
      setData(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchIntel, setData };
}

export function useProductionForecast() {
  const [forecasts, setForecasts] = useState<ProductionForecast[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchForecast = useCallback(async (mineName: string, monthsAhead: number = 6) => {
    setLoading(true);
    try {
      const result = await fetchJson<ProductionForecast[]>('/production/forecast', {
        method: 'POST',
        body: JSON.stringify({ mine_name: mineName, months_ahead: monthsAhead }),
      });
      setForecasts(result);
    } catch (e: any) {
      console.error('Forecast error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  return { forecasts, loading, fetchForecast };
}

export function useWhatIf() {
  const [result, setResult] = useState<WhatIfResult | null>(null);
  const [loading, setLoading] = useState(false);

  const simulate = useCallback(async (params: WhatIfParameters) => {
    setLoading(true);
    try {
      const res = await fetchJson<WhatIfResult>('/simulator/whatif', {
        method: 'POST',
        body: JSON.stringify(params),
      });
      setResult(res);
    } catch (e: any) {
      console.error('Simulation error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  return { result, loading, simulate };
}

export function useDrillCandidates() {
  const [candidates, setCandidates] = useState<DrillCandidate[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCandidates = useCallback(async (lat: number = 21.75, lon: number = 80.15) => {
    setLoading(true);
    try {
      const result = await fetchJson<{ candidates: DrillCandidate[] }>(
        `/drill-prioritization?center_lat=${lat}&center_lon=${lon}`
      );
      setCandidates(result.candidates);
    } catch (e: any) {
      console.error('Drill candidates error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  return { candidates, loading, fetchCandidates };
}

export function useMapData() {
  const [occurrences, setOccurrences] = useState<ManganeseOccurrence[]>([]);
  const [mines, setMines] = useState<MineLocation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMapData = useCallback(async () => {
    setLoading(true);
    try {
      const [occRes, mineRes] = await Promise.all([
        fetchJson<{ occurrences: ManganeseOccurrence[] }>('/occurrences'),
        fetchJson<{ mines: MineLocation[] }>('/mines'),
      ]);
      setOccurrences(occRes.occurrences);
      setMines(mineRes.mines);
    } catch (e: any) {
      console.error('Map data error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  return { occurrences, mines, loading, fetchMapData };
}
