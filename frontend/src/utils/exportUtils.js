/**
 * Utilities for exporting query results as CSV or JSON files.
 */

export function exportToCSV(columns, rows, filename = 'query_results.csv') {
  if (!rows || rows.length === 0 || !columns || columns.length === 0) {
    alert('No data to export.');
    return;
  }

  // Format header
  const header = columns.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',');

  // Format rows
  const csvRows = rows.map(row => {
    return columns.map(col => {
      const val = row[col];
      if (val === null || val === undefined) {
        return '""';
      }
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',');
  });

  const csvContent = [header, ...csvRows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportToJSON(rows, filename = 'query_results.json') {
  if (!rows || rows.length === 0) {
    alert('No data to export.');
    return;
  }

  const jsonContent = JSON.stringify(rows, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
