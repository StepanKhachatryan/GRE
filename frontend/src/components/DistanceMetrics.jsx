function formatDist(m) {
  if (m == null) return '—'
  if (m < 1000) return `${m} m`
  return `${(m / 1000).toFixed(1)} km`
}

function accessScore(m) {
  if (m == null) return { label: 'Unknown', color: 'text-slate-500' }
  if (m < 500)   return { label: 'Excellent', color: 'text-emerald-400' }
  if (m < 2000)  return { label: 'Good', color: 'text-green-400' }
  if (m < 5000)  return { label: 'Moderate', color: 'text-yellow-400' }
  if (m < 15000) return { label: 'Remote', color: 'text-orange-400' }
  return { label: 'Very remote', color: 'text-red-400' }
}

function MetricCard({ icon: Icon, label, data, loading }) {
  const score = accessScore(data?.distance_m)

  if (loading) {
    return (
      <div className="flex-1 rounded-xl border border-dark-500 bg-dark-700/30 p-3">
        <div className="h-3 w-16 shimmer rounded mb-2" />
        <div className="h-5 w-20 shimmer rounded" />
      </div>
    )
  }

  return (
    <div className="flex-1 rounded-xl border border-dark-500 bg-dark-700/30 p-3">
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon size={13} className="text-slate-500" />
        <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <p className="text-lg font-bold text-white">{formatDist(data?.distance_m)}</p>
      <p className={`text-xs font-medium mt-0.5 ${score.color}`}>{score.label}</p>
      {data?.name && data.name !== 'Not found' && (
        <p className="text-xs text-slate-600 mt-1 truncate">{data.name}</p>
      )}
    </div>
  )
}

const RoadIcon = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-3" />
    <polyline points="11 17 9 10 7 17" />
  </svg>
)

const SchoolIcon = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
)

const HospitalIcon = ({ size, className }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="12" y1="8" x2="12" y2="16" />
    <line x1="8" y1="12" x2="16" y2="12" />
  </svg>
)

export default function DistanceMetrics({ distances, loading }) {
  return (
    <div>
      <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-3">
        Proximity Analysis
      </p>
      <div className="flex gap-2">
        <MetricCard
          icon={RoadIcon}
          label="Road"
          data={distances?.road}
          loading={loading}
        />
        <MetricCard
          icon={SchoolIcon}
          label="School"
          data={distances?.school}
          loading={loading}
        />
        <MetricCard
          icon={HospitalIcon}
          label="Hospital"
          data={distances?.hospital}
          loading={loading}
        />
      </div>
    </div>
  )
}
