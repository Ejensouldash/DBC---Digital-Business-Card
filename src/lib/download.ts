// Browser-only: save generated text (CSV, SVG...) as a file.
export function downloadTextFile(
  content: string,
  filename: string,
  type = "text/csv;charset=utf-8",
) {
  // A BOM makes Excel open UTF-8 CSV correctly.
  const body = type.startsWith("text/csv") ? `﻿${content}` : content;
  const url = URL.createObjectURL(new Blob([body], { type }));
  const anchor = Object.assign(document.createElement("a"), { href: url, download: filename });
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
