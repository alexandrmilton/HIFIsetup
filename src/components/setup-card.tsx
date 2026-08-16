import Link from "next/link";
import type { Setup } from "@/lib/types";

export function SetupVisual({ setup, detailed = false }: { setup: Setup; detailed?: boolean }) {
  return <div className={`setup-cover ${detailed ? "detail-cover" : ""}`} style={{ "--card-bg": setup.palette.background, "--wall": setup.palette.wall } as React.CSSProperties}><div className="cover-wall" /><div className="cover-record" /><div className="cover-speaker left" /><div className="cover-speaker right" /><div className="cover-furniture" />{!detailed && <span className="cover-label">{setup.vibe}</span>}</div>;
}

export function SetupCard({ setup }: { setup: Setup }) { return <Link className="setup-card" href={`/setups/${setup.slug}`}><SetupVisual setup={setup} /><div className="setup-meta"><div className="setup-title-line"><span className="setup-title">{setup.title}</span><span className="setup-location">{setup.location}</span></div><p className="setup-owner">{setup.owner} · {setup.components.length} компоненти</p></div></Link>; }
