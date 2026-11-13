import React from 'react';
import { 
  Database, 
  Sparkles, 
  History, 
  Layers, 
  Zap, 
  RotateCcw,
  CheckCircle2,
  HardDrive
} from 'lucide-react';

export default function Navbar({ 
  onToggleSchema, 
  showSchema, 
  onToggleHistory, 
  showHistory, 
  onOpenCachingModal,
  onReseed,
  isReseeding,
  historyCount,
  schemaInfo 
}) {
  const tableCount = schemaInfo?.tables ? Object.keys(schemaInfo.tables).length : 5;
  const totalRows = schemaInfo?.tables 
    ? Object.values(schemaInfo.tables).reduce((acc, t) => acc + (t.row_count || 0), 0)
    : 499;

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg tracking-tight text-white">NL2SQL</span>
              <span className="px-1.5 py-0.5 rounded text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Studio
              </span>
            </div>
            <p className="text-xs text-slate-400">Natural Language to SQL Engine</p>
          </div>
        </div>

        {/* Database Status Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300">
          <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-medium text-slate-200">SQLite Local DB</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">{tableCount} Tables ({totalRows} Rows)</span>
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Schema Explorer Toggle */}
          <button
            onClick={onToggleSchema}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showSchema
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700/80 text-slate-300 border border-slate-700/50'
            }`}
            title="Toggle Database Schema Explorer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Schema</span>
          </button>

          {/* History Toggle */}
          <button
            onClick={onToggleHistory}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              showHistory
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-800 hover:bg-slate-700/80 text-slate-300 border border-slate-700/50'
            }`}
            title="View Query Execution History"
          >
            <History className="w-3.5 h-3.5" />
            <span>History</span>
            {historyCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-400/30 text-indigo-200 font-bold">
                {historyCount}
              </span>
            )}
          </button>

          {/* Speed & Caching Modal Toggle */}
          <button
            onClick={onOpenCachingModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 transition-all"
            title="Speed & Caching Architecture Strategy (Bonus Feature)"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Caching Strategy</span>
            <span className="px-1 py-0.2 text-[9px] font-bold rounded bg-amber-500/30 text-amber-200 uppercase tracking-wider">
              Bonus
            </span>
          </button>

          {/* Reseed DB */}
          <button
            onClick={onReseed}
            disabled={isReseeding}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700/80 text-slate-300 border border-slate-700/50 transition-all disabled:opacity-50"
            title="Reseed sample database with 50+ rows per table"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isReseeding ? 'animate-spin text-indigo-400' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">{isReseeding ? 'Reseeding...' : 'Reseed DB'}</span>
          </button>
        </div>
      </div>
    </header>
  );
}
