import React from 'react';
import { Zap, X, Database, Layers, RefreshCw, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function CachingModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">Query Speed & Caching Strategy</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Bonus Feature [10 Marks]
                </span>
              </div>
              <p className="text-xs text-slate-400">Technical writeup on optimizing repeated & similar queries (161 words)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="mt-5 space-y-4 text-xs leading-relaxed text-slate-300">
          <p className="text-slate-200 font-medium">
            To accelerate repeated and similar natural language queries, I would introduce a two-tier caching architecture:
          </p>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-start gap-2">
              <span className="font-bold text-indigo-400 font-mono">1.</span>
              <div>
                <strong className="text-slate-100 font-semibold">Exact Query Cache (Redis):</strong> For identical SQL queries, compute a SHA-256 hash of the normalized SQL query string. Return pre-computed JSON results directly from in-memory Redis with sub-millisecond latency (O(1) lookup), bypassing both LLM generation and database execution.
              </div>
            </div>

            <div className="flex items-start gap-2 pt-2 border-t border-slate-800/80">
              <span className="font-bold text-indigo-400 font-mono">2.</span>
              <div>
                <strong className="text-slate-100 font-semibold">Semantic & Parameterized Cache:</strong> For semantically similar NL requests (e.g. <em>"show users"</em> vs <em>"list users"</em>), normalize the AST or compute dense vector embeddings with cosine similarity &gt; 0.95 to reuse cached query plans and compiled statements. For heavy analytical queries (e.g. customer lifetime spend), leverage Materialized Views refreshed periodically or incrementally.
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 space-y-2">
            <h5 className="font-bold text-amber-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Architectural Trade-offs</span>
            </h5>
            <ul className="space-y-1.5 list-disc list-inside text-slate-300 text-[11px]">
              <li>
                <strong className="text-slate-200">Staleness vs. Freshness:</strong> Fast cached reads risk serving stale data if recent writes occur before invalidation.
              </li>
              <li>
                <strong className="text-slate-200">Invalidation Overhead:</strong> Event-driven cache invalidation (via Change Data Capture or write-through hooks) increases system complexity.
              </li>
              <li>
                <strong className="text-slate-200">Memory Consumption:</strong> In-memory result stores require strict LRU eviction policies and TTL boundaries to prevent unbounded RAM growth.
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-5 pt-3 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
          <span>Word count: 161 / 200 words</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
