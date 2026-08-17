/** Per-category glyph + accent, used by the chain nodes and the component list
 *  so no card ever renders as a blank grey square. Categories are grouped so
 *  the manual-add picker can render them as <optgroup>s, with accessory-type
 *  categories pushed to the very end of the list. */
const META: Record<string, { icon: string; tone: string }> = {
  "Вініловий програвач": { icon: "💿", tone: "source" },
  "Картридж": { icon: "💎", tone: "source" },
  "CD-програвач": { icon: "📀", tone: "source" },
  "Мережевий програвач": { icon: "📡", tone: "source" },
  "Тюнер": { icon: "📻", tone: "source" },
  "Котушковий магнітофон": { icon: "🎞", tone: "source" },
  "Касетна дека": { icon: "📼", tone: "source" },

  "Фонокоректор ламповий": { icon: "🔥", tone: "vinyl" },
  "Фонокоректор транзисторний": { icon: "🎚", tone: "vinyl" },

  "ЦАП (DAC)": { icon: "🔢", tone: "digital" },
  "Еквалайзер / DSP": { icon: "🎛", tone: "digital" },

  "Попередній підсилювач": { icon: "🔀", tone: "amp" },
  "Інтегральний підсилювач": { icon: "🔆", tone: "amp" },
  "Моноблоки": { icon: "⚡", tone: "amp" },
  "Ресивер": { icon: "📺", tone: "amp" },
  "Підсилювач для навушників": { icon: "💪", tone: "amp" },

  "Акустика підлогова": { icon: "🔊", tone: "speaker" },
  "Акустика полична": { icon: "🔈", tone: "speaker" },
  "Акустика планарна": { icon: "🪟", tone: "speaker" },
  "Студійні монітори": { icon: "🎙", tone: "speaker" },
  "Бездротова акустика": { icon: "📶", tone: "speaker" },
  "Сабвуфер": { icon: "📢", tone: "speaker" },

  "Навушники": { icon: "🎧", tone: "speaker" },

  "Міжблочний кабель": { icon: "🔌", tone: "support" },
  "Акустичний кабель": { icon: "〰️", tone: "support" },
  "Фонокабель": { icon: "🔗", tone: "support" },
  "Цифровий кабель": { icon: "🧮", tone: "support" },
  "Кабель живлення": { icon: "🔋", tone: "support" },
  "Мережевий фільтр / живлення": { icon: "🛡", tone: "support" },

  "Стійка під апаратуру": { icon: "🗄", tone: "support" },
  "Підставка під акустику": { icon: "🪑", tone: "support" },
  "Акустична обробка": { icon: "🧱", tone: "support" },
  "Віброізоляція": { icon: "⚙️", tone: "support" },

  "Догляд за вінілом": { icon: "🧴", tone: "support" },
  "Аксесуар": { icon: "🧰", tone: "support" },
};

const FALLBACK = { icon: "🎵", tone: "support" };

export const componentMeta = (category: string) => META[category] ?? FALLBACK;

/** Manual-add picker groups, in display order. Accessory-type groups are
 *  deliberately last so they read as a separate, secondary tier of the list. */
export const CATEGORY_GROUPS: { label: string; categories: string[] }[] = [
  { label: "Джерела", categories: ["Вініловий програвач", "Картридж", "CD-програвач", "Мережевий програвач", "Тюнер", "Котушковий магнітофон", "Касетна дека"] },
  { label: "Фонокорекція", categories: ["Фонокоректор ламповий", "Фонокоректор транзисторний"] },
  { label: "Цифровий тракт", categories: ["ЦАП (DAC)", "Еквалайзер / DSP"] },
  { label: "Підсилення", categories: ["Попередній підсилювач", "Інтегральний підсилювач", "Моноблоки", "Ресивер", "Підсилювач для навушників"] },
  { label: "Акустика", categories: ["Акустика підлогова", "Акустика полична", "Акустика планарна", "Студійні монітори", "Бездротова акустика", "Сабвуфер"] },
  { label: "Навушники", categories: ["Навушники"] },
  { label: "Кабелі та живлення", categories: ["Міжблочний кабель", "Акустичний кабель", "Фонокабель", "Цифровий кабель", "Кабель живлення", "Мережевий фільтр / живлення"] },
  { label: "Меблі та акустика приміщення", categories: ["Стійка під апаратуру", "Підставка під акустику", "Акустична обробка", "Віброізоляція"] },
  { label: "Аксесуари", categories: ["Догляд за вінілом", "Аксесуар"] },
];

/** Flat category list, kept for the sidebar filter and search dropdown. */
export const COMPONENT_CATEGORIES = CATEGORY_GROUPS.flatMap((group) => group.categories);
