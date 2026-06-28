import { useState, useRef, useCallback } from 'react'
import TopBar from './components/TopBar.jsx'
import Sidebar from './components/Sidebar.jsx'
import MapView from './components/MapView.jsx'
import AnalysisPanel from './components/AnalysisPanel.jsx'
import { uploadParcels, analyzeParcels } from './services/api.js'

function centroidOf(geometry) {
  const coords =
    geometry.type === 'Polygon'
      ? geometry.coordinates[0]
      : geometry.coordinates[0][0]

  let latSum = 0
  let lonSum = 0
  let count = 0
  for (const [lon, lat] of coords) {
    lonSum += lon
    latSum += lat
    count++
  }
  return { lat: latSum / count, lon: lonSum / count }
}

export default function App() {
  const [parcels, setParcels] = useState([])
  const [uploading, setUploading] = useState(false)
  const [selectedParcel, setSelectedParcel] = useState(null)
  const [analysis, setAnalysis] = useState(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)

  const flyToRef = useRef(null)

  const handleUpload = useCallback(async (file) => {
    setUploading(true)
    try {
      const result = await uploadParcels(file)
      setParcels((prev) => {
        const existingIds = new Set(prev.map((p) => p.id))
        const newOnes = result.parcels.filter((p) => !existingIds.has(p.id))
        return [...prev, ...newOnes]
      })
    } finally {
      setUploading(false)
    }
  }, [])

  const handleParcelClick = useCallback(async (parcel) => {
    setSelectedParcel(parcel)
    setAnalysis(null)
    setAnalysisLoading(true)

    try {
      const { lat, lon } = centroidOf(parcel.geometry)
      const result = await analyzeParcels(parcel.id, lat, lon, parcel.geometry)
      setAnalysis(result)
    } catch (err) {
      console.error('Analysis failed', err)
      setAnalysis({ error: err.message })
    } finally {
      setAnalysisLoading(false)
    }
  }, [])

  const handleSelectFromSidebar = useCallback((parcel) => {
    setSelectedParcel(parcel)
  }, [])

  const handleFlyTo = useCallback((parcel) => {
    flyToRef.current?.(parcel)
  }, [])

  const handleRemoveParcel = useCallback((id) => {
    setParcels((prev) => prev.filter((p) => p.id !== id))
    setSelectedParcel((prev) => (prev?.id === id ? null : prev))
    setAnalysis((prev) => (selectedParcel?.id === id ? null : prev))
  }, [selectedParcel])

  const handleClosePanel = useCallback(() => {
    setSelectedParcel(null)
    setAnalysis(null)
  }, [])

  return (
    <div className="flex flex-col h-screen bg-dark-900 text-slate-200 overflow-hidden">
      <TopBar />
      <div className="flex flex-1 min-h-0 relative">
        <Sidebar
          parcels={parcels}
          selectedParcelId={selectedParcel?.id}
          uploading={uploading}
          onUpload={handleUpload}
          onSelectParcel={handleSelectFromSidebar}
          onRemoveParcel={handleRemoveParcel}
          onFlyTo={handleFlyTo}
        />

        {/* Map container */}
        <div className="relative flex-1 min-w-0">
          <MapView
            parcels={parcels}
            selectedParcelId={selectedParcel?.id}
            onParcelClick={handleParcelClick}
            flyToRef={flyToRef}
          />

          {/* Hint when parcels exist but none selected */}
          {parcels.length > 0 && !selectedParcel && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[500] pointer-events-none">
              <div className="bg-dark-800/90 backdrop-blur border border-dark-500 rounded-full px-4 py-2 text-sm text-slate-300 shadow-lg">
                Click a parcel on the map to run analysis
              </div>
            </div>
          )}

          {/* No parcels hint */}
          {!parcels.length && (
            <div className="absolute inset-0 flex items-center justify-center z-[500] pointer-events-none">
              <div className="text-center bg-dark-800/70 backdrop-blur rounded-2xl px-8 py-6 border border-dark-600">
                <p className="text-slate-300 text-sm font-medium">Upload a KMZ, KML, or GeoJSON file</p>
                <p className="text-slate-500 text-xs mt-1">to display land parcels on the map</p>
              </div>
            </div>
          )}

          <AnalysisPanel
            parcel={selectedParcel}
            analysis={analysis}
            loading={analysisLoading}
            onClose={handleClosePanel}
          />
        </div>
      </div>
    </div>
  )
}
