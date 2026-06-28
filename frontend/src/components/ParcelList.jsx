import { MapPin, Layers, Trash2 } from 'lucide-react'

function formatArea(ha) {
  if (!ha || ha === 0) return '—'
  if (ha < 1) return `${(ha * 10000).toFixed(0)} m²`
  return `${ha.toFixed(2)} ha`
}

export default function ParcelList({ parcels, selectedId, onSelect, onRemove, onFlyTo }) {
  if (!parcels.length) {
    return (
      <div className="px-4 pb-4">
        <div className="rounded-xl border border-dark-500 bg-dark-700/30 p-5 text-center">
          <Layers size={28} className="text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-500">No parcels loaded yet.</p>
          <p className="text-xs text-slate-600 mt-1">Upload a file above to get started.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 pb-4 space-y-2">
      <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold px-1 mb-3">
        Parcels <span className="text-brand-400 ml-1">{parcels.length}</span>
      </p>
      {parcels.map((parcel) => {
        const isSelected = parcel.id === selectedId
        return (
          <div
            key={parcel.id}
            onClick={() => {
              onSelect(parcel)
              onFlyTo(parcel)
            }}
            className={`
              group relative rounded-xl px-3 py-3 cursor-pointer transition-all duration-150 border
              ${isSelected
                ? 'bg-brand-600/15 border-brand-500/50 shadow-sm shadow-brand-600/20'
                : 'bg-dark-700/40 border-dark-500 hover:border-dark-400 hover:bg-dark-700'}
            `}
          >
            <div className="flex items-start gap-2.5">
              <div className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${isSelected ? 'bg-brand-600' : 'bg-dark-600'}`}>
                <MapPin size={12} className={isSelected ? 'text-white' : 'text-slate-400'} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                  {parcel.name}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">{formatArea(parcel.area_ha)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onRemove(parcel.id) }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400"
              >
                <Trash2 size={13} />
              </button>
            </div>
            {isSelected && (
              <div className="mt-2 ml-8">
                <span className="text-xs text-brand-400 font-medium">Click on map for analysis →</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
