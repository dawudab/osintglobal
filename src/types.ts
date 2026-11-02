export type EventCategory = 'strike' | 'military_movement' | 'infrastructure' | 'civilian' | 'general';

export const BASE_TAGS = ['Protest', 'Government', 'Conflict', 'Tech/Cyber', 'Human Rights'] as const;
export type BaseTag = (typeof BASE_TAGS)[number];

export interface OsintEvent {
  id?: string;
  title: string;
  summary: string;
  locationName: string;
  lat: number;
  lng: number;
  category: EventCategory;
  tags: string[];
  sourceUrl?: string;
  mediaUrl?: string;
  createdAt: number;
  expiresAt: number;
}

export type EventDraft = Pick<OsintEvent, 'title' | 'summary' | 'locationName' | 'lat' | 'lng' | 'category' | 'tags'> & {
  sourceUrl?: string;
  mediaUrl?: string;
};

export type AiProvider = 'openai_compatible' | 'gemini';

export interface AiConfig {
  provider: AiProvider;
  apiKey: string;
  baseUrl: string;
  model: string;
}
