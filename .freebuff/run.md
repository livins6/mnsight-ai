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
