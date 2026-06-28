"""Query OpenStreetMap via Overpass API for nearest features."""
import math
import requests

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
TIMEOUT = 30


def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6_371_000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlam = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlam / 2) ** 2
    return 2 * R * math.asin(math.sqrt(a))


def _overpass_query(query: str) -> dict:
    resp = requests.post(
        OVERPASS_URL,
        data={"data": query},
        timeout=TIMEOUT,
        headers={"User-Agent": "Armenia-Land-Portal/1.0"},
    )
    resp.raise_for_status()
    return resp.json()


def _nearest_node(lat: float, lon: float, elements: list[dict], ref_lat: float, ref_lon: float) -> tuple[float, dict | None]:
    best_dist = float("inf")
    best = None
    for el in elements:
        if "lat" in el and "lon" in el:
            d = _haversine_m(ref_lat, ref_lon, el["lat"], el["lon"])
            if d < best_dist:
                best_dist = d
                best = el
    return best_dist, best


def get_nearest_road(lat: float, lon: float, radius_m: int = 5000) -> dict:
    query = f"""
[out:json][timeout:{TIMEOUT}];
(
  way["highway"~"motorway|trunk|primary|secondary|tertiary|unclassified|residential|service|track|path|footway"]
    (around:{radius_m},{lat},{lon});
);
out geom;
"""
    try:
        data = _overpass_query(query)
        best_dist = float("inf")
        best_name = None
        best_type = None

        for way in data.get("elements", []):
            tags = way.get("tags", {})
            geometry = way.get("geometry", [])
            for node in geometry:
                d = _haversine_m(lat, lon, node["lat"], node["lon"])
                if d < best_dist:
                    best_dist = d
                    best_name = tags.get("name") or tags.get("ref") or "Unnamed road"
                    best_type = tags.get("highway", "road")

        if best_dist == float("inf"):
            return {"distance_m": None, "name": "Not found", "type": None}
        return {
            "distance_m": round(best_dist),
            "name": best_name,
            "type": best_type,
        }
    except Exception as exc:
        return {"distance_m": None, "name": "Error", "error": str(exc)}


def get_nearest_school(lat: float, lon: float, radius_m: int = 15000) -> dict:
    query = f"""
[out:json][timeout:{TIMEOUT}];
(
  node["amenity"~"school|university|college|kindergarten"](around:{radius_m},{lat},{lon});
  way["amenity"~"school|university|college|kindergarten"](around:{radius_m},{lat},{lon});
);
out center;
"""
    try:
        data = _overpass_query(query)
        best_dist = float("inf")
        best_name = None

        for el in data.get("elements", []):
            elat = el.get("lat") or (el.get("center") or {}).get("lat")
            elon = el.get("lon") or (el.get("center") or {}).get("lon")
            if elat and elon:
                d = _haversine_m(lat, lon, elat, elon)
                if d < best_dist:
                    best_dist = d
                    best_name = el.get("tags", {}).get("name") or "School"

        if best_dist == float("inf"):
            return {"distance_m": None, "name": "Not found"}
        return {"distance_m": round(best_dist), "name": best_name}
    except Exception as exc:
        return {"distance_m": None, "name": "Error", "error": str(exc)}


def get_nearest_hospital(lat: float, lon: float, radius_m: int = 30000) -> dict:
    query = f"""
[out:json][timeout:{TIMEOUT}];
(
  node["amenity"~"hospital|clinic|doctors|health_centre"](around:{radius_m},{lat},{lon});
  way["amenity"~"hospital|clinic|doctors|health_centre"](around:{radius_m},{lat},{lon});
);
out center;
"""
    try:
        data = _overpass_query(query)
        best_dist = float("inf")
        best_name = None

        for el in data.get("elements", []):
            elat = el.get("lat") or (el.get("center") or {}).get("lat")
            elon = el.get("lon") or (el.get("center") or {}).get("lon")
            if elat and elon:
                d = _haversine_m(lat, lon, elat, elon)
                if d < best_dist:
                    best_dist = d
                    best_name = el.get("tags", {}).get("name") or "Hospital"

        if best_dist == float("inf"):
            return {"distance_m": None, "name": "Not found"}
        return {"distance_m": round(best_dist), "name": best_name}
    except Exception as exc:
        return {"distance_m": None, "name": "Error", "error": str(exc)}


def get_all_distances(lat: float, lon: float) -> dict:
    return {
        "road": get_nearest_road(lat, lon),
        "school": get_nearest_school(lat, lon),
        "hospital": get_nearest_hospital(lat, lon),
    }
