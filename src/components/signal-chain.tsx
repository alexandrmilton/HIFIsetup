import type { AudioComponent } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n/dictionaries";
import { componentMeta } from "@/lib/component-meta";

/** Three chevrons that brighten toward the next component. Drawn as plain
 *  paths with literal colours — a gradient referenced by url(#id) breaks when
 *  the same id repeats per arrow, and CSS vars are unreliable inside <stop>. */
function ChainArrow() {
  return (
    <span className="schema-arrow" aria-hidden="true">
      <svg viewBox="0 0 44 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        {[0, 1, 2].map((step) => (
          <path
            key={step}
            d={`M${5 + step * 13} 4 L${11 + step * 13} 8 L${5 + step * 13} 12`}
            stroke="#6d28d9"
            strokeOpacity={0.35 + step * 0.32}
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
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

/** The chain keeps the order the member arranged in the wizard (position), and
 *  wraps into rows instead of running off one long line. */
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
