import React, { useState } from 'react';
import { 
  History as HistoryIcon, 
  Clock, 
  Trash2, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ChevronRight,
  Code,
  Search
} from 'lucide-react';

export default function QueryHistory({
  history,
  isOpen,
  onClose,
  onSelectHistoryItem,
  onClearHistory,
  activeHistoryId
}) {
  const [filterText, setFilterText] = useState('');

  if (!isOpen) return null;

  const filteredHistory = history.filter(item => {
    if (!filterText.trim()) return true;
    const term = filterText.toLowerCase();
    return (
      (item.prompt && item.prompt.toLowerCase().includes(term)) ||
      (item.sql && item.sql.toLowerCase().includes(term))
    );
  });

  return (
    <aside className="w-88 border-l border-slate-800 bg-slate-900/95 flex flex-col h-full shadow-2xl z-20 overflow-hidden flex-shrink-0 animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
        <div className="flex items-center gap-2">
          <HistoryIcon className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-100">Session History</h3>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
            {history.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
              title="Clear all session history"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="Close history panel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Filter */}
      {history.length > 3 && (
        <div className="p-3 border-b border-slate-800/80">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search previous queries..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}

      {/* History List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {history.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            <HistoryIcon className="w-8 h-8 text-slate-600 mx-auto mb-2 opacity-50" />
            <p>No queries executed yet.</p>
            <p className="text-[11px] text-slate-600 mt-1">Queries you execute will appear here and can be restored with a single click.</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500">
            No queries match "{filterText}"
          </div>
        ) : (
          filteredHistory.map((item) => {
            const isActive = activeHistoryId === item.id;
            const isSuccess = item.result?.success;

            return (
              <div
                key={item.id}
                onClick={() => onSelectHistoryItem(item)}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                  isActive
                    ? 'bg-indigo-950/40 border-indigo-500/60 shadow-md shadow-indigo-500/10'
                    : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                }`}
              >
                {/* Top line: status, time, row count */}
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <div className="flex items-center gap-1.5 font-medium">
                    {isSuccess ? (
                      <span className="flex items-center gap-1 text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{item.result?.total_rows ?? 0} rows</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-rose-400">
                        <AlertCircle className="w-3 h-3" />
                        <span>Failed</span>
                      </span>
                    )}
                    {item.result?.duration_ms && (
                      <span className="text-slate-500 font-mono">
                        • {item.result.duration_ms}ms
                      </span>
                    )}
                  </div>
                  <span className="text-slate-500 text-[10px]">
                    {item.timestamp}
                  </span>
                </div>

                {/* Natural Language Prompt */}
                <h4 className="text-xs font-semibold text-slate-200 line-clamp-2">
                  {item.prompt}
                </h4>

                {/* SQL snippet */}
                {item.sql && (
                  <div className="mt-2 p-1.5 rounded-lg bg-slate-900 border border-slate-800/80 font-mono text-[10px] text-indigo-300 truncate">
                    <code>{item.sql}</code>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
