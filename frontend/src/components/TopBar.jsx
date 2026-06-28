import { Mountain } from 'lucide-react'

export default function TopBar() {
  return (
    <header className="h-14 bg-dark-800 border-b border-dark-600 flex items-center px-5 gap-3 shrink-0 z-10 shadow-md">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow">
          <Mountain size={18} className="text-white" />
        </div>
        <div>
          <span className="text-white font-bold tracking-wide text-base">Armenia</span>
          <span className="text-brand-400 font-bold tracking-wide text-base ml-1.5">Land Portal</span>
        </div>
      </div>
      <div className="h-5 w-px bg-dark-500 mx-2" />
      <span className="text-slate-400 text-sm">Interactive GIS Platform for Land Sales</span>
      <div className="ml-auto flex items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 px-2.5 py-1 rounded-full border border-emerald-400/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live Data
        </span>
      </div>
    </header>
  )
}
