import React, { useState } from 'react';
import { 
  Layers, 
  Table, 
  Key, 
  Link2, 
  ChevronRight, 
  ChevronDown, 
  Eye, 
  X, 
  Search,
  Database,
  Copy,
  Check
} from 'lucide-react';

export default function SchemaExplorer({ 
  schemaInfo, 
  isOpen, 
  onClose,
  onInsertText 
}) {
  const [expandedTable, setExpandedTable] = useState(null);
  const [previewTable, setPreviewTable] = useState(null);
  const [filterText, setFilterText] = useState('');
  const [copiedName, setCopiedName] = useState(null);

  if (!isOpen) return null;

  const tables = schemaInfo?.tables || {};
  const tableNames = Object.keys(tables);

  const filteredTableNames = tableNames.filter(tbl => {
    if (!filterText.trim()) return true;
    const term = filterText.toLowerCase();
    if (tbl.toLowerCase().includes(term)) return true;
    const cols = tables[tbl]?.columns || [];
    return cols.some(c => c.name.toLowerCase().includes(term));
  });

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedName(text);
    setTimeout(() => setCopiedName(null), 1500);
  };

  return (
    <aside className="w-80 border-r border-slate-800 bg-slate-900/95 flex flex-col h-full shadow-2xl z-20 overflow-hidden flex-shrink-0 animate-in slide-in-from-left duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          <h3 className="text-sm font-bold text-slate-100">Schema Explorer</h3>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-mono">
            {tableNames.length} Tables
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
          title="Close Schema Explorer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search Filter */}
      <div className="p-3 border-b border-slate-800/80">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search tables or columns..."
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Tables List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredTableNames.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500">
            No tables or columns match "{filterText}"
          </div>
        ) : (
          filteredTableNames.map(tblName => {
            const tblData = tables[tblName];
            const isExpanded = expandedTable === tblName;
            const columns = tblData?.columns || [];
            const fks = tblData?.foreign_keys || [];
            const rowCount = tblData?.row_count ?? 0;

            return (
              <div 
                key={tblName}
                className="border border-slate-800/80 rounded-xl overflow-hidden bg-slate-950/50 transition-all"
              >
                {/* Table Header Row */}
                <div 
                  className="p-2.5 flex items-center justify-between hover:bg-slate-800/40 cursor-pointer"
                  onClick={() => setExpandedTable(isExpanded ? null : tblName)}
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                    <Table className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-xs font-semibold text-slate-200 font-mono">
                      {tblName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                    <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-full font-mono">
                      {rowCount} rows
                    </span>
                    <button
                      type="button"
                      onClick={() => setPreviewTable(previewTable === tblName ? null : tblName)}
                      className="p-1 text-slate-400 hover:text-indigo-300 rounded hover:bg-slate-800 transition"
                      title="Preview sample rows"
                    >
                      <Eye className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Expanded Columns List */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1 border-t border-slate-800/60 bg-slate-950/80 text-[11px] space-y-1.5">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider pt-1">
                      Columns ({columns.length})
                    </div>
                    {columns.map(col => {
                      const fk = fks.find(f => f.from === col.name);
                      return (
                        <div 
                          key={col.name}
                          className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-800/60 transition group font-mono"
                        >
                          <div className="flex items-center gap-1.5">
                            {col.pk ? (
                              <Key className="w-3 h-3 text-amber-400" title="Primary Key" />
                            ) : fk ? (
                              <Link2 className="w-3 h-3 text-cyan-400" title={`Foreign Key -> ${fk.table}(${fk.to})`} />
                            ) : (
                              <span className="w-3 h-3 inline-block" />
                            )}
                            <span className="text-slate-300 font-medium">{col.name}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-500 uppercase">{col.type}</span>
                            <button
                              onClick={() => handleCopy(col.name)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-slate-400 hover:text-slate-200 transition"
                              title="Copy column name"
                            >
                              {copiedName === col.name ? (
                                <Check className="w-3 h-3 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Relationships note */}
                    {fks.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-400 space-y-1">
                        <span className="font-semibold text-slate-300">Foreign Keys:</span>
                        {fks.map((fk, idx) => (
                          <div key={idx} className="flex items-center gap-1 text-cyan-400 font-mono">
                            <span>{fk.from}</span>
                            <span>→</span>
                            <span>{fk.table}({fk.to})</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Sample Preview Drawer / Modal */}
      {previewTable && tables[previewTable] && (
        <div className="p-3 border-t border-slate-800 bg-slate-950 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-indigo-300 font-mono">
              {previewTable} Sample Preview (First 3 Rows)
            </span>
            <button
              onClick={() => setPreviewTable(null)}
              className="p-1 text-slate-400 hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="overflow-x-auto max-h-40 border border-slate-800 rounded-lg">
            <table className="w-full text-[10px] text-left">
              <thead className="bg-slate-900 text-slate-400 uppercase font-mono sticky top-0">
                <tr>
                  {tables[previewTable].columns.map(c => (
                    <th key={c.name} className="py-1 px-2 whitespace-nowrap">{c.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {tables[previewTable].sample_rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/50">
                    {tables[previewTable].columns.map(c => (
                      <td key={c.name} className="py-1 px-2 whitespace-nowrap text-slate-300 truncate max-w-[120px]">
                        {row[c.name] === null ? 'NULL' : String(row[c.name])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </aside>
  );
}
