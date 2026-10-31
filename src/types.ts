export type EventCategory = 'strike' | 'military_movement' | 'infrastructure' | 'civilian' | 'general';

export interface OsintEvent {
  id?: string;
  title: string;
  summary: string;
  locationName: string;
  lat: number;
  lng: number;
  category: EventCategory;
  sourceUrl?: string;
  mediaUrl?: string;
  createdAt: number;
  expiresAt: number;
}

export type EventDraft = Pick<OsintEvent, 'title' | 'summary' | 'locationName' | 'lat' | 'lng' | 'category'> & {
  sourceUrl?: string;
};
