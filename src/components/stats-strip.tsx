import type { SiteStats } from "@/lib/setups";
import type { Dictionary } from "@/lib/i18n/dictionaries";

const format = (value: number) => value >= 1000 ? `${(value / 1000).toFixed(1).replace(".0", "")}K+` : `${value}`;

export function StatsStrip({ stats, t }: { stats: SiteStats; t: Dictionary }) {
  const items = [
    { icon: "🎧", value: format(stats.setups), label: t.stats.setups },
    { icon: "👥", value: format(stats.users), label: t.stats.users },
    { icon: "🎛", value: format(stats.components), label: t.stats.components },
    { icon: "✨", value: stats.addedThisWeek > 0 ? `+${stats.addedThisWeek}` : t.stats.dailyValue, label: stats.addedThisWeek > 0 ? t.stats.thisWeek : t.stats.daily },
  ];
  return (
    <section className="stats-strip">
      {items.map((item) => (
        <div className="stat-item" key={item.label}>
          <span className="stat-icon" aria-hidden="true">{item.icon}</span>
          <div>
            <strong>{item.value}</strong>
            <small>{item.label}</small>
          </div>
        </div>
      ))}
    </section>
  );
}
