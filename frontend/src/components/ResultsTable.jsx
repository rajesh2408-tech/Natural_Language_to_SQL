import React, { useState, useMemo } from 'react';
import { 
  Table as TableIcon, 
  Download, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  FileSpreadsheet,
  FileJson,
  ShieldAlert,
  Search
} from 'lucide-react';
import { exportToCSV, exportToJSON } from '../utils/exportUtils';

export default function ResultsTable({
  result,
  error,
  isExecuting,
  isMutationDeclined
}) {
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchFilter, setSearchFilter] = useState('');

  // Extract result fields safely
  const columns = result?.columns || [];
  const rows = result?.rows || [];
  const totalRows = result?.total_rows ?? rows.length;
  const durationMs = result?.duration_ms ?? 0;
  const isSuccess = result?.success;
  const isEmpty = isSuccess && totalRows === 0;

  // Reset page when rows change
  React.useEffect(() => {
    setCurrentPage(1);
    setSearchFilter('');
  }, [result]);

  // Client-side quick filter
  const filteredRows = useMemo(() => {
    if (!searchFilter.trim()) return rows;
    const term = searchFilter.toLowerCase();
    return rows.filter(row => {
      return Object.values(row).some(val => 
        val !== null && val !== undefined && String(val).toLowerCase().includes(term)
      );
    });
  }, [rows, searchFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage, pageSize]);

  // 1. Loading State
  if (isExecuting) {
    return (
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-12 text-center shadow-lg">
        <div className="inline-block p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-3 animate-pulse">
          <Clock className="w-8 h-8 animate-spin" />
        </div>
        <h4 className="text-sm font-semibold text-slate-200">Executing Query...</h4>
        <p className="text-xs text-slate-400 mt-1">Fetching live records from local database</p>
      </div>
    );
  }

  // 2. Mutation Blocked Alert State
  if (isMutationDeclined || (error && (error.toLowerCase().includes('mutation') || error.toLowerCase().includes('prohibited')))) {
    return (
      <div className="bg-rose-950/30 border border-rose-500/30 rounded-2xl p-6 shadow-xl text-left">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 flex-shrink-0">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-rose-300">Action Declined: Data Mutation Prohibited</h4>
            <p className="text-xs text-rose-200/80 mt-1.5 leading-relaxed">
              {error || result?.error || "Only read-only queries (SELECT) are permitted. Operations attempting to INSERT, UPDATE, DELETE, or DROP data are strictly rejected to ensure database integrity."}
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-[11px] font-mono text-rose-300">
              <span>Security Rule: Enforced at both Natural Language intent layer and SQL AST parser.</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Execution Error State
  if (error || (result && !result.success && result.error)) {
    const displayError = error || result.error;
    return (
      <div className="bg-amber-950/30 border border-amber-500/30 rounded-2xl p-6 shadow-xl text-left">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 flex-shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-amber-300">Query Could Not Be Executed</h4>
            <p className="text-xs text-amber-200/90 mt-1.5 leading-relaxed">
              {displayError}
            </p>
            <p className="text-[11px] text-slate-400 mt-2">
              Tip: Check the Schema Explorer sidebar to inspect valid table names, column spellings, and relationships.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 4. Empty Result Set State
  if (isEmpty) {
    return (
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-10 text-center shadow-lg">
        <div className="inline-block p-3 rounded-2xl bg-slate-800 text-slate-400 mb-3">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <h4 className="text-sm font-semibold text-slate-200">Query Executed Successfully</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
          The query ran without errors, but returned <strong>0 rows</strong> matching your search criteria.
        </p>
        <div className="mt-3 inline-flex items-center gap-2 text-xs text-slate-500">
          <Clock className="w-3.5 h-3.5" />
          <span>Execution Time: {durationMs} ms</span>
        </div>
      </div>
    );
  }

  // If no result yet
  if (!result || columns.length === 0) {
    return null;
  }

  // 5. Structured Results Table
  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl transition-all">
      {/* Table Toolbar Header */}
      <div className="px-5 py-3.5 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Metrics & Row Count */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
            <TableIcon className="w-4 h-4 text-indigo-400" />
            <span>Query Results</span>
          </div>

          <span className="text-slate-600">|</span>

          {/* Row count badge */}
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
            {filteredRows.length === totalRows
              ? `Showing ${totalRows} results`
              : `Showing ${filteredRows.length} of ${totalRows} results`}
          </span>

          {/* Execution Time */}
          <span className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-400 font-mono">
            <Clock className="w-3.5 h-3.5 text-emerald-400" />
            <span>{durationMs} ms</span>
          </span>
        </div>

        {/* Right: Quick filter, Page size & Export buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Quick search input */}
          {rows.length > 5 && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Filter results..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-8 pr-3 py-1 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 w-36"
              />
            </div>
          )}

          {/* Export to CSV (Bonus Feature) */}
          <button
            type="button"
            onClick={() => exportToCSV(columns, rows, 'query_results.csv')}
            className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700/60 transition cursor-pointer shadow-sm"
            title="Export query results as CSV (Bonus Feature)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          {/* Export to JSON */}
          <button
            type="button"
            onClick={() => exportToJSON(rows, 'query_results.json')}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700/60 transition cursor-pointer"
            title="Export query results as JSON"
          >
            <FileJson className="w-3.5 h-3.5 text-blue-400" />
            <span>JSON</span>
          </button>

          {/* Page size dropdown */}
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2.5 py-1 text-xs bg-slate-900 border border-slate-800 text-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
          >
            <option value={10}>10 rows</option>
            <option value={25}>25 rows</option>
            <option value={50}>50 rows</option>
            <option value={100}>100 rows</option>
          </select>
        </div>
      </div>

      {/* Table Area with scrollable container */}
      <div className="overflow-x-auto max-h-[520px] select-text">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="bg-slate-950/90 text-slate-400 uppercase tracking-wider sticky top-0 z-10 border-b border-slate-800 font-semibold">
            <tr>
              <th className="py-2.5 px-3 w-10 text-center text-slate-500 font-mono">#</th>
              {columns.map((colName) => (
                <th key={colName} className="py-2.5 px-4 font-mono text-slate-300 whitespace-nowrap">
                  {colName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-sans">
            {paginatedRows.map((row, rowIdx) => {
              const globalIndex = (currentPage - 1) * pageSize + rowIdx + 1;
              return (
                <tr 
                  key={rowIdx} 
                  className="hover:bg-slate-800/50 transition-colors odd:bg-slate-900/30 even:bg-slate-950/20"
                >
                  <td className="py-2.5 px-3 text-center text-slate-500 font-mono text-[11px]">
                    {globalIndex}
                  </td>
                  {columns.map((col) => {
                    const cellVal = row[col];
                    const isNull = cellVal === null || cellVal === undefined;
                    return (
                      <td key={col} className="py-2.5 px-4 text-slate-200 whitespace-nowrap max-w-xs truncate">
                        {isNull ? (
                          <span className="text-slate-500 italic font-mono">NULL</span>
                        ) : typeof cellVal === 'number' ? (
                          <span className="font-mono text-indigo-300">{cellVal}</span>
                        ) : (
                          String(cellVal)
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls Footer */}
      <div className="px-5 py-3 bg-slate-950/70 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
        <div>
          Showing <span className="font-semibold text-slate-200">{(currentPage - 1) * pageSize + 1}</span> to{' '}
          <span className="font-semibold text-slate-200">
            {Math.min(currentPage * pageSize, filteredRows.length)}
          </span>{' '}
          of <span className="font-semibold text-slate-200">{filteredRows.length}</span> rows
        </div>

        {/* Page navigation */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            disabled={currentPage === 1}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="First page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Previous page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="px-3 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 font-mono text-[11px]">
            Page {currentPage} of {totalPages}
          </span>

          <button
            type="button"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Next page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentPage(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Last page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
