"""Upload and parse land parcel files (KMZ, KML, GeoJSON)."""
from fastapi import APIRouter, HTTPException, UploadFile, File

from services.file_parser import parse_file

router = APIRouter(prefix="/api/parcels", tags=["parcels"])


@router.post("/upload")
async def upload_parcels(file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    ext = file.filename.lower().split(".")[-1]
    if ext not in ("kmz", "kml", "geojson", "json"):
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '.{ext}'. Accepted: .kmz .kml .geojson .json",
        )

    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="File exceeds 50 MB limit")

    try:
        parcels = parse_file(file.filename, content)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Parse error: {exc}") from exc

    if not parcels:
        raise HTTPException(
            status_code=422,
            detail="No polygon features found in the uploaded file",
        )

    return {"count": len(parcels), "parcels": parcels}
