import type { AudioComponent } from "@/lib/types";
import type { Dictionary } from "@/lib/i18n/dictionaries";

const glyphs: Record<string, string> = {
  "Програвач": "💿", "Акустика": "🔊", "Підсилювач": "🎛", "Стример": "📡", "ЦАП": "🔢",
  "Фонокоректор": "🎚", "Навушники": "🎧", "Підсилювач для навушників": "🎧", "Кабелі": "🔌",
  "Сабвуфер": "📢", "Стійка": "🗄", "Картридж": "💎", "CD-програвач": "💽", "Ресивер": "📻",
  "Студійні монітори": "🔊", "Бездротова акустика": "📶", "Аксесуар": "🧩",
};

/** Signal path drawn as a chain of cards joined by connectors: horizontal on
 *  desktop, vertical on mobile (the connectors rotate via CSS). */
export function SignalChain({ components, t }: { components: AudioComponent[]; t: Dictionary }) {
  if (components.length < 2) return null;
  return (
    <section className="schema">
      <p className="eyebrow">{t.setup.schema}</p>
      <ol className="schema-flow">
        {components.map((component, index) => (
          <li className="schema-item" key={component.id}>
            <div className={`schema-node schema-node-${component.origin}`}>
              <span className="schema-glyph" aria-hidden="true">{glyphs[component.category] ?? "🎵"}</span>
              <small>{component.category}</small>
              <strong>{component.brand}</strong>
              <span className="schema-model">{component.model}</span>
              {component.origin !== "standard" && <span className={`schema-flag schema-flag-${component.origin}`}>{t.origin[component.origin]}</span>}
            </div>
            {index < components.length - 1 && <span className="schema-link" aria-hidden="true"><i /><b>›</b></span>}
          </li>
        ))}
      </ol>
    </section>
  );
}
