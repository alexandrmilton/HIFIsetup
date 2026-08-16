import type { AudioComponent } from "@/lib/types";

const glyphs: Record<string, string> = {
  "Програвач": "💿", "Акустика": "🔊", "Підсилювач": "🎛", "Стример": "📡", "ЦАП": "🔢",
  "Фонокоректор": "🎚", "Навушники": "🎧", "Підсилювач для навушників": "🎧", "Кабелі": "🔌", "Аксесуар": "🧩",
};

/** Signal path drawn as a chain of cards joined by connectors: horizontal on
 *  desktop, vertical on mobile (the connectors rotate via CSS). */
export function SignalChain({ components }: { components: AudioComponent[] }) {
  if (components.length < 2) return null;
  return (
    <section className="schema">
      <p className="eyebrow">Схема підключення</p>
      <ol className="schema-flow">
        {components.map((component, index) => (
          <li className="schema-item" key={component.id}>
            <div className={`schema-node schema-node-${component.origin}`}>
              <span className="schema-glyph" aria-hidden="true">{glyphs[component.category] ?? "🎵"}</span>
              <small>{component.category}</small>
              <strong>{component.brand}</strong>
              <span className="schema-model">{component.model}</span>
              {component.origin !== "standard" && <span className={`schema-flag schema-flag-${component.origin}`}>{component.origin === "handmade" ? "Handmade" : "Custom"}</span>}
            </div>
            {index < components.length - 1 && <span className="schema-link" aria-hidden="true"><i /><b>›</b></span>}
          </li>
        ))}
      </ol>
    </section>
  );
}
