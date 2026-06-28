import { X, MapPin, BarChart2, Tag } from 'lucide-react'
import DistanceMetrics from './DistanceMetrics.jsx'
import TimeSeriesChart from './TimeSeriesChart.jsx'

function formatArea(ha) {
  if (!ha || ha === 0) return '—'
  if (ha < 1) return `${(ha * 10000).toFixed(0)} m²`
  return `${ha.toFixed(2)} ha`
}

export default function AnalysisPanel({ parcel, analysis, loading, onClose }) {
  const open = !!parcel

  return (
    <div
      className={`analysis-panel absolute right-0 top-0 h-full w-96 bg-dark-800 border-l border-dark-600 flex flex-col z-[1000] shadow-2xl shadow-black/40
        ${open ? 'translate-x-0' : 'translate-x-full'}`}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-dark-600 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <MapPin size={14} className="text-brand-400 shrink-0" />
              <p className="text-xs text-brand-400 font-semibold uppercase tracking-wider">Land Parcel</p>
            </div>
            <h2 className="text-lg font-bold text-white truncate">{parcel?.name ?? '…'}</h2>
            <p className="text-sm text-slate-400 mt-0.5">{formatArea(parcel?.area_ha)}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-dark-600 text-slate-400 hover:text-white transition-colors shrink-0 mt-0.5"
          >
            <X size={16} />
          </button>
        </div>

        {/* List for sale button */}
        <button className="mt-3 w-full bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
          <Tag size={14} />
          List for Sale
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto flex-1 px-5 py-5 space-y-6">
        {/* Distance metrics */}
        <DistanceMetrics
          distances={analysis?.distances}
          loading={loading}
        />

        {/* Time series */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 size={14} className="text-slate-400" />
            <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold">
              3-Year Time Series
            </p>
          </div>
          <div className="space-y-4">
            <TimeSeriesChart
              type="ndvi"
              data={analysis?.timeseries?.ndvi}
              loading={loading}
            />
            <TimeSeriesChart
              type="soil_moisture"
              data={analysis?.timeseries?.soil_moisture}
              loading={loading}
            />
            <TimeSeriesChart
              type="surface_temperature"
              data={analysis?.timeseries?.surface_temperature}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
