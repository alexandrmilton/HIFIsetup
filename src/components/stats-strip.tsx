import type { SiteStats } from "@/lib/setups";

const format = (value: number) => value >= 1000 ? `${(value / 1000).toFixed(1).replace(".0", "")}K+` : `${value}`;

export function StatsStrip({ stats }: { stats: SiteStats }) {
  const items = [
    { icon: "🎧", value: format(stats.setups), label: "сетапів" },
    { icon: "👥", value: format(stats.users), label: "користувачів" },
    { icon: "🎛", value: format(stats.components), label: "компонентів" },
    { icon: "✨", value: stats.addedThisWeek > 0 ? `+${stats.addedThisWeek}` : "Щодня", label: stats.addedThisWeek > 0 ? "за тиждень" : "нові оновлення" },
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
