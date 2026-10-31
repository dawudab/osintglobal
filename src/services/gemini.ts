import { GoogleGenerativeAI, SchemaType, type ResponseSchema } from '@google/generative-ai';
import type { EventDraft } from '../types';
import { CATEGORY_KEYS, isCategory } from '../utils/categories';
import { heuristicParse } from '../utils/heuristic';

const KEY_STORAGE = 'centcom.geminiKey';
// gemini-2.5-flash is preferred; newer keys may only expose the rolling alias.
const MODELS = ['gemini-2.5-flash', 'gemini-flash-latest'];

const envKey = /^your-/.test(import.meta.env.VITE_GEMINI_API_KEY ?? '') ? '' : import.meta.env.VITE_GEMINI_API_KEY;
export const getGeminiKey = () => sessionStorage.getItem(KEY_STORAGE) || envKey || '';
export const hasKeyOverride = () => !!sessionStorage.getItem(KEY_STORAGE);
export function setGeminiKeyOverride(key: string) {
  if (key.trim()) sessionStorage.setItem(KEY_STORAGE, key.trim());
  else sessionStorage.removeItem(KEY_STORAGE);
}

const SYSTEM_PROMPT = `You are a military OSINT analyst co-pilot. Input is a raw news or Telegram post in any language (English, Russian, Arabic, Spanish, Portuguese, Ukrainian, etc.).
Return ONLY a JSON object with these fields:
- title: concise neutral English headline, max 60 characters, no emojis.
- summary: exactly 2 neutral, military-style English sentences summarizing what happened (translate if needed). No speculation beyond the source.
- locationName: most specific location as "City, Country" (or a named sea/strait/region if no city).
- lat, lng: your best decimal-degree estimate for locationName.
- category: one of ${CATEGORY_KEYS.join(', ')}. strike = kinetic attacks/explosions; military_movement = troop/vehicle/naval/air deployments; infrastructure = power, transport, energy, comms damage or outages; civilian = humanitarian, displacement, civilian casualties; general = anything else.
Never include usernames, channel handles, phone numbers or personal identifiers.`;

const schema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    title: { type: SchemaType.STRING },
    summary: { type: SchemaType.STRING },
    locationName: { type: SchemaType.STRING },
    lat: { type: SchemaType.NUMBER },
    lng: { type: SchemaType.NUMBER },
    category: { type: SchemaType.STRING, format: 'enum', enum: CATEGORY_KEYS },
  },
  required: ['title', 'summary', 'locationName', 'lat', 'lng', 'category'],
};

export interface AnalysisResult {
  draft: EventDraft;
  source: 'ai' | 'heuristic';
  error?: string;
}

async function generate(key: string, raw: string) {
  const client = new GoogleGenerativeAI(key);
  let lastErr: unknown;
  for (const model of MODELS) {
    try {
      const res = await client
        .getGenerativeModel({
          model,
          systemInstruction: SYSTEM_PROMPT,
          generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.2 },
        })
        .generateContent(raw);
      return JSON.parse(res.response.text()) as Partial<Record<keyof EventDraft, unknown>>;
    } catch (err) {
      lastErr = err;
      // Only fall through to the next model when this one is unavailable to the key.
      if (!/404|not found|no longer available/i.test(String((err as Error)?.message))) throw err;
    }
  }
  throw lastErr;
}

export async function analyzeIntel(raw: string): Promise<AnalysisResult> {
  const fallback = heuristicParse(raw);
  const key = getGeminiKey();
  if (!key) return { draft: fallback, source: 'heuristic', error: 'No Gemini API key configured' };
  try {
    const j = await generate(key, raw);
    const lat = Number(j.lat);
    const lng = Number(j.lng);
    return {
      source: 'ai',
      draft: {
        title: String(j.title ?? fallback.title).slice(0, 60),
        summary: String(j.summary ?? fallback.summary),
        locationName: String(j.locationName ?? fallback.locationName),
        lat: Number.isFinite(lat) && Math.abs(lat) <= 90 ? lat : fallback.lat,
        lng: Number.isFinite(lng) && Math.abs(lng) <= 180 ? lng : fallback.lng,
        category: isCategory(j.category) ? j.category : fallback.category,
        sourceUrl: fallback.sourceUrl,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { draft: fallback, source: 'heuristic', error: msg.slice(0, 200) };
  }
}

/** Free OSM Nominatim lookup as a manual geocoding backup. */
export async function geocode(q: string): Promise<{ lat: number; lng: number; name: string } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=en&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { referrerPolicy: 'no-referrer', credentials: 'omit' });
  if (!res.ok) throw new Error(`Geocoder HTTP ${res.status}`);
  const [hit] = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  return hit ? { lat: Number(hit.lat), lng: Number(hit.lon), name: hit.display_name } : null;
}
