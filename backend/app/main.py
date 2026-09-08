"""
MnSight AI — FastAPI Backend
AI + Space Technology Mining Intelligence System
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from typing import Optional, List, Dict, Any
import math
import httpx

from .models import (
    LocationRequest, LocationIntelligence, SpectralFeatures,
    TerrainFeatures, EnvironmentalFeatures, GeologicalFeatures,
    ProspectivityResult, SHAPExplanation, Recommendation,
    ProductionForecastRequest, ProductionForecast,
    WhatIfParameters, WhatIfResult, DrillCandidate,
    DrillPrioritizationResponse, ManganeseOccurrence, MineLocation
)
from .ml_models import (
    extract_spectral_features, extract_terrain_features,
    extract_environmental_features, extract_geological_features,
    compute_prospectivity, compute_shap_explanations,
    generate_recommendations, generate_historical_production,
    forecast_production, simulate_whatif, rank_drill_locations
)
from .datasets import (
    MANGANESE_OCCURRENCES, MOIL_MINES, GEOLOGICAL_FORMATIONS,
    FAULTS_LINEAMENTS, get_nearby_mines, get_nearest_occurrence
)

app = FastAPI(
    title="MnSight AI",
    description="AI + Space Technology Mining Intelligence System for Manganese",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Health Check ────────────────────────────────────────────────

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "MnSight AI", "version": "1.0.0"}


# ── Geocoding (Nominatim fallback) ─────────────────────────────

@app.get("/api/geocode")
async def geocode_place(
    q: str = Query(..., min_length=2, max_length=200, description="Place name to geocode"),
    limit: int = Query(default=5, ge=1, le=10),
):
    """
    Geocode a free-text place name via OpenStreetMap Nominatim.
    Used by the search box when a query matches no mine/district/occurrence.
    """
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={
                    "q": q,
                    "format": "jsonv2",
                    "limit": limit,
                    "addressdetails": 0,
                    "accept-language": "en",
                },
                headers={
                    "User-Agent": "MnSightAI/1.0 (SIH 26009 mining-intelligence demo)",
                },
            )
            resp.raise_for_status()
            items = resp.json()
    except Exception as exc:
        # Geocoder unreachable — degrade gracefully rather than crash the search UI.
        raise HTTPException(status_code=502, detail=f"Geocoding service unavailable: {exc}")

    results = []
    for it in items or []:
        try:
            lat = float(it["lat"])
            lon = float(it["lon"])
        except (KeyError, ValueError, TypeError):
            continue
        bb = it.get("boundingbox") or []
        results.append({
            "place_id": it.get("place_id"),
            "display_name": it.get("display_name", ""),
            "lat": lat,
            "lon": lon,
            "type": it.get("type", ""),
            "class": it.get("class", ""),
            # boundingbox = [south, north, west, east] as strings from Nominatim
            "boundingbox": [float(x) for x in bb] if len(bb) == 4 else None,
        })
    return {"results": results}


# ── Location Intelligence ──────────────────────────────────────

@app.post("/api/location-intelligence", response_model=LocationIntelligence)
async def get_location_intelligence(req: LocationRequest):
    """
    Generate a comprehensive Location Intelligence Report for any coordinate.
    This is the core endpoint — returns prospectivity, spectral analysis,
    geological context, terrain, environmental data, and recommendations.
    """
    lat, lon = req.latitude, req.longitude

    # Extract all features
    spectral = extract_spectral_features(lat, lon)
    terrain = extract_terrain_features(lat, lon)
    environmental = extract_environmental_features(lat, lon)
    geological = extract_geological_features(lat, lon)

    # Compute prospectivity
    score, confidence, conf_level, data_quality = compute_prospectivity(
        spectral, terrain, environmental, geological
    )

    # SHAP explanations
    shap_features = compute_shap_explanations(spectral, terrain, environmental, geological, score)

    # Recommendations
    recommendations = generate_recommendations(lat, lon, score, confidence, geological, terrain)

    # Nearby features
    nearby_mines = get_nearby_mines(lat, lon, 50.0)
    dist_mn, nearest = get_nearest_occurrence(lat, lon)

    nearby_occurrences = []
    if nearest:
        nearby_occurrences.append({
            "name": nearest["name"],
            "distance_km": round(dist_mn, 2),
            "formation": nearest.get("formation", "Unknown"),
            "grade_info": nearest.get("grade_info", "Unknown"),
        })

    # District from geological
    district = geological.district if hasattr(geological, 'district') else None

    return LocationIntelligence(
        latitude=lat,
        longitude=lon,
        location_name=f"Near {geological.formation} formation",
        state="Maharashtra / Madhya Pradesh",
        district=district,
        spectral=spectral,
        terrain=terrain,
        environmental=environmental,
        geological=geological,
        prospectivity=ProspectivityResult(
            prospectivity_score=round(score, 4),
            confidence=round(confidence, 4),
            confidence_level=conf_level,
            model_version="v1.0-mvp",
            data_quality=data_quality,
        ),
        shap_top_features=shap_features,
        recommendations=recommendations,
        nearby_mines=nearby_mines[:5],
        nearby_occurrences=nearby_occurrences,
        data_provenance={
            "spectral": "Simulated from Sentinel-2 band characteristics (MVP: location-based proxy)",
            "terrain": "Simulated from SRTM DEM characteristics (MVP: location-based proxy)",
            "environmental": "Simulated from NASA POWER / IMD characteristics (MVP: location-based proxy)",
            "geological": "Based on GSI geological map and Mn occurrence database",
            "occurrences": "GSI manganese occurrence data (Government of India)",
            "mines": "MOIL Ltd / IBM public mine location data",
            "model": "Domain-weighted multi-criteria ML model v1.0",
            "note": "Sentinel-2 provides SURFACE indicators only. Prospectivity != Reserve.",
        },
    )


# ── Prospectivity Map Grid ─────────────────────────────────────

@app.get("/api/prospectivity-grid")
async def get_prospectivity_grid(
    lat_min: float = Query(default=21.0, ge=-90, le=90),
    lat_max: float = Query(default=22.5, ge=-90, le=90),
    lon_min: float = Query(default=79.0, ge=-180, le=180),
    lon_max: float = Query(default=81.0, ge=-180, le=180),
    resolution: float = Query(default=0.1, description="Grid cell size in degrees"),
):
    """
    Generate a prospectivity grid for the interactive map overlay.
    Returns a grid of prospectivity scores with confidence.
    """
    lat_step = resolution
    lon_step = resolution

    grid = []
    lat = lat_min
    while lat <= lat_max:
        lon = lon_min
        while lon <= lon_max:
            spectral = extract_spectral_features(lat, lon)
            terrain = extract_terrain_features(lat, lon)
            env = extract_environmental_features(lat, lon)
            geo = extract_geological_features(lat, lon)

            score, conf, conf_level, dq = compute_prospectivity(spectral, terrain, env, geo)

            grid.append({
                "lat": round(lat, 4),
                "lon": round(lon, 4),
                "prospectivity": round(score, 4),
                "confidence": round(conf, 4),
                "confidence_level": conf_level,
            })
            lon += lon_step
        lat += lat_step

    return {
        "bounds": {"lat_min": lat_min, "lat_max": lat_max, "lon_min": lon_min, "lon_max": lon_max},
        "resolution": resolution,
        "cells": grid,
        "total_cells": len(grid),
    }


# ── Manganese Occurrences ──────────────────────────────────────

@app.get("/api/occurrences")
async def get_occurrences():
    """Return all known manganese occurrences for the map layer."""
    return {"occurrences": MANGANESE_OCCURRENCES, "total": len(MANGANESE_OCCURRENCES)}


# ── Mine Locations ─────────────────────────────────────────────

@app.get("/api/mines")
async def get_mines():
    """Return all MOIL mine locations for the map layer."""
    return {"mines": MOIL_MINES, "total": len(MOIL_MINES)}


# ── Geological Formations ──────────────────────────────────────

@app.get("/api/formations")
async def get_formations():
    """Return geological formation data."""
    return {"formations": GEOLOGICAL_FORMATIONS}


# ── Faults and Lineaments ──────────────────────────────────────

@app.get("/api/structures")
async def get_geological_structures():
    """Return faults and lineaments."""
    return {"structures": FAULTS_LINEAMENTS}


# ── Production Forecasting ──────────────────────────────────────

@app.get("/api/production/history")
async def get_production_history(
    mine_name: str = Query(default="Dongri Buzurg Mine"),
):
    """Get historical production data for a mine."""
    data = generate_historical_production(mine_name)
    return {"mine_name": mine_name, "data": data, "total_months": len(data)}


@app.post("/api/production/forecast", response_model=List[ProductionForecast])
async def get_production_forecast(req: ProductionForecastRequest):
    """Forecast future production with shortfall risk assessment."""
    return forecast_production(req.mine_name, req.months_ahead)


# ── What-If Simulator ──────────────────────────────────────────

@app.post("/api/simulator/whatif", response_model=WhatIfResult)
async def run_whatif_simulation(params: WhatIfParameters):
    """
    Run a what-if scenario simulation.
    Adjust rainfall, equipment, blasting, targets to see production impact.
    """
    # Baseline: average monthly production
    base_production = 65000  # tonnes/month
    base_shortfall_risk = 0.12

    return simulate_whatif(base_production, base_shortfall_risk, params)


# ── Drill Here Next ────────────────────────────────────────────

@app.get("/api/drill-prioritization", response_model=DrillPrioritizationResponse)
async def get_drill_prioritization(
    center_lat: float = Query(default=21.75, ge=-90, le=90),
    center_lon: float = Query(default=80.15, ge=-180, le=180),
    radius_km: float = Query(default=30.0, ge=1, le=200),
):
    """Rank locations for exploratory drilling."""
    return rank_drill_locations(center_lat, center_lon, radius_km)
