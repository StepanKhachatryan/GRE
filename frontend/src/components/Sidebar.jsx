import FileUpload from './FileUpload.jsx'
import ParcelList from './ParcelList.jsx'

export default function Sidebar({
  parcels,
  selectedParcelId,
  uploading,
  onUpload,
  onSelectParcel,
  onRemoveParcel,
  onFlyTo,
}) {
  return (
    <aside className="w-72 shrink-0 bg-dark-800 border-r border-dark-600 flex flex-col overflow-hidden">
      <div className="overflow-y-auto flex-1">
        <FileUpload onUpload={onUpload} loading={uploading} />
        <div className="h-px bg-dark-600 mx-4 mb-4" />
        <ParcelList
          parcels={parcels}
          selectedId={selectedParcelId}
          onSelect={onSelectParcel}
          onRemove={onRemoveParcel}
          onFlyTo={onFlyTo}
        />
      </div>

      <div className="p-4 border-t border-dark-600 shrink-0">
        <p className="text-xs text-slate-600 text-center">
          Powered by OpenStreetMap · ERA5 · Sentinel-2
        </p>
      </div>
    </aside>
  )
}
