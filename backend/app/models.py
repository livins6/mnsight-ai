"""
MnSight AI — Data Models
Pydantic models for all API endpoints
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from enum import Enum


class MineralizationType(str, Enum):
    HYDROUS = "hydrous"
    ANHYDROUS = "anhydrous"
    OXIDE = "oxide"
    CARBONATE = "carbonate"
    UNKNOWN = "unknown"


class RockType(str, Enum):
    BHANDARA_FORMATION = "bhandara_fmn"
    BALAGHAT_FORMATION = "balaghat_fmn"
    Sausar_Fm = "sausar_fmn"
    Sale_Fm = "sale_fmn"
    Iron_Ore_Group = "iron_ore_group"
    Gondwana = "gondwana"
    ARCHEAN = "archean"
    PRECAMBRIAN = "precambrian"
    UNKNOWN = "unknown"


class ConfidenceLevel(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    VERY_LOW = "very_low"


# ── Location Intelligence ──────────────────────────────────────

class LocationRequest(BaseModel):
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)


class SpectralFeatures(BaseModel):
    ndvi: float = Field(..., description="Normalized Difference Vegetation Index")
    ndwi: float = Field(..., description="Normalized Difference Water Index")
    savi: float = Field(..., description="Soil Adjusted Vegetation Index")
    swir_ratio: float = Field(..., description="SWIR band ratio B11/B12")
    red_edge_ndvi: float = Field(..., description="Red-edge NDVI")
    iron_oxide_ratio: float = Field(..., description="B4/B2 iron oxide indicator")
    ferrous_mineral: float = Field(..., description="B11/B8 ferrous mineral indicator")


class TerrainFeatures(BaseModel):
    elevation_m: float = Field(..., description="Elevation in meters")
    slope_deg: float = Field(..., description="Slope in degrees")
    aspect_deg: float = Field(..., description="Aspect in degrees")
    curvature: float = Field(..., description="Terrain curvature")
    ruggedness: float = Field(..., description="Terrain Ruggedness Index")
    hillshade: float = Field(..., description="Hillshade value")


class EnvironmentalFeatures(BaseModel):
    soil_moisture: float = Field(..., description="Soil moisture (0-1)")
    land_surface_temp_c: float = Field(..., description="Land surface temperature in °C")
    rainfall_30d_mm: float = Field(..., description="Rainfall last 30 days in mm")
    rainfall_7d_mm: float = Field(..., description="Rainfall last 7 days in mm")
    rainfall_anomaly: float = Field(..., description="Rainfall anomaly vs mean")


class GeologicalFeatures(BaseModel):
    formation: str = Field(..., description="Geological formation name")
    rock_type: str = Field(..., description="Dominant rock type")
    distance_to_known_mn_km: float = Field(..., description="Distance to nearest Mn occurrence in km")
    distance_to_fault_km: float = Field(..., description="Distance to nearest fault/lineament in km")
    lithology_score: float = Field(..., ge=0, le=1, description="Lithological compatibility score")
    mn_occurrence_count_10km: int = Field(..., description="Number of Mn occurrences within 10km")
    district: Optional[str] = Field(default=None, description="District name from nearest occurrence")


class ProspectivityResult(BaseModel):
    prospectivity_score: float = Field(..., ge=0, le=1, description="AI prospectivity score")
    confidence: float = Field(..., ge=0, le=1, description="Model confidence")
    confidence_level: str = Field(..., description="Confidence category")
    model_version: str = Field(default="v1.0")
    data_quality: str = Field(..., description="Data quality assessment")


class SHAPExplanation(BaseModel):
    feature_name: str
    feature_value: float
    shap_value: float
    direction: str = Field(..., description="positive or negative impact")
    description: str


class Recommendation(BaseModel):
    action: str
    priority: str = Field(..., description="high/medium/low")
    rationale: str
    estimated_cost: Optional[str] = None
    timeline: Optional[str] = None


class LocationIntelligence(BaseModel):
    latitude: float
    longitude: float
    location_name: Optional[str] = None
    state: str = "Maharashtra / Madhya Pradesh"
    district: Optional[str] = None

    spectral: SpectralFeatures
    terrain: TerrainFeatures
    environmental: EnvironmentalFeatures
    geological: GeologicalFeatures

    prospectivity: ProspectivityResult
    shap_top_features: List[SHAPExplanation]
    recommendations: List[Recommendation]

    nearby_mines: List[Dict[str, Any]]
    nearby_occurrences: List[Dict[str, Any]]

    data_provenance: Dict[str, str]


# ── Production Forecasting ──────────────────────────────────────

class ProductionDataPoint(BaseModel):
    month: str
    year: int
    mine_name: str
    target_tonnes: float
    actual_tonnes: float
    rainfall_mm: float
    equipment_utilization: float
    blasting_events: int


class ProductionForecast(BaseModel):
    month: str
    year: int
    mine_name: str
    predicted_tonnes: float
    predicted_target: float
    shortfall_risk: float = Field(..., ge=0, le=1)
    risk_level: str
    contributing_factors: List[Dict[str, Any]]
    recommended_actions: List[str]


class ProductionForecastRequest(BaseModel):
    mine_name: str
    months_ahead: int = Field(default=6, ge=1, le=24)
    current_production_rate: Optional[float] = None


# ── What-If Simulator ──────────────────────────────────────────

class WhatIfParameters(BaseModel):
    rainfall_change_pct: float = Field(default=0, ge=-100, le=200)
    equipment_uptime_pct: float = Field(default=85, ge=0, le=100)
    blast_delay_days: float = Field(default=0, ge=0, le=90)
    production_target_change_pct: float = Field(default=0, ge=-50, le=100)
    new_mine_open: bool = False
    rainfall_scenario: str = Field(default="normal", description="normal/drought/flood/monsoon_heavy")


class WhatIfResult(BaseModel):
    base_predicted: float
    scenario_predicted: float
    impact_on_production: float
    impact_on_shortfall_risk: float
    scenario_summary: str
    recommendations: List[str]


# ── Drill Here Next ────────────────────────────────────────────

class DrillCandidate(BaseModel):
    latitude: float
    longitude: float
    rank: int
    prospectivity_score: float
    confidence: float
    priority_reason: str
    estimated_cost_range: str
    geological_context: str


class DrillPrioritizationResponse(BaseModel):
    study_area: str
    total_candidates: int
    candidates: List[DrillCandidate]
    methodology: str


# ── Map Layers ─────────────────────────────────────────────────

class ManganeseOccurrence(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float
    state: str
    district: Optional[str]
    formation: Optional[str]
    host_rock: Optional[str]
    mineralization_type: Optional[str]
    grade_info: Optional[str]


class MineLocation(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float
    state: str
    district: Optional[str]
    operator: Optional[str]
    status: Optional[str]
    mineral: str = "Manganese"
