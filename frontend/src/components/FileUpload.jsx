import { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react'

export default function FileUpload({ onUpload, loading }) {
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const onDrop = useCallback(
    async (accepted) => {
      if (!accepted.length) return
      setError(null)
      setSuccess(false)
      try {
        await onUpload(accepted[0])
        setSuccess(true)
        setTimeout(() => setSuccess(false), 3000)
      } catch (err) {
        setError(err.response?.data?.detail || err.message || 'Upload failed')
      }
    },
    [onUpload]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.google-earth.kmz': ['.kmz'],
      'application/vnd.google-earth.kml+xml': ['.kml'],
      'application/geo+json': ['.geojson'],
      'application/json': ['.json'],
    },
    multiple: false,
    disabled: loading,
  })

  return (
    <div className="p-4">
      <p className="text-xs text-slate-400 uppercase tracking-widest mb-3 font-semibold">
        Upload Parcel File
      </p>
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
          ${isDragActive ? 'border-brand-500 bg-brand-600/10' : 'border-dark-500 hover:border-dark-400 bg-dark-700/40'}
          ${loading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isDragActive ? 'bg-brand-600/20' : 'bg-dark-600'}`}>
            <Upload size={18} className={isDragActive ? 'text-brand-400' : 'text-slate-400'} />
          </div>
          <div>
            {loading ? (
              <p className="text-sm text-slate-300">Processing…</p>
            ) : isDragActive ? (
              <p className="text-sm text-brand-400 font-medium">Drop to upload</p>
            ) : (
              <>
                <p className="text-sm text-slate-300">Drag & drop or <span className="text-brand-400 font-medium">browse</span></p>
                <p className="text-xs text-slate-500 mt-1">KMZ · KML · GeoJSON</p>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-2 flex items-start gap-2 text-xs text-red-400 bg-red-400/10 rounded-lg px-3 py-2">
          <AlertCircle size={13} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="mt-2 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-400/10 rounded-lg px-3 py-2">
          <CheckCircle size={13} />
          <span>Parcels loaded successfully</span>
        </div>
      )}
    </div>
  )
}
