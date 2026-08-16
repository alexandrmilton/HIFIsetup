import type { ComponentOrigin } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n/dictionaries";

export function OriginBadge({ origin, t }: { origin: ComponentOrigin; t: Dictionary }) {
  return <span className={`origin-badge origin-${origin}`}>{t.origin[origin]}</span>;
}
