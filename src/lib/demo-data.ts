import type { AudioComponent, RoomDetails, Setup } from "@/lib/types";

const emptyRoom: RoomDetails = { size: null, hasAcousticTreatment: null, acousticNotes: null, listeningNotes: null, budgetRange: null };

export const demoComponents: AudioComponent[] = [
  { id: "f0d1e2a3-b4c5-46d7-8901-000000000001", brand: "Audio-Technica", model: "AT-LP7", category: "Програвач", origin: "standard" },
  { id: "f0d1e2a3-b4c5-46d7-8901-000000000002", brand: "WiiM", model: "Ultra", category: "Стример", origin: "standard" },
  { id: "f0d1e2a3-b4c5-46d7-8901-000000000003", brand: "KEF", model: "LS50 Meta", category: "Акустика", origin: "standard" },
  { id: "f0d1e2a3-b4c5-46d7-8901-000000000004", brand: "Cambridge Audio", model: "CXN V2", category: "Стример", origin: "standard" },
  { id: "f0d1e2a3-b4c5-46d7-8901-000000000005", brand: "Oleh Audio", model: "Однотактний ламповий підсилювач", category: "Підсилювач", origin: "handmade" },
  { id: "f0d1e2a3-b4c5-46d7-8901-000000000006", brand: "Studio Kvit", model: "Стійки під монітори", category: "Аксесуар", origin: "custom_order" },
];

export const demoSetups: Setup[] = [
  { slug: "soft-morning", title: "Soft Morning", location: "Львів", owner: "Андрій С.", vibe: "Вініл · 2 канали", description: "Невелика система для ранкових платівок, повільної кави й уважного слухання. Кожен предмет тут залишений лише тому, що додає щось до музики.", palette: { background: "#dce4dc", wall: "#e9ddc6" }, components: [demoComponents[0], demoComponents[4], demoComponents[2]], coverUrl: null, coverPath: null, categories: ["Вініл"], categoryIds: [], isPublished: true, moderationStatus: "approved", likeCount: 0, room: emptyRoom, ownerId: null, createdAt: null, updatedAt: null, comments: [] },
  { slug: "city-after-rain", title: "City after rain", location: "Київ", owner: "Марія К.", vibe: "Стрімінг · Nearfield", description: "Робоче місце, яке після шостої перетворюється на місце для альбомів цілком. Компактно, тихо, без зайвого блиску.", palette: { background: "#dce7e2", wall: "#cbd9d1" }, components: [demoComponents[1], demoComponents[2], demoComponents[5]], coverUrl: null, coverPath: null, categories: ["Стрімінг", "Мінімалізм"], categoryIds: [], isPublished: true, moderationStatus: "approved", likeCount: 0, room: emptyRoom, ownerId: null, createdAt: null, updatedAt: null, comments: [] },
  { slug: "walnut-and-warmth", title: "Walnut & warmth", location: "Дрогобич", owner: "Юрій Б.", vibe: "Handmade · Вініл", description: "Сетап навколо лампового підсилювача, зібраного місцевим майстром. Трохи дерева, трохи тепла — і багато старого соулу.", palette: { background: "#e6ded1", wall: "#d8b798" }, components: [demoComponents[0], demoComponents[4], demoComponents[5]], coverUrl: null, coverPath: null, categories: ["DIY / Handmade", "Вініл"], categoryIds: [], isPublished: true, moderationStatus: "approved", likeCount: 0, room: emptyRoom, ownerId: null, createdAt: null, updatedAt: null, comments: [] },
];

export const getDemoSetup = (slug: string) => demoSetups.find((setup) => setup.slug === slug);
