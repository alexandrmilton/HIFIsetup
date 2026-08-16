import Link from "next/link";
import type { Setup } from "@/lib/types";

function SetupCover({ setup }: { setup: Setup }) {
  const labels = <>{<span className="cover-label">{setup.vibe}</span>}{!setup.isPublished && <span className="cover-label cover-private">Приватний</span>}</>;
  if (setup.coverUrl) return <div className="setup-cover" style={{ backgroundImage: `url(${setup.coverUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}>{labels}</div>;
  return <div className="setup-cover" style={{ "--card-bg": setup.palette.background, "--wall": setup.palette.wall } as React.CSSProperties}><div className="cover-wall" /><div className="cover-record" /><div className="cover-speaker left" /><div className="cover-speaker right" /><div className="cover-furniture" />{labels}</div>;
}

export function SetupCard({ setup }: { setup: Setup }) {
  return (
    <Link className="setup-card" href={`/setups/${setup.slug}`}>
      <SetupCover setup={setup} />
      <div className="setup-meta">
        <div className="setup-title-line"><span className="setup-title">{setup.title}</span><span className="setup-location">{setup.location}</span></div>
        <p className="setup-owner">{setup.owner} · {setup.components.length} компоненти</p>
        {setup.categories.length > 0 && <div className="setup-tags">{setup.categories.map((name) => <span className="setup-tag" key={name}>{name}</span>)}</div>}
      </div>
    </Link>
  );
}
