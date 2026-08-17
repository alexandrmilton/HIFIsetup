import type { Locale } from "@/lib/i18n/dictionaries";

/** Component catalogue categories, setup tags and the manual-add picker's
 *  group labels are all stored in Ukrainian in the database / source data
 *  (they're a closed, known vocabulary — unlike setup titles or usernames,
 *  which are free user text and can't be machine-translated statically).
 *  These lookup tables let the English locale display a translated label
 *  while the stored value — used for filtering, grouping and the DB column —
 *  stays the original Ukrainian string. */

const COMPONENT_CATEGORY_EN: Record<string, string> = {
  "Вініловий програвач": "Turntable",
  "Картридж": "Cartridge",
  "CD-програвач": "CD player",
  "Мережевий програвач": "Network streamer",
  "Тюнер": "Tuner",
  "Котушковий магнітофон": "Reel-to-reel",
  "Касетна дека": "Cassette deck",
  "Фонокоректор ламповий": "Tube phono stage",
  "Фонокоректор транзисторний": "Solid-state phono stage",
  "ЦАП (DAC)": "DAC",
  "Еквалайзер / DSP": "Equalizer / DSP",
  "Попередній підсилювач": "Preamplifier",
  "Інтегральний підсилювач": "Integrated amplifier",
  "Моноблоки": "Monoblocks",
  "Ресивер": "Receiver",
  "Підсилювач для навушників": "Headphone amplifier",
  "Акустика підлогова": "Floorstanding speakers",
  "Акустика полична": "Bookshelf speakers",
  "Акустика планарна": "Planar speakers",
  "Студійні монітори": "Studio monitors",
  "Бездротова акустика": "Wireless speakers",
  "Сабвуфер": "Subwoofer",
  "Навушники": "Headphones",
  "Міжблочний кабель": "Interconnect cable",
  "Акустичний кабель": "Speaker cable",
  "Фонокабель": "Phono cable",
  "Цифровий кабель": "Digital cable",
  "Кабель живлення": "Power cable",
  "Мережевий фільтр / живлення": "Power conditioner",
  "Стійка під апаратуру": "Equipment rack",
  "Підставка під акустику": "Speaker stand",
  "Акустична обробка": "Room acoustic treatment",
  "Віброізоляція": "Vibration isolation",
  "Догляд за вінілом": "Vinyl care",
  "Аксесуар": "Accessory",
};

const GROUP_LABEL_EN: Record<string, string> = {
  "Джерела": "Sources",
  "Фонокорекція": "Phono stage",
  "Цифровий тракт": "Digital",
  "Підсилення": "Amplification",
  "Акустика": "Speakers",
  "Навушники": "Headphones",
  "Кабелі та живлення": "Cables & power",
  "Меблі та акустика приміщення": "Furniture & room acoustics",
  "Аксесуари": "Accessories",
};

const SETUP_CATEGORY_EN: Record<string, string> = {
  "Вініл": "Vinyl",
  "Стрімінг": "Streaming",
  "Навушники": "Headphones",
  "Хай-енд": "High-end",
  "Бюджетний": "Budget",
  "Мінімалізм": "Minimalist",
  "Ретро": "Retro",
  "Домашній кінотеатр": "Home theater",
  "Багатокімнатний": "Multi-room",
  "Портативний": "Portable",
  "Студійний": "Studio",
  "Автозвук": "Car audio",
  "Комп'ютерний звук": "Desktop audio",
  "Джаз": "Jazz",
  "Класика": "Classical",
  "Рок": "Rock",
  "Метал": "Metal",
  "Електроніка": "Electronic",
  "Хіп-хоп": "Hip-hop",
  "Поп": "Pop",
  "Інді": "Indie",
  "Саундтреки": "Soundtracks",
  "Реггі": "Reggae",
  "Ламповий звук": "Tube sound",
};

export const translateComponentCategory = (category: string, locale: Locale): string =>
  locale === "uk" ? category : COMPONENT_CATEGORY_EN[category] ?? category;

export const translateGroupLabel = (label: string, locale: Locale): string =>
  locale === "uk" ? label : GROUP_LABEL_EN[label] ?? label;

export const translateSetupCategory = (name: string, locale: Locale): string =>
  locale === "uk" ? name : SETUP_CATEGORY_EN[name] ?? name;
