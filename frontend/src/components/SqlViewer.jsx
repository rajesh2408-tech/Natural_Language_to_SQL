import React, { useState } from 'react';
import { 
  Code, 
  Copy, 
  Check, 
  Edit3, 
  Play, 
  RotateCcw, 
  Sparkles, 
  Info,
  CheckCircle2 
} from 'lucide-react';

export default function SqlViewer({
  sql,
  explanation,
  assumptions,
  modelUsed,
  onExecuteSql,
  isExecuting,
  originalGeneratedSql
}) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editableSql, setEditableSql] = useState(sql || '');

  // Keep editableSql in sync when sql prop changes from parent
  React.useEffect(() => {
    setEditableSql(sql || '');
  }, [sql]);

  if (!sql) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(isEditing ? editableSql : sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunEdited = () => {
    if (!editableSql.trim()) return;
    onExecuteSql(editableSql.trim());
  };

  const handleReset = () => {
    if (originalGeneratedSql) {
      setEditableSql(originalGeneratedSql);
      setIsEditing(false);
      onExecuteSql(originalGeneratedSql);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl transition-all">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-2.5 bg-slate-950/70 border-b border-slate-800/80 gap-2">
        <div className="flex items-center gap-2">
          <Code className="w-4 h-4 text-indigo-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Generated SQL
          </span>
          {modelUsed && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700/60 font-mono">
              <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
              <span>{modelUsed}</span>
            </span>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1.5">
          {/* Edit SQL Toggle (Bonus Feature) */}
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
              isEditing
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
            }`}
            title="Edit generated SQL before running (Bonus Feature)"
          >
            <Edit3 className="w-3.5 h-3.5 text-amber-400" />
            <span>{isEditing ? 'Editing Mode' : 'Edit Query'}</span>
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition cursor-pointer"
            title="Copy SQL to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-400" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Area */}
      <div className="p-4 bg-slate-950/90 font-mono text-sm leading-relaxed">
        {isEditing ? (
          <div>
            <textarea
              value={editableSql}
              onChange={(e) => setEditableSql(e.target.value)}
              rows={Math.max(3, editableSql.split('\n').length + 1)}
              className="w-full p-3 font-mono text-sm bg-slate-900 border border-amber-500/40 rounded-xl text-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500/50 resize-y shadow-inner"
              placeholder="Edit your SQL query here..."
            />
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80">
              <span className="text-xs text-amber-400/90 flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                <span>You can edit this query manually and run your modified version.</span>
              </span>
              <div className="flex items-center gap-2">
                {originalGeneratedSql && originalGeneratedSql !== editableSql && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleRunEdited}
                  disabled={isExecuting || !editableSql.trim()}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
                >
                  {isExecuting ? (
                    <div className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Play className="w-3 h-3 fill-current" />
                  )}
                  <span>Execute Edited SQL</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <pre className="text-indigo-200 overflow-x-auto whitespace-pre-wrap select-text">
            <code>{sql}</code>
          </pre>
        )}
      </div>

      {/* Explanation & Interpretation Footer */}
      {(explanation || assumptions) && (
        <div className="px-4 py-2.5 bg-slate-900/90 border-t border-slate-800/80 text-xs text-slate-400 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-indigo-400 mt-0.5 flex-shrink-0" />
            <div>
              <span className="font-medium text-slate-300">Interpretation: </span>
              <span>{explanation}</span>
              {assumptions && assumptions !== 'Standard direct mapping.' && (
                <span className="text-slate-400 italic"> ({assumptions})</span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
