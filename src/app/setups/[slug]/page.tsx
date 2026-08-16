import { notFound } from "next/navigation";
import { OriginBadge } from "@/components/origin-badge";
import { SetupVisual } from "@/components/setup-card";
import { SiteHeader } from "@/components/site-header";
import { getSetup } from "@/lib/setups";

export default async function SetupPage({ params }: PageProps<"/setups/[slug]">) {
  const { slug } = await params;
  const setup = await getSetup(slug);
  if (!setup) notFound();
  return (
    <>
      <SiteHeader />
      <main className="page-main shell">
        <div className="detail-layout">
          <SetupVisual setup={setup} detailed />
          <article className="detail-copy">
            <p className="eyebrow">{setup.vibe}</p>
            <h1>{setup.title}</h1>
            <p className="byline">Сетап {setup.owner} · {setup.location}</p>
            {setup.categories.length > 0 && <div className="setup-tags" style={{ marginTop: 14 }}>{setup.categories.map((name) => <span className="setup-tag" key={name}>{name}</span>)}</div>}
            <p className="detail-description">{setup.description}</p>
            <div className="component-list">
              <p className="eyebrow" style={{ marginTop: 22 }}>У системі</p>
              {setup.components.map((component) => <div className="component-row" key={component.id}><div><small>{component.category}</small><strong>{component.brand} {component.model}</strong></div><OriginBadge origin={component.origin} /></div>)}
            </div>
            {setup.components.length > 1 && (
              <div className="connection-chain">
                <p className="eyebrow" style={{ marginTop: 22 }}>Схема підключення</p>
                <div className="chain-row">
                  {setup.components.map((component, index) => (
                    <div className="chain-item" key={component.id}>
                      <div className="chain-node"><small>{component.category}</small><strong>{component.brand} {component.model}</strong></div>
                      {index < setup.components.length - 1 && <span className="chain-arrow">→</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        </div>
      </main>
    </>
  );
}
