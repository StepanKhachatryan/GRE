"""Parse KMZ, KML, and GeoJSON files into standardized GeoJSON features."""
import io
import json
import uuid
import zipfile
from typing import Any
from lxml import etree
from shapely.geometry import shape, mapping, Polygon, MultiPolygon
from shapely.ops import unary_union


KML_NS = "http://www.opengis.net/kml/2.2"
KML_NS_OLD = "http://earth.google.com/kml/2.2"
KML_NS_ALT = "http://earth.google.com/kml/2.1"


def _parse_coordinates(coord_text: str) -> list[list[float]]:
    """Parse KML coordinate string into [[lon, lat], ...] list."""
    coords = []
    for point in coord_text.strip().split():
        parts = point.split(",")
        if len(parts) >= 2:
            try:
                lon, lat = float(parts[0]), float(parts[1])
                coords.append([lon, lat])
            except ValueError:
                continue
    return coords


def _element_text(el, tag: str, ns: str) -> str | None:
    found = el.find(f"{{{ns}}}{tag}")
    if found is not None and found.text:
        return found.text.strip()
    return None


def _extract_placemarks(root: etree._Element) -> list[dict[str, Any]]:
    """Recursively find all Placemark elements regardless of namespace."""
    ns_list = [KML_NS, KML_NS_OLD, KML_NS_ALT, ""]
    placemarks = []

    for ns in ns_list:
        tag = f"{{{ns}}}Placemark" if ns else "Placemark"
        for pm in root.iter(tag):
            name = None
            for n in ns_list:
                nt = f"{{{n}}}name" if n else "name"
                el = pm.find(nt)
                if el is not None and el.text:
                    name = el.text.strip()
                    break

            for n in ns_list:
                poly_tag = f"{{{n}}}Polygon" if n else "Polygon"
                for polygon_el in pm.iter(poly_tag):
                    outer_coords = None
                    holes = []

                    for n2 in ns_list:
                        outer = polygon_el.find(
                            f"{{{n2}}}outerBoundaryIs/{{{n2}}}LinearRing/{{{n2}}}coordinates"
                            if n2
                            else "outerBoundaryIs/LinearRing/coordinates"
                        )
                        if outer is not None and outer.text:
                            outer_coords = _parse_coordinates(outer.text)
                            break

                    if not outer_coords:
                        continue

                    for n2 in ns_list:
                        inner_tag = (
                            f"{{{n2}}}innerBoundaryIs/{{{n2}}}LinearRing/{{{n2}}}coordinates"
                            if n2
                            else "innerBoundaryIs/LinearRing/coordinates"
                        )
                        for inner in polygon_el.findall(inner_tag):
                            if inner.text:
                                holes.append(_parse_coordinates(inner.text))

                    placemarks.append(
                        {
                            "name": name or "Unnamed Parcel",
                            "geometry": {
                                "type": "Polygon",
                                "coordinates": [outer_coords] + holes,
                            },
                        }
                    )
    return placemarks


def _area_ha(geometry: dict) -> float:
    """Return approximate area in hectares using shapely (degrees ≈ metres at low lat)."""
    try:
        geom = shape(geometry)
        # Quick approximation: 1 degree ≈ 111 km
        centroid_lat = geom.centroid.y
        import math
        lat_m = 111_320
        lon_m = 111_320 * math.cos(math.radians(centroid_lat))
        area_m2 = abs(geom.area) * lat_m * lon_m
        return round(area_m2 / 10_000, 4)
    except Exception:
        return 0.0


def _make_feature(name: str, geometry: dict) -> dict[str, Any]:
    return {
        "id": str(uuid.uuid4()),
        "name": name,
        "geometry": geometry,
        "area_ha": _area_ha(geometry),
    }


def parse_geojson(content: bytes) -> list[dict[str, Any]]:
    data = json.loads(content.decode("utf-8"))
    features = []

    if data.get("type") == "FeatureCollection":
        items = data.get("features", [])
    elif data.get("type") == "Feature":
        items = [data]
    else:
        items = [{"type": "Feature", "geometry": data, "properties": {}}]

    for feat in items:
        geom = feat.get("geometry", {})
        if geom.get("type") not in ("Polygon", "MultiPolygon"):
            continue
        props = feat.get("properties") or {}
        name = props.get("name") or props.get("Name") or props.get("NAME") or "Parcel"
        features.append(_make_feature(name, geom))

    return features


def parse_kml(content: bytes) -> list[dict[str, Any]]:
    root = etree.fromstring(content)
    placemarks = _extract_placemarks(root)
    return [_make_feature(pm["name"], pm["geometry"]) for pm in placemarks]


def parse_kmz(content: bytes) -> list[dict[str, Any]]:
    buf = io.BytesIO(content)
    with zipfile.ZipFile(buf) as zf:
        kml_names = [n for n in zf.namelist() if n.lower().endswith(".kml")]
        if not kml_names:
            raise ValueError("No KML file found inside KMZ archive")
        kml_bytes = zf.read(kml_names[0])
    return parse_kml(kml_bytes)


def parse_file(filename: str, content: bytes) -> list[dict[str, Any]]:
    name_lower = filename.lower()
    if name_lower.endswith(".kmz"):
        return parse_kmz(content)
    elif name_lower.endswith(".kml"):
        return parse_kml(content)
    elif name_lower.endswith(".geojson") or name_lower.endswith(".json"):
        return parse_geojson(content)
    else:
        raise ValueError(f"Unsupported file format: {filename}")
