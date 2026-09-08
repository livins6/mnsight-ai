"""
MnSight AI — Real Datasets
Manganese occurrences, mine locations, and geological data for the study area.
Based on real GSI/IBM/MOIL publicly available data.
"""

import math
import random
from typing import List, Dict, Any

# ── Manganese Occurrences in India (GSI Data) ──────────────────
# Based on Geological Survey of India published manganese occurrence data
# Maharashtra and Madhya Pradesh are the primary manganese belts

MANGANESE_OCCURRENCES: List[Dict[str, Any]] = [
    # Maharashtra — Balaghat Belt
    {"id": 1, "name": "Balaghat Deposit", "latitude": 21.8039, "longitude": 80.1832,
     "state": "Madhya Pradesh", "district": "Balaghat", "formation": "Sausar Fm",
     "host_rock": "Manganiferous Quartzite", "mineralization_type": "oxide", "grade_info": "35-52% MnO"},
    {"id": 2, "name": "Ramriguda Deposit", "latitude": 21.7531, "longitude": 80.2245,
     "state": "Madhya Pradesh", "district": "Balaghat", "formation": "Sausar Fm",
     "host_rock": "Manganiferous Schist", "mineralization_type": "oxide", "grade_info": "30-45% MnO"},
    {"id": 3, "name": "Kandri Deposit", "latitude": 21.6891, "longitude": 80.1123,
     "state": "Madhya Pradesh", "district": "Balaghat", "formation": "Sausar Fm",
     "host_rock": "Braunite-bearing Quartzite", "mineralization_type": "oxide", "grade_info": "38-55% MnO"},
    {"id": 4, "name": "Munsurbad Deposit", "latitude": 21.8250, "longitude": 80.3100,
     "state": "Madhya Pradesh", "district": "Balaghat", "formation": "Sausar Fm",
     "host_rock": "Manganiferous Garnet Schist", "mineralization_type": "oxide", "grade_info": "32-48% MnO"},
    {"id": 5, "name": "Kosmi Deposit", "latitude": 21.9100, "longitude": 80.0500,
     "state": "Madhya Pradesh", "district": "Balaghat", "formation": "Sausar Fm",
     "host_rock": "Rhodonite-bearing Quartzite", "mineralization_type": "oxide", "grade_info": "28-42% MnO"},

    # Maharashtra — Nagpur Belt
    {"id": 6, "name": "Nagpur East", "latitude": 21.1450, "longitude": 79.1200,
     "state": "Maharashtra", "district": "Nagpur", "formation": "Bhandara Fm",
     "host_rock": "Manganiferous Dolomite", "mineralization_type": "carbonate", "grade_info": "25-38% MnO"},
    {"id": 7, "name": "Bhiwapur Deposit", "latitude": 21.3200, "longitude": 79.4500,
     "state": "Maharashtra", "district": "Nagpur", "formation": "Bhandara Fm",
     "host_rock": "Manganiferous Schist", "mineralization_type": "oxide", "grade_info": "30-42% MnO"},
    {"id": 8, "name": "Umred Deposit", "latitude": 20.8500, "longitude": 79.3200,
     "state": "Maharashtra", "district": "Nagpur", "formation": "Bhandara Fm",
     "host_rock": "Braunite-bearing Schist", "mineralization_type": "oxide", "grade_info": "35-50% MnO"},

    # Maharashtra — Wardha Belt
    {"id": 9, "name": "Hinganghat Deposit", "latitude": 20.5500, "longitude": 78.8300,
     "state": "Maharashtra", "district": "Wardha", "formation": "Sausar Fm",
     "host_rock": "Manganiferous Quartzite", "mineralization_type": "oxide", "grade_info": "28-40% MnO"},
    {"id": 10, "name": "Arvi Deposit", "latitude": 20.9100, "longitude": 78.9800,
     "state": "Maharashtra", "district": "Wardha", "formation": "Sausar Fm",
     "host_rock": "Manganiferous Schist", "mineralization_type": "oxide", "grade_info": "32-48% MnO"},
    {"id": 11, "name": "Deoli Deposit", "latitude": 20.6400, "longitude": 78.8100,
     "state": "Maharashtra", "district": "Wardha", "formation": "Sausar Fm",
     "host_rock": "Rhodonite-bearing Schist", "mineralization_type": "oxide", "grade_info": "26-38% MnO"},

    # Madhya Pradesh — Mandla Belt
    {"id": 12, "name": "Mandla Deposit", "latitude": 22.5900, "longitude": 80.3700,
     "state": "Madhya Pradesh", "district": "Mandla", "formation": "Sausar Fm",
     "host_rock": "Manganiferous Quartzite", "mineralization_type": "oxide", "grade_info": "30-45% MnO"},
    {"id": 13, "name": "Dindori Deposit", "latitude": 22.9400, "longitude": 80.8700,
     "state": "Madhya Pradesh", "district": "Dindori", "formation": "Sausar Fm",
     "host_rock": "Braunite-bearing Quartzite", "mineralization_type": "oxide", "grade_info": "35-52% MnO"},

    # Maharashtra — Ratnagiri (Lateritic Mn)
    {"id": 14, "name": "Ratnagiri Deposit", "latitude": 16.9900, "longitude": 73.3000,
     "state": "Maharashtra", "district": "Ratnagiri", "formation": "Lateritic",
     "host_rock": "Lateritic Manganese Ore", "mineralization_type": "oxide", "grade_info": "20-35% MnO"},

    # Odisha — Keonjhar Belt
    {"id": 15, "name": "Keonjhar Deposit", "latitude": 21.6300, "longitude": 85.5800,
     "state": "Odisha", "district": "Keonjhar", "formation": "Iron Ore Group",
     "host_rock": "Manganiferous Iron Formation", "mineralization_type": "oxide", "grade_info": "25-40% MnO"},

    # Additional occurrences
    {"id": 16, "name": "Chhindwara Deposit", "latitude": 22.0600, "longitude": 78.9400,
     "state": "Madhya Pradesh", "district": "Chhindwara", "formation": "Gondwana",
     "host_rock": "Manganiferous Conglomerate", "mineralization_type": "oxide", "grade_info": "22-35% MnO"},
    {"id": 17, "name": "Chanda Deposit", "latitude": 20.1500, "longitude": 79.3000,
     "state": "Maharashtra", "district": "Chandrapur", "formation": "Sausar Fm",
     "host_rock": "Manganiferous Schist", "mineralization_type": "oxide", "grade_info": "28-42% MnO"},
    {"id": 18, "name": "Bhandara Deposit", "latitude": 21.1700, "longitude": 79.6500,
     "state": "Maharashtra", "district": "Bhandara", "formation": "Bhandara Fm",
     "host_rock": "Manganiferous Quartzite", "mineralization_type": "oxide", "grade_info": "32-48% MnO"},
    {"id": 19, "name": "Narsinghpur Deposit", "latitude": 22.9400, "longitude": 79.2000,
     "state": "Madhya Pradesh", "district": "Narsinghpur", "formation": "Sausar Fm",
     "host_rock": "Manganiferous Garnet Schist", "mineralization_type": "oxide", "grade_info": "25-40% MnO"},
    {"id": 20, "name": "Seoni Deposit", "latitude": 22.0800, "longitude": 79.5500,
     "state": "Madhya Pradesh", "district": "Seoni", "formation": "Sausar Fm",
     "host_rock": "Braunite-bearing Quartzite", "mineralization_type": "oxide", "grade_info": "30-45% MnO"},

    # Odisha — Keonjhar & Bonai belts
    {"id": 21, "name": "Barbil Deposit", "latitude": 22.1100, "longitude": 85.3800,
     "state": "Odisha", "district": "Keonjhar", "formation": "Iron Ore Group",
     "host_rock": "Manganiferous BIF", "mineralization_type": "oxide", "grade_info": "25-40% MnO"},
    {"id": 22, "name": "Joda Deposit", "latitude": 22.0300, "longitude": 85.4300,
     "state": "Odisha", "district": "Keonjhar", "formation": "Iron Ore Group",
     "host_rock": "Manganiferous Shale", "mineralization_type": "oxide", "grade_info": "22-38% MnO"},
    {"id": 23, "name": "Bonai Deposit", "latitude": 21.9600, "longitude": 85.1000,
     "state": "Odisha", "district": "Sundargarh", "formation": "Iron Ore Group",
     "host_rock": "Manganiferous Quartzite", "mineralization_type": "oxide", "grade_info": "28-45% MnO"},
    {"id": 24, "name": "Rayagada Deposit", "latitude": 19.1600, "longitude": 83.4200,
     "state": "Odisha", "district": "Rayagada", "formation": "Eastern Ghats Belt",
     "host_rock": "Manganiferous Khondalite", "mineralization_type": "oxide", "grade_info": "20-35% MnO"},

    # Andhra Pradesh — Srikakulam–Vizianagaram belt (Kodur–Garividi)
    {"id": 25, "name": "Garividi Deposit", "latitude": 18.2900, "longitude": 83.5300,
     "state": "Andhra Pradesh", "district": "Vizianagaram", "formation": "Eastern Ghats Belt",
     "host_rock": "Manganiferous Khondalite", "mineralization_type": "oxide", "grade_info": "30-48% MnO"},
    {"id": 26, "name": "Koduru Deposit", "latitude": 18.2500, "longitude": 83.4800,
     "state": "Andhra Pradesh", "district": "Srikakulam", "formation": "Eastern Ghats Belt",
     "host_rock": "Braunite-bearing Schist", "mineralization_type": "oxide", "grade_info": "28-45% MnO"},
    {"id": 27, "name": "Garbham Deposit", "latitude": 18.2600, "longitude": 83.6100,
     "state": "Andhra Pradesh", "district": "Vizianagaram", "formation": "Eastern Ghats Belt",
     "host_rock": "Manganiferous Quartzite", "mineralization_type": "oxide", "grade_info": "25-40% MnO"},

    # Karnataka — Sandur, Shimoga, Chitradurga belts
    {"id": 28, "name": "Sandur Deposit", "latitude": 15.0900, "longitude": 76.5400,
     "state": "Karnataka", "district": "Bellary", "formation": "Dharwar Fm",
     "host_rock": "Manganiferous Chert", "mineralization_type": "oxide", "grade_info": "28-42% MnO"},
    {"id": 29, "name": "Shimoga Deposit", "latitude": 13.9300, "longitude": 75.5700,
     "state": "Karnataka", "district": "Shimoga", "formation": "Dharwar Fm",
     "host_rock": "Manganiferous Schist", "mineralization_type": "oxide", "grade_info": "25-38% MnO"},
    {"id": 30, "name": "Chitradurga Deposit", "latitude": 14.2300, "longitude": 76.4000,
     "state": "Karnataka", "district": "Chitradurga", "formation": "Dharwar Fm",
     "host_rock": "Braunite-bearing Quartzite", "mineralization_type": "oxide", "grade_info": "30-45% MnO"},

    # Gujarat — Panchmahal belt
    {"id": 31, "name": "Chhota Udepur Deposit", "latitude": 22.3000, "longitude": 74.0200,
     "state": "Gujarat", "district": "Chhota Udepur", "formation": "Aravalli Fm",
     "host_rock": "Manganiferous Phyllite", "mineralization_type": "oxide", "grade_info": "22-35% MnO"},

    # Rajasthan — Banswara belt
    {"id": 32, "name": "Banswara Deposit", "latitude": 23.5400, "longitude": 74.4400,
     "state": "Rajasthan", "district": "Banswara", "formation": "Aravalli Fm",
     "host_rock": "Manganiferous Quartzite", "mineralization_type": "oxide", "grade_info": "25-40% MnO"},

    # Jharkhand — Singhbhum belt
    {"id": 33, "name": "Noamundi Deposit", "latitude": 22.1400, "longitude": 85.5100,
     "state": "Jharkhand", "district": "West Singhbhum", "formation": "Iron Ore Group",
     "host_rock": "Manganiferous BIF", "mineralization_type": "oxide", "grade_info": "25-42% MnO"},

    # West Bengal — Purulia belt
    {"id": 34, "name": "Purulia Deposit", "latitude": 23.3300, "longitude": 86.3600,
     "state": "West Bengal", "district": "Purulia", "formation": "Singhbhum Group",
     "host_rock": "Manganiferous Schist", "mineralization_type": "oxide", "grade_info": "22-38% MnO"},

    # Goa — minor Mn in laterite
    {"id": 35, "name": "Sanguem Deposit", "latitude": 15.2300, "longitude": 74.1600,
     "state": "Goa", "district": "South Goa", "formation": "Lateritic",
     "host_rock": "Lateritic Manganese Ore", "mineralization_type": "oxide", "grade_info": "15-30% MnO"},
]

# ── MOIL Mine Locations ────────────────────────────────────────
# MOIL Limited operates the largest manganese mines in India

MOIL_MINES: List[Dict[str, Any]] = [
    # Real MOIL mine list (MOIL operates 10 mines in Maharashtra & Madhya Pradesh)
    # 7 underground: Kandri, Munsar, Beldongri, Gumgaon, Chikla, Balaghat, Ukwa
    # 3 opencast: Dongri Buzurg, Sitapatore, Tirodi
    {"id": 1, "name": "Balaghat Mine", "latitude": 21.8039, "longitude": 80.1832,
     "state": "Madhya Pradesh", "district": "Balaghat", "operator": "MOIL Ltd",
     "status": "active", "mineral": "Manganese", "type": "underground",
     "note": "Deepest manganese mine in Asia (383m); largest single MOIL mine"},
    {"id": 2, "name": "Tirodi Mine", "latitude": 21.6801, "longitude": 79.7167,
     "state": "Madhya Pradesh", "district": "Balaghat", "operator": "MOIL Ltd",
     "status": "active", "mineral": "Manganese", "type": "opencast"},
    {"id": 3, "name": "Ukwa Mine", "latitude": 21.9708, "longitude": 80.4666,
     "state": "Madhya Pradesh", "district": "Balaghat", "operator": "MOIL Ltd",
     "status": "active", "mineral": "Manganese", "type": "underground"},
    {"id": 4, "name": "Kandri Mine", "latitude": 21.4205, "longitude": 79.2764,
     "state": "Maharashtra", "district": "Nagpur", "operator": "MOIL Ltd",
     "status": "active", "mineral": "Manganese", "type": "underground"},
    {"id": 5, "name": "Munsar Mine", "latitude": 21.3981, "longitude": 79.2795,
     "state": "Maharashtra", "district": "Nagpur", "operator": "MOIL Ltd",
     "status": "active", "mineral": "Manganese", "type": "underground"},
    {"id": 6, "name": "Beldongri Mine", "latitude": 21.0900, "longitude": 79.0400,
     "state": "Maharashtra", "district": "Nagpur", "operator": "MOIL Ltd",
     "status": "active", "mineral": "Manganese", "type": "underground"},
    {"id": 7, "name": "Gumgaon Mine", "latitude": 20.9889, "longitude": 79.0303,
     "state": "Maharashtra", "district": "Nagpur", "operator": "MOIL Ltd",
     "status": "active", "mineral": "Manganese", "type": "underground"},
    {"id": 8, "name": "Chikla Mine", "latitude": 21.5330, "longitude": 79.7428,
     "state": "Maharashtra", "district": "Bhandara", "operator": "MOIL Ltd",
     "status": "active", "mineral": "Manganese", "type": "underground"},
    {"id": 9, "name": "Dongri Buzurg Mine", "latitude": 21.5502, "longitude": 79.6940,
     "state": "Maharashtra", "district": "Bhandara", "operator": "MOIL Ltd",
     "status": "active", "mineral": "Manganese", "type": "opencast"},
    {"id": 10, "name": "Sitapatore Mine", "latitude": 21.5900, "longitude": 79.7200,
     "state": "Maharashtra", "district": "Bhandara", "operator": "MOIL Ltd",
     "status": "active", "mineral": "Manganese", "type": "opencast"},
]

# ── Geological Formations in the Mn Belt ───────────────────────

GEOLOGICAL_FORMATIONS = {
    "Sausar Fm": {
        "name": "Sausar Formation",
        "age": "Proterozoic (Archaean-Palaeoproterozoic)",
        "description": "Manganese-bearing metamorphic suite in the Central Indian Tectonic Zone",
        "lithology": ["Quartzite", "Schist", "Garnetiferous Schist", "Calc-silicate", "Manganiferous Quartzite"],
        "mn_prospectivity": 0.85,
        "color": "#8B4513",
    },
    "Bhandara Fm": {
        "name": "Bhandara Formation",
        "age": "Proterozoic",
        "description": "Supracrustal suite hosting Mn mineralization in Nagpur-Bhandara belt",
        "lithology": ["Dolomite", "Quartzite", "Phyllite", "Manganiferous Dolomite"],
        "mn_prospectivity": 0.70,
        "color": "#CD853F",
    },
    "Iron Ore Group": {
        "name": "Iron Ore Group",
        "age": "Archaean",
        "description": "Greenstone belt hosting iron and manganese mineralization",
        "lithology": ["Banded Iron Formation", "Volcanics", "Quartzite", "Shale"],
        "mn_prospectivity": 0.55,
        "color": "#B22222",
    },
    "Gondwana": {
        "name": "Gondwana Supergroup",
        "age": "Permo-Carboniferous to Cretaceous",
        "description": "Sedimentary basin with coal and minor Mn occurrences",
        "lithology": ["Sandstone", "Shale", "Conglomerate", "Coal"],
        "mn_prospectivity": 0.25,
        "color": "#556B2F",
    },
    "Lateritic": {
        "name": "Lateritic Cover",
        "age": "Cenozoic",
        "description": "Weathered lateritic duricrust with secondary Mn enrichment",
        "lithology": ["Laterite", "Bauxite", "Ferruginous Laterite", "Manganese Laterite"],
        "mn_prospectivity": 0.40,
        "color": "#D2691E",
    },
    "Archean": {
        "name": "Archaean Craton",
        "age": ">2.5 Ga",
        "description": "Basement gneisses and greenstone belts",
        "lithology": ["Gneiss", "Granite", "Amphibolite", "Greenstone"],
        "mn_prospectivity": 0.45,
        "color": "#4A4A4A",
    },
    "Eastern Ghats Belt": {
        "name": "Eastern Ghats Mobile Belt",
        "age": "Proterozoic",
        "description": "Khondalite-charnockite suite hosting Mn in Odisha-AP coastal belt",
        "lithology": ["Khondalite", "Quartzite", "Gondite", "Calc-silicate"],
        "mn_prospectivity": 0.62,
        "color": "#6B8E23",
    },
    "Dharwar Fm": {
        "name": "Dharwar Supergroup",
        "age": "Archaean-Palaeoproterozoic",
        "description": "Schist belts of Karnataka hosting Mn in Sandur-Shimoga-Chitradurga",
        "lithology": ["Schist", "Chert", "Quartzite", "Volcanics"],
        "mn_prospectivity": 0.58,
        "color": "#556B2F",
    },
    "Aravalli Fm": {
        "name": "Aravalli Supergroup",
        "age": "Palaeoproterozoic",
        "description": "Metasedimentary belt of Rajasthan-Gujarat with Mn in Banswara belt",
        "lithology": ["Phyllite", "Quartzite", "Carbonate", "Schist"],
        "mn_prospectivity": 0.50,
        "color": "#8B7355",
    },
    "Singhbhum Group": {
        "name": "Singhbhum Group",
        "age": "Archaean",
        "description": "Metasedimentary suite of Jharkhand-West Bengal with Mn occurrences",
        "lithology": ["Schist", "Quartzite", "BIF", "Phyllite"],
        "mn_prospectivity": 0.52,
        "color": "#7B5B3A",
    },
}

# ── Faults and Lineaments ──────────────────────────────────────
# Major geological structures in the Central Indian Mn belt

FAULTS_LINEAMENTS = [
    {"name": "Balaghat Fault", "type": "fault", "trend": "NE-SW",
     "lat_start": 21.5, "lon_start": 79.8, "lat_end": 22.2, "lon_end": 80.5},
    {"name": "Tapti Lineament", "type": "lineament", "trend": "E-W",
     "lat_start": 20.0, "lon_start": 77.5, "lat_end": 20.5, "lon_end": 80.0},
    {"name": "Narmada Fault", "type": "fault", "trend": "ENE-WSW",
     "lat_start": 22.0, "lon_start": 78.0, "lat_end": 23.0, "lon_end": 82.0},
    {"name": "Sausar Shear Zone", "type": "shear_zone", "trend": "NE-SW",
     "lat_start": 21.0, "lon_start": 79.0, "lat_end": 21.8, "lon_end": 80.5},
]


def get_nearest_occurrence(lat: float, lon: float) -> tuple:
    """Find the nearest manganese occurrence and return (distance_km, occurrence_dict)."""
    min_dist = float('inf')
    nearest = None
    for occ in MANGANESE_OCCURRENCES:
        d = haversine_km(lat, lon, occ['latitude'], occ['longitude'])
        if d < min_dist:
            min_dist = d
            nearest = occ
    return min_dist, nearest


def get_nearest_fault(lat: float, lon: float) -> float:
    """Find distance to nearest fault/lineament in km."""
    min_dist = float('inf')
    for f in FAULTS_LINEAMENTS:
        # Approximate distance to line segment
        d = point_to_segment_distance(lat, lon,
                                       f['lat_start'], f['lon_start'],
                                       f['lat_end'], f['lon_end'])
        if d < min_dist:
            min_dist = d
    return min_dist


def count_occurrences_in_radius(lat: float, lon: float, radius_km: float = 10.0) -> int:
    """Count manganese occurrences within a given radius."""
    count = 0
    for occ in MANGANESE_OCCURRENCES:
        d = haversine_km(lat, lon, occ['latitude'], occ['longitude'])
        if d <= radius_km:
            count += 1
    return count


def get_nearby_mines(lat: float, lon: float, radius_km: float = 50.0) -> List[Dict[str, Any]]:
    """Get mines within radius."""
    result = []
    for mine in MOIL_MINES:
        d = haversine_km(lat, lon, mine['latitude'], mine['longitude'])
        if d <= radius_km:
            result.append({**mine, "distance_km": round(d, 2)})
    result.sort(key=lambda x: x['distance_km'])
    return result


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Haversine distance in km between two points."""
    R = 6371.0
    φ1 = math.radians(lat1)
    φ2 = math.radians(lat2)
    Δφ = math.radians(lat2 - lat1)
    Δλ = math.radians(lon2 - lon1)
    a = math.sin(Δφ / 2) ** 2 + math.cos(φ1) * math.cos(φ2) * math.sin(Δλ / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


def point_to_segment_distance(lat: float, lon: float,
                               lat1: float, lon1: float,
                               lat2: float, lon2: float) -> float:
    """Approximate distance from a point to a line segment in km."""
    # Project to approximate Cartesian
    mid_lat = (lat1 + lat2) / 2
    km_per_deg_lat = 111.0
    km_per_deg_lon = 111.0 * math.cos(math.radians(mid_lat))

    px = (lon - lon1) * km_per_deg_lon
    py = (lat - lat1) * km_per_deg_lat
    ax = (lon2 - lon1) * km_per_deg_lon
    ay = (lat2 - lat1) * km_per_deg_lat

    seg_len_sq = ax * ax + ay * ay
    if seg_len_sq < 1e-12:
        return math.sqrt(px * px + py * py)

    t = max(0, min(1, (px * ax + py * ay) / seg_len_sq))
    proj_x = t * ax
    proj_y = t * ay

    return math.sqrt((px - proj_x) ** 2 + (py - proj_y) ** 2)


def get_geological_formation(lat: float, lon: float) -> str:
    """
    Assign a geological formation based on location.
    This is a simplified model for the study area.
    In production, this would use actual geological map shapefiles.
    """
    # Central Indian Mn belt: Sausar Formation
    if 21.0 <= lat <= 22.5 and 79.0 <= lon <= 80.5:
        return "Sausar Fm"
    # Nagpur-Bhandara belt
    elif 20.5 <= lat <= 21.5 and 79.0 <= lon <= 80.0:
        return "Bhandara Fm"
    # Lateritic cover on the west coast (Goa, Ratnagiri)
    elif 14.5 <= lat <= 18.0 and 73.0 <= lon <= 74.5:
        return "Lateritic"
    # Keonjhar-Bonai-Singhbhum iron-manganese belts
    elif 21.0 <= lat <= 23.0 and 84.5 <= lon <= 86.5:
        return "Iron Ore Group"
    # Eastern Ghats belt (Srikakulam-Vizianagaram, Rayagada)
    elif 17.5 <= lat <= 20.5 and 83.0 <= lon <= 84.5:
        return "Eastern Ghats Belt"
    # Dharwar schist belts of Karnataka
    elif 12.5 <= lat <= 16.0 and 74.5 <= lon <= 77.5:
        return "Dharwar Fm"
    # Aravalli belt (Rajasthan-Gujarat)
    elif 23.0 <= lat <= 26.0 and 72.5 <= lon <= 75.0:
        return "Aravalli Fm"
    # Purulia
    elif 22.5 <= lat <= 23.5 and 86.0 <= lon <= 86.8:
        return "Singhbhum Group"
    # Gondwana basins
    elif 22.0 <= lat <= 23.5 and 78.0 <= lon <= 80.0:
        return "Gondwana"
    else:
        return "Archean"


def get_rock_type(formation: str) -> str:
    """Get dominant rock type for a formation."""
    if formation in GEOLOGICAL_FORMATIONS:
        lits = GEOLOGICAL_FORMATIONS[formation]["lithology"]
        return lits[0] if lits else "Unknown"
    return "Unknown"
