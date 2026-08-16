export type ComponentOrigin = "standard" | "handmade" | "custom_order";

export type AudioComponent = { id: string; brand: string; model: string; category: string; origin: ComponentOrigin; imageUrl?: string | null };

export type Category = { id: string; name: string; slug: string };

export type Setup = { slug: string; title: string; location: string; owner: string; description: string; vibe: string; palette: { background: string; wall: string }; components: AudioComponent[]; coverUrl: string | null; categories: string[]; isPublished: boolean };
