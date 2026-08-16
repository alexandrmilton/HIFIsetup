export type ComponentOrigin = "standard" | "handmade" | "custom_order";
export type ModerationStatus = "pending" | "approved" | "rejected";

export type AudioComponent = { id: string; brand: string; model: string; category: string; origin: ComponentOrigin; imageUrl?: string | null };

export type Category = { id: string; name: string; slug: string };

export type RoomDetails = { size: string | null; hasAcousticTreatment: boolean | null; acousticNotes: string | null; listeningNotes: string | null; budgetRange: string | null };

export type SetupComment = { id: string; body: string; createdAt: string; authorId: string; authorName: string | null; authorAvatar: string | null };

export type Setup = {
  slug: string;
  title: string;
  location: string;
  owner: string;
  ownerId: string | null;
  description: string;
  vibe: string;
  palette: { background: string; wall: string };
  components: AudioComponent[];
  coverUrl: string | null;
  coverPath: string | null;
  categories: string[];
  categoryIds: string[];
  isPublished: boolean;
  moderationStatus: ModerationStatus;
  likeCount: number;
  room: RoomDetails;
  createdAt: string | null;
  updatedAt: string | null;
  comments: SetupComment[];
};
