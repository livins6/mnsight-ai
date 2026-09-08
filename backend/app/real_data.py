"""
MnSight AI — Real Data (All India)
===================================
Real MOIL production figures (company-level, from MOIL press releases /
quantitative details FY25–FY26) and an all-India monthly rainfall grid
(ERA5 reanalysis via Open-Meteo archive, Sep 2023 – Aug 2025).

Production figures are MOIL *company totals* (thousand tonnes/month).
MOIL does not publish per-mine monthly output, so each mine is allocated
a share (based on published mine-size rankings) such that the sum across
the 10 mines matches the real company total for every month.
"""

import json
import os
import math

_DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")

# ── Real MOIL monthly production (tonnes, company total) ─────────
# Sources (MOIL press releases & disclosures):
#   Sep 2024: 146k | Oct 2024: 147k | Nov 2024: 163k
#   Q3 FY25 (Oct–Dec) total 460k  -> Dec 2024 = 150k
#   Jan 2025: 160k (all-time monthly record, Machine Maker/CNBC-TV18)
#   Feb 2025: 153k | Mar 2025: 160k (FY25 total = 18.03 lakh tonnes)
#   Apr 2025: 162k | May 2025: 172k | Jun 2025: 168k
#   Jul 2025: 145k | Aug 2025: 145k
REAL_MONTHLY_PRODUCTION_TONNES = {
    "2024-09": 146_000,
    "2024-10": 147_000,
    "2024-11": 163_000,
    "2024-12": 150_000,
    "2025-01": 160_000,
    "2025-02": 153_000,
    "2025-03": 160_000,
    "2025-04": 162_000,
    "2025-05": 172_000,
    "2025-06": 168_000,
    "2025-07": 145_000,
    "2025-08": 145_000,
}

# Indicative per-mine share of MOIL output (sums to 1.0).
# Based on published mine-size rankings (Balaghat = largest single mine;
# Dongri Buzurg = major opencast). Shares are indicative — MOIL reports
# only company-level monthly figures.
MOIL_MINE_SHARES = {
    "Balaghat Mine": 0.17,
    "Dongri Buzurg Mine": 0.14,
    "Kandri Mine": 0.12,
    "Munsar Mine": 0.11,
    "Tirodi Mine": 0.10,
    "Gumgaon Mine": 0.08,
    "Ukwa Mine": 0.08,
    "Chikla Mine": 0.08,
    "Sitapatore Mine": 0.07,
    "Beldongri Mine": 0.05,
}

# Annual production (tonnes) for FY years before the real monthly window.
# FY25 = 1,803,000 (record, MOIL). Earlier years approximate from
# MOIL annual reports / IBM production data.
ANNUAL_PRODUCTION_TONNES = {
    2019: 1_190_000,
    2020: 1_270_000,
    2021: 1_330_000,
    2022: 1_360_000,
    2023: 1_490_000,
    2024: 1_540_000,
    2025: 1_803_000,
}

_MONTHLY_SEASONAL = {  # relative monthly weight within a year (monsoon dip)
    1: 1.04, 2: 1.06, 3: 1.10, 4: 1.08, 5: 1.02,
    6: 0.78, 7: 0.62, 8: 0.64, 9: 0.80,
    10: 1.00, 11: 1.10, 12: 1.06,
}

# ── All-India rainfall grid (ERA5 reanalysis via Open-Meteo) ─────

_RAIN_GRID = None  # lazy-loaded cache: {"months": [...], "cells": [{lat,lon,times,mm}]}


def load_rainfall_grid():
    """Load the all-India monthly rainfall grid (lazy, cached)."""
    global _RAIN_GRID
    if _RAIN_GRID is None:
        path = os.path.join(_DATA_DIR, "india_rainfall_grid.json")
        with open(path, "r", encoding="utf-8") as f:
            _RAIN_GRID = json.load(f)
    return _RAIN_GRID


def _nearest_cell(lat: float, lon: float):
    grid = load_rainfall_grid()
    best, best_d = None, float("inf")
    for c in grid["cells"]:
        d = (c["lat"] - lat) ** 2 + (c["lon"] - lon) ** 2
        if d < best_d:
            best_d = d
            best = c
    return best


def get_monthly_rainfall(lat: float, lon: float, month: str) -> float:
    """Real monthly rainfall (mm) at (lat, lon) for 'YYYY-MM'.
    Falls back to the nearest available month in the grid if `month`
    is outside the grid's coverage."""
    grid = load_rainfall_grid()
    cell = _nearest_cell(lat, lon)
    times = cell.get("times") or grid["months"]
    mm = cell.get("mm")
    try:
        idx = times.index(month)
        return float(mm[idx])
    except (ValueError, IndexError):
        # nearest available month
        months = grid["months"]
        nearest = min(months, key=lambda m: abs(
            (int(m[:4]) * 12 + int(m[5:7])) - (int(month[:4]) * 12 + int(month[5:7]))
        ))
        try:
            idx = times.index(nearest)
            return float(mm[idx])
        except (ValueError, IndexError):
            return 0.0


def get_rainfall_series(lat: float, lon: float) -> dict:
    """Full monthly rainfall series (month -> mm) at a location."""
    grid = load_rainfall_grid()
    cell = _nearest_cell(lat, lon)
    times = cell.get("times") or grid["months"]
    mm = cell.get("mm")
    return {m: float(v) for m, v in zip(times, mm)}


def rainfall_anomaly(lat: float, lon: float, month: str) -> float:
    """Rainfall anomaly: current month vs same month previous year.
    Positive = wetter than last year. Returns 0.0 if not comparable."""
    y, m = month.split("-")
    prev = f"{int(y) - 1}-{m}"
    try:
        cur = get_monthly_rainfall(lat, lon, month)
        last = get_monthly_rainfall(lat, lon, prev)
    except Exception:
        return 0.0
    if last <= 0:
        return 0.0
    return round((cur - last) / last, 4)


def company_production_for_month(month: str) -> float:
    """Real company production for a month, else seasonal estimate."""
    if month in REAL_MONTHLY_PRODUCTION_TONNES:
        return float(REAL_MONTHLY_PRODUCTION_TONNES[month])
    year = int(month[:4])
    m = int(month[5:7])
    annual = ANNUAL_PRODUCTION_TONNES.get(year, 1_540_000)
    seasonal = _MONTHLY_SEASONAL.get(m, 1.0)
    # distribute annual total over 12 months using seasonal weights
    total_w = sum(_MONTHLY_SEASONAL.values())
    return annual * seasonal / total_w


def mine_production_for_month(mine_name: str, month: str) -> float:
    """Real-anchored monthly production for one mine."""
    share = MOIL_MINE_SHARES.get(mine_name, 0.10)
    return company_production_for_month(month) * share