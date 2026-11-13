import React, { useState } from 'react';
import { Search, Sparkles, CornerDownLeft, Play, AlertCircle, X, HelpCircle } from 'lucide-react';

const SAMPLE_QUERIES = [
  { label: 'List all users', query: 'List all users' },
  { label: 'Orders in last 30 days', query: 'Show me all orders placed in the last 30 days' },
  { label: 'Out of stock products', query: 'How many products are out of stock?' },
  { label: 'Top 5 customers by spend', query: 'Find the top 5 customers by total spend' },
  { label: 'Engineers hired after 2022', query: 'Show all employees in the Engineering department hired after 2022' },
  { label: 'Top 3 best-selling products', query: 'Show the top 3 best-selling products by total quantity sold' },
];

export default function QueryInput({
  prompt,
  setPrompt,
  onSubmit,
  onGenerateOnly,
  isLoading,
  error,
  setError
}) {
  const [localValidationMsg, setLocalValidationMsg] = useState('');

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!prompt || !prompt.trim()) {
      setLocalValidationMsg('Please describe what data you want to retrieve before submitting.');
      return;
    }
    if (prompt.trim().length < 3) {
      setLocalValidationMsg('Query is too short. Please provide at least 3 characters describing the data.');
      return;
    }
    setLocalValidationMsg('');
    setError(null);
    onSubmit(prompt.trim());
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const selectSample = (sampleText) => {
    setPrompt(sampleText);
    setLocalValidationMsg('');
    setError(null);
    onSubmit(sampleText);
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-xl backdrop-blur-sm transition-all hover:border-slate-700/80">
      {/* Label and Helper */}
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-indigo-400" />
          <span>Ask in Plain English</span>
        </label>
        <span className="text-xs text-slate-400">
          Press <kbd className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-800 border border-slate-700 rounded text-slate-300">Enter ↵</kbd> to execute
        </span>
      </div>

      {/* Input box */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative flex items-center">
          <input
            type="text"
            value={prompt}
            onChange={(e) => {
              setPrompt(e.target.value);
              if (localValidationMsg) setLocalValidationMsg('');
            }}
            onKeyDown={handleKeyDown}
            placeholder="e.g. Show me all orders placed in the last 30 days..."
            disabled={isLoading}
            className="w-full pl-4 pr-32 py-3.5 bg-slate-950/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm shadow-inner disabled:opacity-50"
          />

          {/* Action buttons inside input */}
          <div className="absolute right-2 flex items-center gap-1.5">
            {prompt && !isLoading && (
              <button
                type="button"
                onClick={() => setPrompt('')}
                className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition"
                title="Clear input"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              disabled={isLoading || !prompt.trim()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Query</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Validation message */}
        {localValidationMsg && (
          <div className="mt-2.5 flex items-center gap-1.5 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{localValidationMsg}</span>
          </div>
        )}
      </form>

      {/* Quick Example Chips */}
      <div className="mt-4 pt-3.5 border-t border-slate-800/80">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">Quick Test Examples:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {SAMPLE_QUERIES.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => selectSample(sample.query)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-lg text-xs bg-slate-800/70 hover:bg-slate-700/80 hover:text-indigo-300 text-slate-300 border border-slate-700/40 transition-all cursor-pointer flex items-center gap-1"
            >
              <span>{sample.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
