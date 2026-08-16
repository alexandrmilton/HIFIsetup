/** Per-category glyph + accent, used by the chain nodes and the component list
 *  so no card ever renders as a blank grey square. */
const META: Record<string, { icon: string; tone: string }> = {
  "Вініловий програвач": { icon: "💿", tone: "vinyl" },
  "Картридж": { icon: "💎", tone: "vinyl" },
  "Фонокоректор": { icon: "🎚", tone: "vinyl" },
  "Догляд за вінілом": { icon: "🧴", tone: "vinyl" },
  "CD-програвач": { icon: "💽", tone: "source" },
  "Мережевий програвач": { icon: "📡", tone: "source" },
  "Медіа-сервер": { icon: "🗄", tone: "source" },
  "Тюнер": { icon: "📻", tone: "source" },
  "Котушковий магнітофон": { icon: "📼", tone: "source" },
  "Касетна дека": { icon: "📼", tone: "source" },
  "ЦАП (DAC)": { icon: "🔢", tone: "digital" },
  "Процесор / DSP": { icon: "🎛", tone: "digital" },
  "Еквалайзер": { icon: "🎚", tone: "digital" },
  "Інтегральний підсилювач": { icon: "🔆", tone: "amp" },
  "Попередній підсилювач": { icon: "🎛", tone: "amp" },
  "Підсилювач потужності": { icon: "⚡", tone: "amp" },
  "Ресивер": { icon: "📺", tone: "amp" },
  "Підсилювач для навушників": { icon: "🎧", tone: "amp" },
  "Акустика (підлогова/полична)": { icon: "🔊", tone: "speaker" },
  "Студійні монітори": { icon: "🎙", tone: "speaker" },
  "Бездротова акустика": { icon: "📶", tone: "speaker" },
  "Сабвуфер": { icon: "📢", tone: "speaker" },
  "Накладні навушники": { icon: "🎧", tone: "speaker" },
  "Внутрішньоканальні": { icon: "🎵", tone: "speaker" },
  "Кабелі та комутація": { icon: "🔌", tone: "support" },
  "Мережевий фільтр / живлення": { icon: "🔋", tone: "support" },
  "Стійка під апаратуру": { icon: "🗃", tone: "support" },
  "Підставка під акустику": { icon: "🪑", tone: "support" },
  "Віброізоляція": { icon: "🧩", tone: "support" },
  "Акустична обробка": { icon: "🧱", tone: "support" },
  "Аксесуар": { icon: "🧰", tone: "support" },
};

const FALLBACK = { icon: "🎵", tone: "support" };

export const componentMeta = (category: string) => META[category] ?? FALLBACK;

/** Category list offered when a member adds a component by hand. */
export const COMPONENT_CATEGORIES = Object.keys(META);
