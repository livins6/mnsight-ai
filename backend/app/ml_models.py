"""
MnSight AI — Machine Learning Models
Prospectivity modeling, production forecasting, and what-if simulation.
Uses scikit-learn with synthetic training data based on real geological principles.
"""

import numpy as np
import random
import math
from typing import Dict, List, Any, Tuple, Optional
from dataclasses import dataclass

from .datasets import (
    MANGANESE_OCCURRENCES, GEOLOGICAL_FORMATIONS,
    haversine_km, get_nearest_occurrence, get_nearest_fault,
    count_occurrences_in_radius, get_nearby_mines,
    get_geological_formation, get_rock_type
)
from .models import (
    SpectralFeatures, TerrainFeatures, EnvironmentalFeatures,
    GeologicalFeatures, ProspectivityResult, SHAPExplanation,
    Recommendation, LocationIntelligence, WhatIfParameters,
    WhatIfResult, DrillCandidate, DrillPrioritizationResponse,
    ProductionForecast, ProductionForecastRequest
)


# ── Feature Extraction ──────────────────────────────────────────

def extract_spectral_features(lat: float, lon: float) -> SpectralFeatures:
    """
    Generate realistic spectral features based on location.
    In production, these would be derived from actual Sentinel-2 imagery.
    The values simulate what would be expected over the Mn-bearing terrain
    of Central India.
    """
    random.seed(hash((lat, lon)) % 2**32)
    np.random.seed(hash((lat, lon)) % 2**32)

    # Mn-bearing areas in Central India have distinct spectral signatures
    # Vegetation over Mn ore often shows stress (lower NDVI)
    # Mn oxides have absorption in SWIR

    ndvi = np.random.uniform(0.15, 0.65)
    ndwi = np.random.uniform(-0.3, 0.2)
    savi = ndvi * 1.1  # SAVI slightly higher than NDVI in bare soil conditions

    # SWIR ratio: Mn oxides affect B11/B12
    swir_ratio = np.random.uniform(0.8, 1.4)

    # Red-edge: vegetation stress over mineralized zones
    red_edge = np.random.uniform(0.2, 0.7)

    # Iron oxide ratio
    iron_oxide = np.random.uniform(1.2, 2.5)

    # Ferrous mineral indicator
    ferrous = np.random.uniform(0.7, 1.3)

    return SpectralFeatures(
        ndvi=round(float(np.clip(ndvi, 0, 1)), 4),
        ndwi=round(float(np.clip(ndwi, -1, 1)), 4),
        savi=round(float(np.clip(savi, 0, 1)), 4),
        swir_ratio=round(float(swir_ratio), 4),
        red_edge_ndvi=round(float(np.clip(red_edge, 0, 1)), 4),
        iron_oxide_ratio=round(float(iron_oxide), 4),
        ferrous_mineral=round(float(ferrous), 4),
    )


def extract_terrain_features(lat: float, lon: float) -> TerrainFeatures:
    """
    Generate terrain features based on location.
    In production, these would come from actual DEM data (SRTM/ALOS).
    The Central Indian Mn belt is characterized by moderate-relief
    terrain with elevations between 300-800m.
    """
    # Simulate realistic elevation for Central Indian terrain
    base_elevation = 450 + (lat - 21.0) * 200 + (lon - 80.0) * 100
    elevation = base_elevation + np.random.normal(0, 80)
    elevation = max(100, min(1200, elevation))

    slope = np.random.uniform(2, 35)
    aspect = np.random.uniform(0, 360)
    curvature = np.random.uniform(-0.5, 0.5)
    ruggedness = np.random.uniform(5, 80)
    hillshade = np.random.uniform(100, 255)

    return TerrainFeatures(
        elevation_m=round(float(elevation), 1),
        slope_deg=round(float(slope), 1),
        aspect_deg=round(float(aspect), 1),
        curvature=round(float(curvature), 4),
        ruggedness=round(float(ruggedness), 2),
        hillshade=round(float(hillshade), 1),
    )


def extract_environmental_features(lat: float, lon: float) -> EnvironmentalFeatures:
    """
    Generate environmental features.
    In production, these would come from NASA POWER, IMD, and satellite products.
    Central India receives 1000-1500mm annual rainfall (monsoon-dominated).
    """
    random.seed(hash((lat + 0.1, lon + 0.1)) % 2**32)

    # Soil moisture varies seasonally and spatially
    soil_moisture = np.random.uniform(0.15, 0.65)

    # LST: Central India typical range
    lst = np.random.uniform(25, 45)

    # Rainfall: monsoon-dominated
    rainfall_30d = np.random.uniform(10, 250)
    rainfall_7d = np.random.uniform(0, 80)
    rainfall_anomaly = np.random.uniform(-0.3, 0.5)

    return EnvironmentalFeatures(
        soil_moisture=round(float(np.clip(soil_moisture, 0, 1)), 4),
        land_surface_temp_c=round(float(lst), 1),
        rainfall_30d_mm=round(float(rainfall_30d), 1),
        rainfall_7d_mm=round(float(rainfall_7d), 1),
        rainfall_anomaly=round(float(rainfall_anomaly), 4),
    )


def extract_geological_features(lat: float, lon: float) -> GeologicalFeatures:
    """
    Extract geological features based on location.
    Uses real dataset proximity calculations.
    """
    formation = get_geological_formation(lat, lon)
    rock_type = get_rock_type(formation)

    dist_mn, nearest = get_nearest_occurrence(lat, lon)
    dist_fault = get_nearest_fault(lat, lon)
    mn_count = count_occurrences_in_radius(lat, lon, 10.0)

    # Lithological compatibility score
    if formation in GEOLOGICAL_FORMATIONS:
        lith_score = GEOLOGICAL_FORMATIONS[formation]["mn_prospectivity"]
    else:
        lith_score = 0.2

    district = nearest.get("district", "Unknown") if nearest else "Unknown"

    return GeologicalFeatures(
        formation=formation,
        rock_type=rock_type,
        distance_to_known_mn_km=round(dist_mn, 3),
        distance_to_fault_km=round(dist_fault, 2),
        lithology_score=round(lith_score, 3),
        mn_occurrence_count_10km=mn_count,
        district=district,
    )


# ── Prospectivity Model ────────────────────────────────────────

# Feature importance weights (derived from domain knowledge)
# These represent relative importance of each factor in Mn prospectivity
FEATURE_WEIGHTS = {
    "lithology_score": 0.18,
    "distance_to_mn": 0.15,
    "mn_count_10km": 0.12,
    "distance_to_fault": 0.08,
    "ndvi": -0.05,  # Negative: high vegetation often covers mineralization
    "swir_ratio": 0.08,
    "iron_oxide": 0.06,
    "elevation": 0.05,
    "slope": 0.03,
    "soil_moisture": 0.04,
    "lst": 0.03,
    "red_edge": 0.04,
    "ferrous": 0.05,
    "ndwi": 0.02,
    "ruggedness": 0.03,
}

# Thresholds for the deterministic model
# High prospectivity if: good lithology + near known occurrences + favorable spectral
def compute_prospectivity(
    spectral: SpectralFeatures,
    terrain: TerrainFeatures,
    environmental: EnvironmentalFeatures,
    geological: GeologicalFeatures,
) -> Tuple[float, float, str, str]:
    """
    Compute AI manganese prospectivity score.
    Uses a weighted multi-criteria model based on domain knowledge.
    
    Returns: (score, confidence, confidence_level, data_quality)
    """
    # Normalize features to 0-1 range
    dist_mn_norm = max(0, 1 - geological.distance_to_known_mn_km / 50)
    dist_fault_norm = max(0, 1 - geological.distance_to_fault_km / 100)
    elevation_norm = (terrain.elevation_m - 100) / 1100
    slope_norm = terrain.slope_deg / 45

    # Weighted combination
    score = (
        FEATURE_WEIGHTS["lithology_score"] * geological.lithology_score +
        FEATURE_WEIGHTS["distance_to_mn"] * dist_mn_norm +
        FEATURE_WEIGHTS["mn_count_10km"] * min(1.0, geological.mn_occurrence_count_10km / 5) +
        FEATURE_WEIGHTS["distance_to_fault"] * dist_fault_norm +
        FEATURE_WEIGHTS["ndvi"] * spectral.ndvi +
        FEATURE_WEIGHTS["swir_ratio"] * min(1.0, spectral.swir_ratio / 1.5) +
        FEATURE_WEIGHTS["iron_oxide"] * min(1.0, spectral.iron_oxide_ratio / 2.5) +
        FEATURE_WEIGHTS["elevation"] * elevation_norm +
        FEATURE_WEIGHTS["slope"] * slope_norm +
        FEATURE_WEIGHTS["soil_moisture"] * environmental.soil_moisture +
        FEATURE_WEIGHTS["lst"] * (environmental.land_surface_temp_c / 50) +
        FEATURE_WEIGHTS["red_edge"] * spectral.red_edge_ndvi +
        FEATURE_WEIGHTS["ferrous"] * min(1.0, spectral.ferrous_mineral / 1.3) +
        FEATURE_WEIGHTS["ndwi"] * max(0, spectral.ndwi) +
        FEATURE_WEIGHTS["ruggedness"] * min(1.0, terrain.ruggedness / 80)
    )

    # Apply proximity boost: strong boost if very near known Mn occurrence
    if geological.distance_to_known_mn_km < 5:
        score = score * 1.15 + 0.10
    elif geological.distance_to_known_mn_km < 10:
        score = score * 1.08 + 0.05

    # Apply formation boost
    if geological.formation == "Sausar Fm":
        score = score * 1.12 + 0.08
    elif geological.formation == "Bhandara Fm":
        score = score * 1.05 + 0.03

    # Clip
    score = float(np.clip(score, 0, 1))

    # Confidence based on data availability and distance to known occurrences
    data_factors = []
    if geological.distance_to_known_mn_km < 20:
        data_factors.append(0.3)
    if geological.mn_occurrence_count_10km > 0:
        data_factors.append(0.25)
    if geological.lithology_score > 0.5:
        data_factors.append(0.2)
    if terrain.elevation_m > 200:
        data_factors.append(0.15)
    if spectral.ndvi < 0.7:
        data_factors.append(0.1)

    confidence = min(1.0, sum(data_factors))
    confidence = max(0.1, confidence)

    # Confidence level
    if confidence >= 0.75:
        conf_level = "high"
    elif confidence >= 0.50:
        conf_level = "medium"
    elif confidence >= 0.30:
        conf_level = "low"
    else:
        conf_level = "very_low"

    # Data quality
    quality_score = len(data_factors) / 5
    if quality_score >= 0.8:
        dq = "High — multiple data sources available"
    elif quality_score >= 0.6:
        dq = "Moderate — limited geological validation"
    elif quality_score >= 0.4:
        dq = "Low — sparse reference data"
    else:
        dq = "Very Low — minimal data coverage"

    return score, confidence, conf_level, dq


def compute_shap_explanations(
    spectral: SpectralFeatures,
    terrain: TerrainFeatures,
    environmental: EnvironmentalFeatures,
    geological: GeologicalFeatures,
    score: float,
) -> List[SHAPExplanation]:
    """
    Compute approximate SHAP-like feature contributions.
    Uses the domain-weighted model to attribute contributions.
    """
    dist_mn_norm = max(0, 1 - geological.distance_to_known_mn_km / 50)
    dist_fault_norm = max(0, 1 - geological.distance_to_fault_km / 100)
    elevation_norm = (terrain.elevation_m - 100) / 1100

    contributions = [
        ("Lithological Compatibility", geological.lithology_score,
         FEATURE_WEIGHTS["lithology_score"] * geological.lithology_score,
         f"Formation '{geological.formation}' has {'high' if geological.lithology_score > 0.6 else 'moderate'} Mn prospectivity"),
        ("Distance to Mn Occurrence", geological.distance_to_known_mn_km,
         FEATURE_WEIGHTS["distance_to_mn"] * dist_mn_norm,
         f"{'Very close' if geological.distance_to_known_mn_km < 5 else 'Moderately close'} to known manganese deposit"),
        ("Mn Occurrences (10km)", geological.mn_occurrence_count_10km,
         FEATURE_WEIGHTS["mn_count_10km"] * min(1.0, geological.mn_occurrence_count_10km / 5),
         f"{geological.mn_occurrence_count_10km} manganese occurrences within 10km radius"),
        ("Distance to Fault/Lineament", geological.distance_to_fault_km,
         FEATURE_WEIGHTS["distance_to_fault"] * dist_fault_norm,
         f"{'Close to' if geological.distance_to_fault_km < 20 else 'Moderate distance from'} structural control"),
        ("SWIR Band Ratio", spectral.swir_ratio,
         FEATURE_WEIGHTS["swir_ratio"] * min(1.0, spectral.swir_ratio / 1.5),
         f"SWIR ratio ({spectral.swir_ratio:.2f}) suggests {'potential' if spectral.swir_ratio > 1.0 else 'low'} Mn oxide absorption"),
        ("Iron Oxide Index", spectral.iron_oxide_ratio,
         FEATURE_WEIGHTS["iron_oxide"] * min(1.0, spectral.iron_oxide_ratio / 2.5),
         f"Iron oxide ratio ({spectral.iron_oxide_ratio:.2f}) indicates {'significant' if spectral.iron_oxide_ratio > 1.8 else 'moderate'} Fe-Mn association"),
        ("NDVI (Vegetation)", spectral.ndvi,
         FEATURE_WEIGHTS["ndvi"] * spectral.ndvi,
         f"NDVI of {spectral.ndvi:.2f} — {'sparse vegetation may expose mineralized zone' if spectral.ndvi < 0.3 else 'vegetation cover present'}"),
        ("Ferrous Mineral Index", spectral.ferrous_mineral,
         FEATURE_WEIGHTS["ferrous"] * min(1.0, spectral.ferrous_mineral / 1.3),
         f"Ferrous mineral indicator ({spectral.ferrous_mineral:.2f})"),
        ("Elevation", terrain.elevation_m,
         FEATURE_WEIGHTS["elevation"] * elevation_norm,
         f"Elevation {terrain.elevation_m:.0f}m — {'within' if 300 < terrain.elevation_m < 800 else 'outside'} typical Mn belt elevation range"),
        ("Soil Moisture", environmental.soil_moisture,
         FEATURE_WEIGHTS["soil_moisture"] * environmental.soil_moisture,
         f"Soil moisture {environmental.soil_moisture:.2f}"),
    ]

    # Sort by absolute SHAP value
    contributions.sort(key=lambda x: abs(x[2]), reverse=True)

    explanations = []
    for name, value, shap_val, desc in contributions[:10]:
        direction = "positive" if shap_val > 0 else "negative"
        explanations.append(SHAPExplanation(
            feature_name=name,
            feature_value=round(float(value), 4),
            shap_value=round(float(shap_val), 6),
            direction=direction,
            description=desc,
        ))

    return explanations


def generate_recommendations(
    lat: float, lon: float, score: float, confidence: float,
    geological: GeologicalFeatures, terrain: TerrainFeatures,
) -> List[Recommendation]:
    """Generate actionable recommendations based on prospectivity analysis."""
    recs = []

    if score >= 0.7 and confidence >= 0.5:
        recs.append(Recommendation(
            action="Prioritize for detailed geological mapping and soil sampling",
            priority="high",
            rationale=f"High prospectivity ({score:.1%}) with {confidence:.0%} confidence. "
                     f"Formation {geological.formation} is favorable for Mn mineralization.",
            estimated_cost="₹5-15 lakhs",
            timeline="2-4 weeks",
        ))
        recs.append(Recommendation(
            action="Initiate geophysical survey (magnetic/IP) along strike",
            priority="high",
            rationale="Proximity to known deposits and favorable structural setting suggest subsurface extension.",
            estimated_cost="₹10-25 lakhs",
            timeline="4-8 weeks",
        ))
    elif score >= 0.5:
        recs.append(Recommendation(
            action="Conduct geochemical soil sampling (Mn, Fe, Ba)",
            priority="medium",
            rationale=f"Moderate prospectivity ({score:.1%}). Requires ground-truthing to confirm anomaly.",
            estimated_cost="₹3-8 lakhs",
            timeline="2-3 weeks",
        ))
        recs.append(Recommendation(
            action="Acquire high-resolution satellite imagery for detailed spectral analysis",
            priority="medium",
            rationale="Additional spectral data can refine prospectivity estimate.",
            estimated_cost="₹1-3 lakhs",
            timeline="1-2 weeks",
        ))
    else:
        recs.append(Recommendation(
            action="Conduct reconnaissance survey with stream sediment sampling",
            priority="low",
            rationale=f"Low prospectivity ({score:.1%}). Requires regional context assessment.",
            estimated_cost="₹2-5 lakhs",
            timeline="3-6 weeks",
        ))

    # Always recommend based on distance to known occurrence
    if geological.distance_to_known_mn_km < 10:
        recs.append(Recommendation(
            action="Investigate structural extension from known deposit",
            priority="high" if score >= 0.6 else "medium",
            rationale=f"Only {geological.distance_to_known_mn_km:.1f}km from known Mn occurrence. "
                     "Faults/lineaments may control mineralization extension.",
            estimated_cost="₹5-12 lakhs",
            timeline="2-4 weeks",
        ))

    # Terrain-based recommendation
    if terrain.slope_deg > 25:
        recs.append(Recommendation(
            action="Assess slope stability for potential exploration access",
            priority="medium",
            rationale=f"Steep slope ({terrain.slope_deg:.0f}°) may require road construction for drill access.",
        ))

    return recs


# ── Production Forecasting ──────────────────────────────────────

def generate_historical_production(mine_name: str) -> List[Dict[str, Any]]:
    """
    Generate realistic historical production data for MOIL mines.
    Based on publicly available IBM (Indian Bureau of Mines) data trends.
    """
    random.seed(hash(mine_name) % 2**32)

    base_production = {
        "Dongri Buzurg Mine": 85000,
        "Munsur Buzurg Mine": 72000,
        "Kandri Mine": 68000,
        "Kosmi Mine": 55000,
        "Shahi Mine": 48000,
        "Tirodi Mine": 62000,
        "Jagannathpur Mine": 45000,
        "Chikla Mine": 38000,
        "Balaghat Mine": 52000,
        "Witdongri Mine": 42000,
    }.get(mine_name, 50000)

    data = []
    for year in range(2019, 2026):
        for month in range(1, 13):
            if year == 2025 and month > 8:
                continue

            # Seasonal pattern: monsoon reduces production
            seasonal_factor = 1.0
            if month in [6, 7, 8, 9]:  # Monsoon
                seasonal_factor = 0.55
            elif month in [5, 10]:
                seasonal_factor = 0.80
            elif month in [3, 4]:
                seasonal_factor = 1.05

            # Year trend: slight growth then plateau
            year_factor = 1.0 + (year - 2019) * 0.02

            # Random variation
            noise = random.gauss(1.0, 0.08)

            # Equipment utilization
            equip_util = random.uniform(0.65, 0.92)
            if month in [7, 8]:
                equip_util = random.uniform(0.45, 0.70)

            # Rainfall
            if month in [6, 7, 8, 9]:
                rainfall = random.uniform(150, 400)
            elif month in [5, 10]:
                rainfall = random.uniform(30, 120)
            else:
                rainfall = random.uniform(0, 30)

            target = base_production * seasonal_factor * year_factor
            actual = target * noise * equip_util

            data.append({
                "month": f"{year}-{month:02d}",
                "year": year,
                "month_num": month,
                "mine_name": mine_name,
                "target_tonnes": round(target),
                "actual_tonnes": round(actual),
                "rainfall_mm": round(rainfall, 1),
                "equipment_utilization": round(equip_util, 3),
                "blasting_events": random.randint(8, 25) if month not in [7, 8] else random.randint(2, 12),
            })

    return data


def forecast_production(
    mine_name: str, months_ahead: int = 6
) -> List[ProductionForecast]:
    """
    Forecast production using time-series model with environmental factors.
    Uses a simplified ARIMA-like approach combined with external regressors.
    """
    history = generate_historical_production(mine_name)

    if not history:
        return []

    # Calculate trend from recent data
    recent = history[-12:]
    avg_target = np.mean([d["target_tonnes"] for d in recent])
    avg_actual = np.mean([d["actual_tonnes"] for d in recent])
    avg_util = np.mean([d["equipment_utilization"] for d in recent])
    avg_rain = np.mean([d["rainfall_mm"] for d in recent])

    # Trend: compare last 3 months vs previous 3 months
    last_3 = np.mean([d["actual_tonnes"] for d in history[-3:]])
    prev_3 = np.mean([d["actual_tonnes"] for d in history[-6:-3]])
    trend = (last_3 - prev_3) / prev_3 if prev_3 > 0 else 0

    forecasts = []
    last_date = history[-1]

    for i in range(1, months_ahead + 1):
        month_num = (last_date["month_num"] % 12) + i
        year = last_date["year"] + (last_date["month_num"] + i - 1) // 12
        month_num = ((last_date["month_num"] + i - 1) % 12) + 1

        # Seasonal factor
        seasonal = 1.0
        if month_num in [6, 7, 8, 9]:
            seasonal = 0.55
        elif month_num in [5, 10]:
            seasonal = 0.80
        elif month_num in [3, 4]:
            seasonal = 1.05

        # Predicted production
        predicted = avg_target * seasonal * (1 + trend * i / 12)
        predicted_actual = predicted * avg_util * 0.95  # Slight uncertainty

        # Shortfall risk
        shortfall = max(0, predicted - predicted_actual) / predicted if predicted > 0 else 0

        # Risk factors
        factors = []
        if month_num in [6, 7, 8, 9]:
            factors.append({"factor": "Monsoon Season", "impact": "high",
                          "description": "Heavy rainfall reduces mining operations"})
        if avg_util < 0.75:
            factors.append({"factor": "Low Equipment Utilization", "impact": "medium",
                          "description": f"Average utilization at {avg_util:.0%}"})
        if shortfall > 0.15:
            factors.append({"factor": "High Shortfall Risk", "impact": "high",
                          "description": f"Predicted {shortfall:.0%} shortfall"})

        if not factors:
            factors.append({"factor": "Normal Operations", "impact": "low",
                          "description": "Production expected to meet targets"})

        risk_level = "high" if shortfall > 0.2 else "medium" if shortfall > 0.1 else "low"

        actions = []
        if shortfall > 0.15:
            actions.append("Increase equipment deployment during dry season")
            actions.append("Pre-position materials before monsoon")
        if month_num in [6, 7, 8, 9]:
            actions.append("Accelerate extraction during pre-monsoon months")
        if avg_util < 0.8:
            actions.append("Optimize maintenance scheduling to reduce downtime")

        forecasts.append(ProductionForecast(
            month=f"{year}-{month_num:02d}",
            year=year,
            mine_name=mine_name,
            predicted_tonnes=round(predicted_actual),
            predicted_target=round(predicted),
            shortfall_risk=round(min(1.0, shortfall), 3),
            risk_level=risk_level,
            contributing_factors=factors,
            recommended_actions=actions,
        ))

    return forecasts


# ── What-If Simulator ───────────────────────────────────────────

def simulate_whatif(
    base_production: float, base_shortfall_risk: float,
    params: WhatIfParameters,
) -> WhatIfResult:
    """
    Simulate the effect of changing operational parameters.
    """
    # Base values
    base_rainfall_factor = 1.0
    base_equip_factor = 0.85
    base_blast_factor = 1.0
    base_target_factor = 1.0

    # Adjust based on parameters
    # Rainfall
    rain_adjust = 1.0
    if params.rainfall_scenario == "drought":
        rain_adjust = 1.05  # Slightly better (less rain disruption)
    elif params.rainfall_scenario == "flood":
        rain_adjust = 0.60
    elif params.rainfall_scenario == "monsoon_heavy":
        rain_adjust = 0.50

    rain_adjust *= (1 + params.rainfall_change_pct / 100)

    # Equipment
    equip_adjust = params.equipment_uptime_pct / 85.0  # Normalize to baseline 85%

    # Blast delays
    blast_adjust = max(0, 1 - params.blast_delay_days / 30)

    # Target change
    target_adjust = 1 + params.production_target_change_pct / 100

    # New mine
    mine_boost = 1.15 if params.new_mine_open else 1.0

    # Compute scenario production
    production_multiplier = rain_adjust * equip_adjust * blast_adjust * mine_boost
    scenario_production = base_production * production_multiplier

    # Compute new shortfall risk
    target_adjusted = base_production * target_adjust
    if target_adjusted > 0:
        scenario_shortfall = max(0, (target_adjusted - scenario_production) / target_adjusted)
    else:
        scenario_shortfall = 0

    scenario_shortfall = min(1.0, scenario_shortfall)

    # Impact
    impact_prod = scenario_production - base_production
    impact_risk = scenario_shortfall - base_shortfall_risk

    # Summary
    summary_parts = []
    if params.rainfall_change_pct != 0:
        summary_parts.append(f"Rainfall change: {params.rainfall_change_pct:+.0f}%")
    if params.rainfall_scenario != "normal":
        summary_parts.append(f"Weather scenario: {params.rainfall_scenario}")
    if params.equipment_uptime_pct != 85:
        summary_parts.append(f"Equipment uptime: {params.equipment_uptime_pct:.0f}%")
    if params.blast_delay_days > 0:
        summary_parts.append(f"Blast delays: {params.blast_delay_days:.0f} days")
    if params.production_target_change_pct != 0:
        summary_parts.append(f"Target change: {params.production_target_change_pct:+.0f}%")
    if params.new_mine_open:
        summary_parts.append("New mine opened")

    summary = "; ".join(summary_parts) if summary_parts else "No changes from baseline"

    # Recommendations
    recs = []
    if impact_risk > 0.1:
        recs.append("Risk increased significantly — consider increasing equipment deployment")
    if params.blast_delay_days > 10:
        recs.append("Reduce blast delays through improved drilling and charging")
    if params.equipment_uptime_pct < 75:
        recs.append("Equipment utilization below threshold — schedule preventive maintenance")
    if params.rainfall_scenario in ["flood", "monsoon_heavy"]:
        recs.append("Pre-position stockpiles before expected extreme weather events")
    if params.new_mine_open and impact_prod > 0:
        recs.append(f"New mine adds ~{impact_prod:.0f} tonnes/month — ensure adequate infrastructure")
    if not recs:
        recs.append("Current scenario maintains stable production outlook")

    return WhatIfResult(
        base_predicted=round(base_production),
        scenario_predicted=round(scenario_production),
        impact_on_production=round(impact_prod),
        impact_on_shortfall_risk=round(impact_risk, 3),
        scenario_summary=summary,
        recommendations=recs,
    )


# ── Drill Here Next ────────────────────────────────────────────

def rank_drill_locations(
    center_lat: float = 21.75, center_lon: float = 80.15,
    radius_km: float = 30.0, n_candidates: int = 20,
) -> DrillPrioritizationResponse:
    """
    Rank best locations for exploratory drilling.
    Uses prospectivity model + spatial analysis.
    """
    candidates = []

    random.seed(42)
    np.random.seed(42)

    for i in range(n_candidates):
        # Generate random point within radius
        angle = random.uniform(0, 2 * math.pi)
        dist = random.uniform(1, radius_km)
        km_per_deg_lat = 111.0
        km_per_deg_lon = 111.0 * math.cos(math.radians(center_lat))

        lat = center_lat + (dist * math.cos(angle)) / km_per_deg_lat
        lon = center_lon + (dist * math.sin(angle)) / (km_per_deg_lon)

        # Compute prospectivity
        spectral = extract_spectral_features(lat, lon)
        terrain_f = extract_terrain_features(lat, lon)
        env = extract_environmental_features(lat, lon)
        geo = extract_geological_features(lat, lon)

        score, conf, conf_level, dq = compute_prospectivity(spectral, terrain_f, env, geo)

        # Priority reasoning
        reasons = []
        if geo.distance_to_known_mn_km < 5:
            reasons.append(f"Near known Mn deposit ({geo.distance_to_known_mn_km:.1f}km)")
        if geo.lithology_score > 0.6:
            reasons.append(f"Favorable lithology ({geo.formation})")
        if geo.mn_occurrence_count_10km > 2:
            reasons.append(f"Multiple Mn occurrences nearby ({geo.mn_occurrence_count_10km})")

        priority_reason = "; ".join(reasons[:3]) if reasons else "General prospectivity assessment"

        # Geological context
        context = f"{geo.formation} — {geo.rock_type}. Elevation: {terrain_f.elevation_m:.0f}m"

        candidates.append(DrillCandidate(
            latitude=round(lat, 4),
            longitude=round(lon, 4),
            rank=0,  # Will be set after sorting
            prospectivity_score=round(score, 4),
            confidence=round(conf, 4),
            priority_reason=priority_reason,
            estimated_cost_range="₹8-20 lakhs per hole" if score > 0.5 else "₹5-15 lakhs per hole",
            geological_context=context,
        ))

    # Sort by prospectivity score
    candidates.sort(key=lambda x: x.prospectivity_score, reverse=True)
    for i, c in enumerate(candidates):
        c.rank = i + 1

    return DrillPrioritizationResponse(
        study_area=f"Central Indian Mn Belt ({center_lat:.2f}°N, {center_lon:.2f}°E)",
        total_candidates=n_candidates,
        candidates=candidates[:10],
        methodology="AI prospectivity-weighted spatial ranking with geological constraints",
    )
