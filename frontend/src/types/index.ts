// Types matching backend API models

export interface LocationRequest {
  latitude: number;
  longitude: number;
}

export interface SpectralFeatures {
  ndvi: number;
  ndwi: number;
  savi: number;
  swir_ratio: number;
  red_edge_ndvi: number;
  iron_oxide_ratio: number;
  ferrous_mineral: number;
}

export interface TerrainFeatures {
  elevation_m: number;
  slope_deg: number;
  aspect_deg: number;
  curvature: number;
  ruggedness: number;
  hillshade: number;
}

export interface EnvironmentalFeatures {
  soil_moisture: number;
  land_surface_temp_c: number;
  rainfall_30d_mm: number;
  rainfall_7d_mm: number;
  rainfall_anomaly: number;
}

export interface GeologicalFeatures {
  formation: string;
  rock_type: string;
  distance_to_known_mn_km: number;
  distance_to_fault_km: number;
  lithology_score: number;
  mn_occurrence_count_10km: number;
}

export interface ProspectivityResult {
  prospectivity_score: number;
  confidence: number;
  confidence_level: string;
  model_version: string;
  data_quality: string;
}

export interface SHAPExplanation {
  feature_name: string;
  feature_value: number;
  shap_value: number;
  direction: string;
  description: string;
}

export interface Recommendation {
  action: string;
  priority: string;
  rationale: string;
  estimated_cost?: string;
  timeline?: string;
}

export interface LocationIntelligence {
  latitude: number;
  longitude: number;
  location_name?: string;
  state: string;
  district?: string;
  spectral: SpectralFeatures;
  terrain: TerrainFeatures;
  environmental: EnvironmentalFeatures;
  geological: GeologicalFeatures;
  prospectivity: ProspectivityResult;
  shap_top_features: SHAPExplanation[];
  recommendations: Recommendation[];
  nearby_mines: any[];
  nearby_occurrences: any[];
  data_provenance: Record<string, string>;
}

export interface ProductionForecast {
  month: string;
  year: number;
  mine_name: string;
  predicted_tonnes: number;
  predicted_target: number;
  shortfall_risk: number;
  risk_level: string;
  contributing_factors: any[];
  recommended_actions: string[];
}

export interface WhatIfParameters {
  rainfall_change_pct: number;
  equipment_uptime_pct: number;
  blast_delay_days: number;
  production_target_change_pct: number;
  new_mine_open: boolean;
  rainfall_scenario: string;
}

export interface WhatIfResult {
  base_predicted: number;
  scenario_predicted: number;
  impact_on_production: number;
  impact_on_shortfall_risk: number;
  scenario_summary: string;
  recommendations: string[];
}

export interface DrillCandidate {
  latitude: number;
  longitude: number;
  rank: number;
  prospectivity_score: number;
  confidence: number;
  priority_reason: string;
  estimated_cost_range: string;
  geological_context: string;
}

export interface ManganeseOccurrence {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  state: string;
  district?: string;
  formation?: string;
  host_rock?: string;
  mineralization_type?: string;
  grade_info?: string;
}

export interface MineLocation {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  state: string;
  district?: string;
  operator?: string;
  status?: string;
  mineral: string;
}
