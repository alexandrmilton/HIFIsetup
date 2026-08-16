import type { AudioComponent } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { componentMeta } from "@/lib/component-meta";

/** Thin tapered arrow — the line fades in and the head stays light, so a long
 *  chain reads as flow rather than as a row of heavy glyphs. */
function ChainArrow({ vertical = false }: { vertical?: boolean }) {
  return (
    <span className={vertical ? "chain-arrow is-vertical" : "chain-arrow"} aria-hidden="true">
      <svg viewBox="0 0 64 16" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
        <defs>
          <linearGradient id="chainFade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.15" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="1" />
          </linearGradient>
        </defs>
        <path d="M2 8 H50" stroke="url(#chainFade)" strokeWidth="2" strokeLinecap="round" />
        <path d="M45 3 L51 8 L45 13" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </span>
  );
}

function ChainNode({ component, index }: { component: AudioComponent; index: number }) {
  const meta = componentMeta(component.category);
  return (
    <div className={`schema-node tone-${meta.tone} schema-node-${component.origin}`}>
      <span className="schema-step">{index + 1}</span>
      <span className="schema-glyph" aria-hidden="true">{meta.icon}</span>
      <small>{component.category}</small>
      <strong>{component.brand}</strong>
      <span className="schema-model">{component.model}</span>
      {component.origin !== "standard" && (
        <span className={`schema-flag schema-flag-${component.origin}`}>{component.origin === "handmade" ? "Handmade" : "Custom"}</span>
      )}
    </div>
  );
}

/** The chain wraps into rows instead of running off one long line: each row
 *  flows left to right, and a return marker shows where the next row picks up. */
export function SignalChain({ components, t }: { components: AudioComponent[]; t: Dictionary }) {
  const chain = components.filter((component) => !component.isExtra);
  if (chain.length < 2) return null;

  return (
    <section className="schema">
      <p className="eyebrow">{t.setup.schema}</p>
      <ol className="schema-flow">
        {chain.map((component, index) => (
          <li className="schema-item" key={`${component.id}-${index}`}>
            <ChainNode component={component} index={index} />
            {index < chain.length - 1 && <ChainArrow />}
          </li>
        ))}
      </ol>
    </section>
  );
}
