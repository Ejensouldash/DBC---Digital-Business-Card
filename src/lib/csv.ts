type Cell = string | number | boolean | Date | null | undefined;

function escapeCell(value: Cell): string {
  if (value === null || value === undefined) return "";
  let text = value instanceof Date ? value.toISOString() : String(value);
  // Neutralise spreadsheet formulas (CSV injection) from user-supplied text.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

// RFC 4180 CSV with CRLF line endings, as Excel and Google Sheets expect.
export function toCsv(header: string[], rows: Cell[][]): string {
  return [header, ...rows].map((row) => row.map(escapeCell).join(",")).join("\r\n") + "\r\n";
}
