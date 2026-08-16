import type { ComponentOrigin } from "@/lib/types";

const labels: Record<ComponentOrigin, string> = { standard: "Standard", handmade: "Handmade", custom_order: "Custom order" };

export function OriginBadge({ origin }: { origin: ComponentOrigin }) { return <span className={`origin-badge origin-${origin}`}>{labels[origin]}</span>; }
