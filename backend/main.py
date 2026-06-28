"""Armenia Land Portal — FastAPI backend."""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from routers import parcels, analysis

app = FastAPI(
    title="Armenia Land Portal API",
    description="GIS platform for land sales in Armenia",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(parcels.router)
app.include_router(analysis.router)


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "Armenia Land Portal"}


# Serve built frontend in production
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.isdir(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")
