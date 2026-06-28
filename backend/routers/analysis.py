"""Analyze a land parcel: OSM distances + satellite time series."""
import asyncio
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from services.osm_service import get_all_distances
from services.satellite_service import (
    get_ndvi_timeseries,
    get_soil_moisture_timeseries,
    get_surface_temperature_timeseries,
)

router = APIRouter(prefix="/api/analysis", tags=["analysis"])


class AnalysisRequest(BaseModel):
    parcel_id: str
    centroid_lat: float = Field(..., ge=-90, le=90)
    centroid_lon: float = Field(..., ge=-180, le=180)
    geometry: dict[str, Any] | None = None


@router.post("")
async def analyze_parcel(req: AnalysisRequest):
    lat, lon = req.centroid_lat, req.centroid_lon

    loop = asyncio.get_event_loop()

    distances_future = loop.run_in_executor(None, get_all_distances, lat, lon)
    soil_future = loop.run_in_executor(None, get_soil_moisture_timeseries, lat, lon)
    temp_future = loop.run_in_executor(None, get_surface_temperature_timeseries, lat, lon)
    ndvi_future = loop.run_in_executor(
        None, get_ndvi_timeseries, lat, lon, req.geometry
    )

    distances, soil, temp, ndvi = await asyncio.gather(
        distances_future, soil_future, temp_future, ndvi_future
    )

    return {
        "parcel_id": req.parcel_id,
        "centroid": {"lat": lat, "lon": lon},
        "distances": distances,
        "timeseries": {
            "ndvi": ndvi,
            "soil_moisture": soil,
            "surface_temperature": temp,
        },
    }
