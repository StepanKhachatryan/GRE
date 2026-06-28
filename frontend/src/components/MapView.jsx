import { useEffect, useRef, useCallback } from 'react'
import L from 'leaflet'

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

const ARMENIA_CENTER = [40.069, 45.038]
const ARMENIA_ZOOM = 8

const POLYGON_STYLE = {
  color: '#e04545',
  weight: 2,
  opacity: 0.9,
  fillColor: '#cc2a2a',
  fillOpacity: 0.2,
}

const POLYGON_HOVER = {
  color: '#f97316',
  weight: 3,
  fillOpacity: 0.35,
}

const POLYGON_SELECTED = {
  color: '#f97316',
  weight: 3,
  fillColor: '#f97316',
  fillOpacity: 0.25,
}

export default function MapView({ parcels, selectedParcelId, onParcelClick, flyToRef }) {
  const containerRef = useRef(null)
  const mapRef = useRef(null)
  const layersRef = useRef({}) // id -> L.Polygon

  // Initialize map once
  useEffect(() => {
    if (mapRef.current) return

    const map = L.map(containerRef.current, {
      center: ARMENIA_CENTER,
      zoom: ARMENIA_ZOOM,
      zoomControl: false,
    })

    L.control.zoom({ position: 'bottomright' }).addTo(map)

    // Satellite base layer
    L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
        maxZoom: 19,
      }
    ).addTo(map)

    // Labels overlay
    L.tileLayer(
      'https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png',
      {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
        opacity: 0.8,
      }
    ).addTo(map)

    mapRef.current = map

    // Expose flyTo via ref
    if (flyToRef) {
      flyToRef.current = (parcel) => {
        const layer = layersRef.current[parcel.id]
        if (layer) {
          map.fitBounds(layer.getBounds(), { padding: [60, 60], maxZoom: 16 })
        }
      }
    }

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  // Sync parcels
  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Remove layers not in parcels
    const currentIds = new Set(parcels.map((p) => p.id))
    for (const [id, layer] of Object.entries(layersRef.current)) {
      if (!currentIds.has(id)) {
        map.removeLayer(layer)
        delete layersRef.current[id]
      }
    }

    // Add new parcels
    for (const parcel of parcels) {
      if (layersRef.current[parcel.id]) continue

      const layer = L.geoJSON(
        { type: 'Feature', geometry: parcel.geometry, properties: {} },
        {
          style: () =>
            parcel.id === selectedParcelId ? POLYGON_SELECTED : POLYGON_STYLE,
        }
      )

      layer.on('click', () => onParcelClick(parcel))
      layer.on('mouseover', () => {
        if (parcel.id !== selectedParcelId) layer.setStyle(POLYGON_HOVER)
        containerRef.current.style.cursor = 'pointer'
      })
      layer.on('mouseout', () => {
        if (parcel.id !== selectedParcelId) layer.setStyle(POLYGON_STYLE)
        containerRef.current.style.cursor = ''
      })

      layer.addTo(map)
      layersRef.current[parcel.id] = layer
    }
  }, [parcels, selectedParcelId, onParcelClick])

  // Update styles on selection change
  useEffect(() => {
    for (const [id, layer] of Object.entries(layersRef.current)) {
      layer.setStyle(id === selectedParcelId ? POLYGON_SELECTED : POLYGON_STYLE)
    }
  }, [selectedParcelId])

  return (
    <div ref={containerRef} className="flex-1 h-full" />
  )
}
