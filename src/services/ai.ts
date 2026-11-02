import { GoogleGenerativeAI } from '@google/generative-ai';
import { BASE_TAGS, type AiConfig, type EventDraft } from '../types';
import { tagsToCategory } from '../utils/categories';
import { heuristicParse } from '../utils/heuristic';

const STORAGE_KEY = 'rn_universal_ai_config';

export const AI_PRESETS: { name: string; config: Omit<AiConfig, 'apiKey'> }[] = [
  {
    name: 'OpenAI (GPT-4o mini)',
    config: {
      provider: 'openai_compatible',
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o-mini',
    },
  },
  {
    name: 'OpenRouter (Universal)',
    config: {
      provider: 'openai_compatible',
      baseUrl: 'https://openrouter.ai/api/v1',
      model: 'meta-llama/llama-3.3-70b-instruct',
    },
  },
  {
    name: 'Groq (Ultra-Fast Llama 3.3)',
    config: {
      provider: 'openai_compatible',
      baseUrl: 'https://api.groq.com/openai/v1',
      model: 'llama-3.3-70b-versatile',
    },
  },
  {
    name: 'Bittensor Subnet (Cortex Gateway)',
    config: {
      provider: 'openai_compatible',
      baseUrl: 'https://api.corcel.io/v1',
      model: 'cortext-ultra',
    },
  },
  {
    name: 'Local Ollama / vLLM Node',
    config: {
      provider: 'openai_compatible',
      baseUrl: 'http://localhost:11434/v1',
      model: 'llama3.2',
    },
  },
  {
    name: 'Google Gemini (Flash 2.5)',
    config: {
      provider: 'gemini',
      baseUrl: 'https://generativelanguage.googleapis.com',
      model: 'gemini-2.5-flash',
    },
  },
];

export function getDefaultAiConfig(): AiConfig {
  const envGemini = import.meta.env.VITE_GEMINI_API_KEY;
  const envCleanGemini = envGemini && !/^your-|^change-me/.test(envGemini) ? envGemini : '';

  try {
    const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AiConfig>;
      return {
        provider: parsed.provider ?? (parsed.apiKey?.startsWith('AIza') ? 'gemini' : 'openai_compatible'),
        apiKey: parsed.apiKey ?? envCleanGemini,
        baseUrl: parsed.baseUrl || (parsed.provider === 'gemini' ? 'https://generativelanguage.googleapis.com' : 'https://api.openai.com/v1'),
        model: parsed.model || (parsed.provider === 'gemini' ? 'gemini-2.5-flash' : 'gpt-4o-mini'),
      };
    }
  } catch {
    // ignore parsing errors
  }

  if (envCleanGemini) {
    return {
      provider: 'gemini',
      apiKey: envCleanGemini,
      baseUrl: 'https://generativelanguage.googleapis.com',
      model: 'gemini-2.5-flash',
    };
  }

  return {
    provider: 'openai_compatible',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  };
}

export function saveAiConfig(cfg: AiConfig) {
  const clean: AiConfig = {
    provider: cfg.provider,
    apiKey: cfg.apiKey.trim(),
    baseUrl: (cfg.baseUrl || 'https://api.openai.com/v1').trim().replace(/\/+$/, ''),
    model: (cfg.model || 'gpt-4o-mini').trim(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(clean));
  return clean;
}

export function hasActiveAiKey(): boolean {
  const cfg = getDefaultAiConfig();
  return cfg.apiKey.trim().length > 0;
}

export interface AnalysisResult {
  draft: EventDraft;
  source: 'ai' | 'heuristic';
  error?: string;
  providerName?: string;
}

export interface AiExtractionParams {
  apiKey: string;
  baseUrl: string;
  model?: string;
  provider?: 'openai_compatible' | 'gemini';
}

const SYSTEM_PROMPT = `You are an intelligence editor for Resistance Network (RN // GLOBAL). Analyze the raw news wire, dispatch, or Telegram post in any language.
Return ONLY a valid JSON object with these EXACT keys:
- "title": Catchy, objective English news headline (max 60 characters, no emojis).
- "summary": Exactly 2 to 3 concise, objective English sentences summarizing the core event. No editorializing.
- "locationName": Most specific location as "City, Country" (or named body of water / region).
- "lat": Estimated decimal latitude (-90 to 90).
- "lng": Estimated decimal longitude (-180 to 180).
- "tags": Array of 1 to 3 relevant string tags. Prefer base tags (${BASE_TAGS.join(', ')}) when applicable, or suggest specific tags (e.g. "Election", "Economic Crisis", "Censorship", "Surveillance", "Sanctions", "Infrastructure").
Do not include markdown fences outside the JSON. Return valid JSON only.`;

function extractJsonFromText(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  const codeBlock = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  const target = codeBlock ? codeBlock[1].trim() : trimmed;

  try {
    return JSON.parse(target) as Record<string, unknown>;
  } catch {
    const firstBrace = target.indexOf('{');
    const lastBrace = target.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      const slice = target.slice(firstBrace, lastBrace + 1);
      return JSON.parse(slice) as Record<string, unknown>;
    }
    throw new Error('Failed to parse AI JSON response');
  }
}

async function callOpenAiCompatible(baseUrl: string, apiKey: string, model: string, prompt: string): Promise<Record<string, unknown>> {
  const url = `${baseUrl.replace(/\/+$/, '')}/chat/completions`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const payload = {
    model: model || 'gpt-4o-mini',
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
    temperature: 0.2,
  };

  let res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ ...payload, response_format: { type: 'json_object' } }),
  });

  if (!res.ok && res.status === 400) {
    // Retry without response_format if provider doesn't support json_object mode
    res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });
  }

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`LLM Endpoint HTTP ${res.status}: ${errText.slice(0, 140)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('LLM returned an empty message content');
  return extractJsonFromText(content);
}

async function callGemini(apiKey: string, model: string, prompt: string): Promise<Record<string, unknown>> {
  const client = new GoogleGenerativeAI(apiKey);
  const models = [model || 'gemini-2.5-flash', 'gemini-flash-latest'];
  let lastErr: unknown;

  for (const m of models) {
    try {
      const res = await client
        .getGenerativeModel({
          model: m,
          systemInstruction: SYSTEM_PROMPT,
          generationConfig: { responseMimeType: 'application/json', temperature: 0.2 },
        })
        .generateContent(prompt);
      const text = res.response.text();
      return extractJsonFromText(text);
    } catch (err) {
      lastErr = err;
      if (!/404|not found|no longer available/i.test(String((err as Error)?.message))) throw err;
    }
  }
  throw lastErr;
}

/**
 * Provider-agnostic modular extraction function.
 * Accepts API Key and Base URL as parameters to query any LLM endpoint.
 */
export async function extractDispatchWithAi(raw: string, params: AiExtractionParams): Promise<AnalysisResult> {
  const fallback = heuristicParse(raw);
  const apiKey = (params.apiKey || '').trim();
  const baseUrl = (params.baseUrl || '').trim().replace(/\/+$/, '');
  const model = (params.model || 'gpt-4o-mini').trim();

  const isGemini =
    params.provider === 'gemini' ||
    baseUrl.includes('googleapis.com') ||
    (apiKey.startsWith('AIza') && (!baseUrl || baseUrl === 'https://generativelanguage.googleapis.com'));

  if (!apiKey && isGemini) {
    return {
      draft: fallback,
      source: 'heuristic',
      error: 'API key is required for Gemini',
      providerName: 'Offline Heuristic',
    };
  }

  try {
    let j: Record<string, unknown>;
    if (isGemini) {
      j = await callGemini(apiKey, model, raw);
    } else {
      j = await callOpenAiCompatible(baseUrl || 'https://api.openai.com/v1', apiKey, model, raw);
    }

    const lat = Number(j.lat);
    const lng = Number(j.lng);
    const rawTags = Array.isArray(j.tags)
      ? j.tags
          .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
          .map((t) => t.trim())
          .slice(0, 3)
      : [];
    const tags = rawTags.length > 0 ? rawTags : fallback.tags;

    return {
      source: 'ai',
      providerName: `${isGemini ? 'Gemini' : 'LLM'} (${model})`,
      draft: {
        title: String(j.title ?? fallback.title).trim().slice(0, 60),
        summary: String(j.summary ?? fallback.summary).trim(),
        locationName: String(j.locationName ?? fallback.locationName).trim(),
        lat: Number.isFinite(lat) && Math.abs(lat) <= 90 ? lat : fallback.lat,
        lng: Number.isFinite(lng) && Math.abs(lng) <= 180 ? lng : fallback.lng,
        tags,
        category: tagsToCategory(tags),
        sourceUrl: fallback.sourceUrl,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      draft: fallback,
      source: 'heuristic',
      error: msg.slice(0, 200),
      providerName: 'Offline Heuristic Fallback',
    };
  }
}

/** Modular connection tester that accepts apiKey and baseUrl */
export async function testAiConnection(params: AiExtractionParams): Promise<{ ok: boolean; latencyMs: number; message: string }> {
  const apiKey = (params.apiKey || '').trim();
  const baseUrl = (params.baseUrl || '').trim().replace(/\/+$/, '');
  const model = (params.model || 'gpt-4o-mini').trim();

  const isGemini =
    params.provider === 'gemini' ||
    baseUrl.includes('googleapis.com') ||
    (apiKey.startsWith('AIza') && (!baseUrl || baseUrl === 'https://generativelanguage.googleapis.com'));

  if (!apiKey && isGemini) {
    return { ok: false, latencyMs: 0, message: 'API key is required' };
  }

  const start = performance.now();
  try {
    const testPrompt = 'Respond with {"status":"ok","network":"bittensor-ready"} in JSON.';
    if (isGemini) {
      await callGemini(apiKey, model, testPrompt);
    } else {
      await callOpenAiCompatible(baseUrl || 'https://api.openai.com/v1', apiKey, model, testPrompt);
    }
    const latencyMs = Math.round(performance.now() - start);
    return { ok: true, latencyMs, message: `Connected to ${model} (${latencyMs}ms)` };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start);
    return { ok: false, latencyMs, message: (err as Error).message || 'Connection failed' };
  }
}

/** Backward-compatible helper analyzing intel using default persisted config */
export async function analyzeIntel(raw: string): Promise<AnalysisResult> {
  const cfg = getDefaultAiConfig();
  return extractDispatchWithAi(raw, cfg);
}

/** Free OSM Nominatim lookup as a manual geocoding backup */
export async function geocode(q: string): Promise<{ lat: number; lng: number; name: string } | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&accept-language=en&q=${encodeURIComponent(q)}`;
  const res = await fetch(url, { referrerPolicy: 'no-referrer', credentials: 'omit' });
  if (!res.ok) throw new Error(`Geocoder HTTP ${res.status}`);
  const [hit] = (await res.json()) as { lat: string; lon: string; display_name: string }[];
  return hit ? { lat: Number(hit.lat), lng: Number(hit.lon), name: hit.display_name } : null;
}

// Backward-compatible adapters
export const getGeminiKey = () => getDefaultAiConfig().apiKey;
export const hasKeyOverride = hasActiveAiKey;
export const setGeminiKeyOverride = (key: string) => {
  const current = getDefaultAiConfig();
  saveAiConfig({ ...current, apiKey: key });
};
