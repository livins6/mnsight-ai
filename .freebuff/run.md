# MnSight AI — Run Documentation

## Architecture

- **Frontend**: React + TypeScript + Vite (port 5173)
- **Backend**: Python FastAPI + uvicorn (port 8000)
- **Proxy**: Vite dev server proxies `/api/*` → `http://127.0.0.1:8000`

## Dependencies

### Backend
```bash
cd backend
pip install -r requirements.txt
# Packages: fastapi, uvicorn, numpy, pandas, scikit-learn, shap, pydantic, httpx
```

### Frontend
```bash
cd frontend
npm install
# If esbuild postinstall fails on Windows (poppler PATH issue):
npm install --ignore-scripts
cd node_modules/esbuild && node install.js
```

> **Note:** frontend uses `framer-motion` for the 3D/scroll animations (added Sep 2026).
> Run `npm install` after a fresh checkout to pull it in.

## Real Data Layer (all-India)

- `backend/app/real_data.py` — real MOIL company-level monthly production (Sep 2024–Aug 2025, from MOIL press releases; FY25 = record 18.03 lakh t) allocated across the 10 real mines by indicative share, plus a loader for the all-India rainfall grid
- `backend/app/data/india_rainfall_grid.json` — REAL monthly rainfall (ERA5 reanalysis via Open-Meteo archive, Sep 2023–Aug 2025, 484 cells at 1.5° covering all of India). Regenerate with `python tmp/fetch_rainfall_grid.py` (rate-limit-safe, resume support)
- `backend/app/datasets.py` — the 10 real MOIL mines (7 underground: Balaghat, Tirodi*, Ukwa, Kandri, Munsar, Beldongri, Gumgaon, Chikla; 3 opencast: Dongri Buzurg, Sitapatore; *Tirodi is opencast) with corrected districts (Dongri Buzurg & Chikla are in Bhandara, MH) and 35 all-India Mn occurrences across 10 states (Odisha, AP, Karnataka, Gujarat, Rajasthan, Jharkhand, WB, Goa belts added)
- Production history (`/api/production/history`) and environmental rainfall (`extract_environmental_features`) read from these real sources; months outside the real window fall back to MOIL annual totals × seasonal monsoon weights
- Mine dropdowns in the UI (timeline strip + Production panel) use the real mine names

## UI/UX (dark glass dashboard)

- `frontend/src/App.tsx` — full-screen dashboard: top nav bar with animated tab underline (`layoutId`), map fills the view, side panel slides in on non-map tabs (map resizes with `ResizeObserver`+`invalidateSize`), Location Intelligence panel slides from the right
- `frontend/src/components/MapView.tsx` — pulsing markers, radar glow overlay, dark glass map chrome
- Panels (`LocationPanel`, `ProductionPanel`, `WhatIfPanel`, `DrillPanel`) — dark glass theme
- Side panel width is responsive: `min(<panel>px, 46vw)` so the map never collapses on narrow windows

## Starting the Servers

### Backend
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

### Frontend (detached on Windows)
```bash
cd frontend
node node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173
```

## Endpoints

- Frontend: http://127.0.0.1:5173/
- Backend API: http://127.0.0.1:8000/api/health
- API docs: http://127.0.0.1:8000/docs

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/location-intelligence` | POST | Full location intel report for coordinates |
| `/api/prospectivity-grid` | GET | Prospectivity heatmap grid data |
| `/api/occurrences` | GET | All manganese occurrence data |
| `/api/mines` | GET | All MOIL mine locations |
| `/api/formations` | GET | Geological formation data |
| `/api/structures` | GET | Faults and lineaments |
| `/api/production/history` | GET | Historical production data |
| `/api/production/forecast` | POST | Production forecast with shortfall risk |
| `/api/simulator/whatif` | POST | What-if scenario simulation |
| `/api/drill-prioritization` | POST | Drill Here Next ranking |
| `/api/geocode` | GET | Nominatim geocoding fallback for the search box |

## Verification Scripts

- `tmp/verify_real_data.py` — headless checks: company totals match real MOIL figures, history rainfall == ERA5 grid, all-India states/formations, corrected mine districts
