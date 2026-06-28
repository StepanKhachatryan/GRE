"""
Satellite time-series service.

Priority:
1. Google Earth Engine (NDVI via Sentinel-2) — if credentials are available
2. Open-Meteo ERA5 for soil moisture and surface temperature (always available)
3. Synthetic seasonal NDVI for Armenia as fallback
"""
import math
import os
import random
from datetime import date, timedelta
from typing import Any

import requests

# ── Open-Meteo ─────────────────────────────────────────────────────────────

OPEN_METEO_URL = "https://archive-api.open-meteo.com/v1/archive"


def _open_meteo(lat: float, lon: float, variables: list[str], start: str, end: str) -> dict:
    resp = requests.get(
        OPEN_METEO_URL,
        params={
            "latitude": lat,
            "longitude": lon,
            "start_date": start,
            "end_date": end,
            "daily": ",".join(variables),
            "timezone": "Asia/Yerevan",
        },
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()


def get_soil_moisture_timeseries(lat: float, lon: float) -> list[dict]:
    end = date.today() - timedelta(days=5)
    start = date(end.year - 3, end.month, end.day)
    try:
        data = _open_meteo(lat, lon, ["soil_moisture_0_to_7cm"], str(start), str(end))
        daily = data.get("daily", {})
        times = daily.get("time", [])
        values = daily.get("soil_moisture_0_to_7cm", [])
        return [
            {"date": t, "value": round(v, 4) if v is not None else None}
            for t, v in zip(times, values)
        ]
    except Exception:
        return _synthetic_series(lat, lon, "soil_moisture")


def get_surface_temperature_timeseries(lat: float, lon: float) -> list[dict]:
    end = date.today() - timedelta(days=5)
    start = date(end.year - 3, end.month, end.day)
    try:
        data = _open_meteo(lat, lon, ["soil_temperature_0cm"], str(start), str(end))
        daily = data.get("daily", {})
        times = daily.get("time", [])
        values = daily.get("soil_temperature_0cm", [])
        return [
            {"date": t, "value": round(v, 2) if v is not None else None}
            for t, v in zip(times, values)
        ]
    except Exception:
        return _synthetic_series(lat, lon, "surface_temperature")


# ── NDVI via Google Earth Engine ────────────────────────────────────────────

_ee_initialized = False


def _try_init_ee() -> bool:
    global _ee_initialized
    if _ee_initialized:
        return True
    try:
        import ee  # noqa: PLC0415

        cred_file = os.environ.get("GOOGLE_APPLICATION_CREDENTIALS")
        if cred_file and os.path.exists(cred_file):
            credentials = ee.ServiceAccountCredentials(email=None, key_file=cred_file)
            ee.Initialize(credentials)
        else:
            ee.Initialize()
        _ee_initialized = True
        return True
    except Exception:
        return False


def _gee_ndvi(geometry_geojson: dict, start_date: str, end_date: str) -> list[dict]:
    import ee  # noqa: PLC0415

    geom = ee.Geometry(geometry_geojson)

    s2 = (
        ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
        .filterBounds(geom)
        .filterDate(start_date, end_date)
        .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", 30))
    )

    def monthly_ndvi(m):
        m = ee.Number(m)
        y_offset = m.divide(12).floor()
        month = m.mod(12).add(1)
        year = ee.Number(int(start_date[:4])).add(y_offset)
        start = ee.Date.fromYMD(year, month, 1)
        end_ = start.advance(1, "month")
        col = s2.filterDate(start, end_)

        ndvi_img = col.map(
            lambda img: img.normalizedDifference(["B8", "B4"]).rename("ndvi")
        ).mean()

        mean_val = ndvi_img.reduceRegion(
            reducer=ee.Reducer.mean(), geometry=geom, scale=20, maxPixels=1e8
        )
        return ee.Feature(
            None,
            {
                "date": start.format("YYYY-MM-dd"),
                "value": mean_val.get("ndvi"),
            },
        )

    n_months = (
        (int(end_date[:4]) - int(start_date[:4])) * 12
        + int(end_date[5:7])
        - int(start_date[5:7])
    )
    months = ee.List.sequence(0, n_months - 1)
    features = ee.FeatureCollection(months.map(monthly_ndvi))
    result = features.getInfo()

    return [
        {
            "date": f["properties"]["date"],
            "value": round(f["properties"]["value"], 4) if f["properties"]["value"] else None,
        }
        for f in result.get("features", [])
    ]


def get_ndvi_timeseries(lat: float, lon: float, geometry: dict | None = None) -> list[dict]:
    end = date.today() - timedelta(days=5)
    start = date(end.year - 3, end.month, end.day)

    if geometry and _try_init_ee():
        try:
            return _gee_ndvi(geometry, str(start), str(end))
        except Exception:
            pass

    return _synthetic_ndvi(lat, lon)


# ── Synthetic fallback ──────────────────────────────────────────────────────

def _elevation_factor(lat: float) -> float:
    """Approximate elevation zone effect on vegetation for Armenia."""
    if lat > 41.0:
        return 0.75
    elif lat > 40.5:
        return 0.85
    elif lat > 40.0:
        return 0.70
    else:
        return 0.60


def _ndvi_seasonal(month: int, factor: float) -> float:
    """Monthly NDVI profile for Armenian agricultural land."""
    profile = {
        1: 0.12, 2: 0.14, 3: 0.28, 4: 0.52, 5: 0.70,
        6: 0.68, 7: 0.55, 8: 0.42, 9: 0.48, 10: 0.40,
        11: 0.22, 12: 0.13,
    }
    base = profile.get(month, 0.30)
    return min(0.95, max(0.05, base * factor + random.gauss(0, 0.03)))


def _synthetic_ndvi(lat: float, lon: float) -> list[dict]:
    factor = _elevation_factor(lat)
    rng = random.Random(int(lat * 1000 + lon * 1000))
    end = date.today() - timedelta(days=5)
    start = date(end.year - 3, 1, 1)
    results = []
    current = start
    while current <= end:
        val = _ndvi_seasonal(current.month, factor)
        val += rng.gauss(0, 0.02)
        results.append({"date": str(current), "value": round(max(0.0, min(1.0, val)), 4)})
        current += timedelta(days=16)
    return results


def _synthetic_series(lat: float, lon: float, kind: str) -> list[dict]:
    rng = random.Random(int(lat * 999 + lon * 998))
    end = date.today() - timedelta(days=5)
    start = date(end.year - 3, 1, 1)
    results = []
    current = start

    while current <= end:
        m = current.month
        if kind == "soil_moisture":
            # Higher in spring, lower in summer for Armenia
            base = [0.30, 0.32, 0.35, 0.38, 0.30, 0.18, 0.12, 0.10, 0.14, 0.22, 0.28, 0.30]
            val = base[m - 1] + rng.gauss(0, 0.02)
        else:  # surface_temperature
            base = [-5, -3, 4, 12, 18, 24, 28, 27, 21, 13, 5, -2]
            val = base[m - 1] + rng.gauss(0, 2)
        results.append({"date": str(current), "value": round(val, 4)})
        current += timedelta(days=1)

    return results
