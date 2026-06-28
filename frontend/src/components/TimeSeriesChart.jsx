import { useMemo } from 'react'
import Plot from 'react-plotly.js'

const CHART_CONFIGS = {
  ndvi: {
    label: 'NDVI',
    unit: '',
    color: '#22c55e',
    fill: 'rgba(34,197,94,0.12)',
    min: 0,
    max: 1,
    description: 'Vegetation Index (Sentinel-2)',
  },
  soil_moisture: {
    label: 'Soil Moisture',
    unit: ' m³/m³',
    color: '#3b82f6',
    fill: 'rgba(59,130,246,0.12)',
    description: 'Volumetric water content 0–7 cm (ERA5)',
  },
  surface_temperature: {
    label: 'Surface Temp',
    unit: ' °C',
    color: '#f97316',
    fill: 'rgba(249,115,22,0.12)',
    description: 'Soil temperature at 0 cm (ERA5)',
  },
}

function resample(series, maxPoints = 200) {
  if (!series || series.length <= maxPoints) return series
  const step = Math.ceil(series.length / maxPoints)
  return series.filter((_, i) => i % step === 0)
}

export default function TimeSeriesChart({ type, data, loading }) {
  const config = CHART_CONFIGS[type]

  const sampled = useMemo(() => resample(data), [data])

  const dates = sampled?.map((d) => d.date) ?? []
  const values = sampled?.map((d) => d.value) ?? []

  if (loading) {
    return (
      <div className="rounded-xl border border-dark-500 bg-dark-700/30 p-4">
        <div className="h-4 w-32 shimmer rounded mb-3" />
        <div className="h-40 shimmer rounded" />
      </div>
    )
  }

  if (!data || !data.length) {
    return (
      <div className="rounded-xl border border-dark-500 bg-dark-700/30 p-4 text-center text-xs text-slate-500 py-8">
        No data available
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-dark-500 bg-dark-700/30 overflow-hidden">
      <div className="px-4 pt-3 pb-1">
        <p className="text-sm font-semibold text-white">{config.label}</p>
        <p className="text-xs text-slate-500">{config.description}</p>
      </div>
      <Plot
        data={[
          {
            x: dates,
            y: values,
            type: 'scatter',
            mode: 'lines',
            line: { color: config.color, width: 1.5, shape: 'spline', smoothing: 0.8 },
            fill: 'tozeroy',
            fillcolor: config.fill,
            hovertemplate: `%{x}<br><b>%{y:.3f}${config.unit}</b><extra></extra>`,
          },
        ]}
        layout={{
          paper_bgcolor: 'transparent',
          plot_bgcolor: 'transparent',
          margin: { t: 8, r: 12, b: 36, l: 44 },
          height: 160,
          xaxis: {
            color: '#475569',
            gridcolor: '#1c2030',
            showgrid: true,
            tickfont: { size: 9, color: '#475569' },
            type: 'date',
          },
          yaxis: {
            color: '#475569',
            gridcolor: '#252a3d',
            showgrid: true,
            tickfont: { size: 9, color: '#475569' },
            rangemode: 'tozero',
            ...(config.min !== undefined ? { range: [config.min, config.max] } : {}),
          },
          hovermode: 'x unified',
          hoverlabel: {
            bgcolor: '#141720',
            bordercolor: '#2f3550',
            font: { color: '#e2e8f0', size: 12 },
          },
          showlegend: false,
        }}
        config={{ displayModeBar: false, responsive: true }}
        style={{ width: '100%' }}
        useResizeHandler
      />
    </div>
  )
}
