/** Byte sizes for the admin stats page. Kept locale-neutral on purpose — the
 *  unit suffixes read the same in both languages the site ships. */
export function formatBytes(bytes: number): string {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let size = value / 1024;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) { size /= 1024; unit += 1; }
  return `${size < 10 ? size.toFixed(1) : Math.round(size)} ${units[unit]}`;
}

/** Share of a quota, clamped so a bar never renders past its track. */
export const percentOf = (used: number, limit: number) =>
  Math.min(100, Math.max(0, Math.round((Number(used) / limit) * 100)));
