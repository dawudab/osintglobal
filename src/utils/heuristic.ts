import type { EventCategory, EventDraft } from '../types';

const GAZETTEER: [RegExp, string, number, number][] = [
  [/kyiv|kiev|київ|киев/i, 'Kyiv, Ukraine', 50.4501, 30.5234],
  [/kharkiv|kharkov|харків|харьков/i, 'Kharkiv, Ukraine', 49.9935, 36.2304],
  [/odesa|odessa|одеса|одесса/i, 'Odesa, Ukraine', 46.4825, 30.7233],
  [/zaporizh|запоріжж|запорож/i, 'Zaporizhzhia, Ukraine', 47.8388, 35.1396],
  [/donetsk|донецьк|донецк/i, 'Donetsk, Ukraine', 48.0159, 37.8029],
  [/kherson|херсон/i, 'Kherson, Ukraine', 46.6354, 32.6169],
  [/moscow|москв/i, 'Moscow, Russia', 55.7558, 37.6173],
  [/belgorod|белгород/i, 'Belgorod, Russia', 50.5997, 36.5983],
  [/kursk|курск/i, 'Kursk, Russia', 51.7304, 36.1926],
  [/crimea|sevastopol|крым|севастопол/i, 'Sevastopol, Crimea', 44.6166, 33.5254],
  [/gaza|غزة/i, 'Gaza City, Gaza Strip', 31.5017, 34.4668],
  [/rafah|رفح/i, 'Rafah, Gaza Strip', 31.2969, 34.2455],
  [/khan yunis|خان يونس/i, 'Khan Yunis, Gaza Strip', 31.3402, 34.3063],
  [/beirut|بيروت/i, 'Beirut, Lebanon', 33.8938, 35.5018],
  [/damascus|دمشق/i, 'Damascus, Syria', 33.5138, 36.2765],
  [/aleppo|حلب/i, 'Aleppo, Syria', 36.2021, 37.1343],
  [/idlib|إدلب|ادلب/i, 'Idlib, Syria', 35.9306, 36.6339],
  [/baghdad|بغداد/i, 'Baghdad, Iraq', 33.3152, 44.3661],
  [/erbil|أربيل|اربيل/i, 'Erbil, Iraq', 36.1911, 44.0092],
  [/tehran|طهران|تهران/i, 'Tehran, Iran', 35.6892, 51.389],
  [/sanaa|sana'a|صنعاء/i, "Sana'a, Yemen", 15.3694, 44.191],
  [/hodeidah|الحديدة/i, 'Hodeidah, Yemen', 14.7978, 42.9545],
  [/aden|عدن/i, 'Aden, Yemen', 12.7855, 45.0187],
  [/red sea|البحر الأحمر/i, 'Red Sea', 20.0, 38.5],
  [/port sudan|بورتسودان|بور سودان/i, 'Port Sudan, Sudan', 19.6158, 37.2164],
  [/khartoum|الخرطوم/i, 'Khartoum, Sudan', 15.5007, 32.5599],
  [/el fasher|al-fashir|الفاشر/i, 'El Fasher, Sudan', 13.6279, 25.3494],
  [/tripoli|طرابلس/i, 'Tripoli, Libya', 32.8872, 13.1913],
  [/jerusalem|القدس/i, 'Jerusalem', 31.7683, 35.2137],
  [/tel aviv|تل أبيب/i, 'Tel Aviv, Israel', 32.0853, 34.7818],
  [/haifa|حيفا/i, 'Haifa, Israel', 32.794, 34.9896],
  [/caracas/i, 'Caracas, Venezuela', 10.4806, -66.9036],
  [/bogot[aá]/i, 'Bogotá, Colombia', 4.711, -74.0721],
  [/s[aã]o paulo/i, 'São Paulo, Brazil', -23.5505, -46.6333],
  [/rio de janeiro/i, 'Rio de Janeiro, Brazil', -22.9068, -43.1729],
  [/bras[ií]lia/i, 'Brasília, Brazil', -15.7939, -47.8828],
  [/buenos aires/i, 'Buenos Aires, Argentina', -34.6037, -58.3816],
  [/ciudad de m[eé]xico|mexico city/i, 'Mexico City, Mexico', 19.4326, -99.1332],
  [/culiac[aá]n/i, 'Culiacán, Mexico', 24.8091, -107.394],
  [/port-au-prince/i, 'Port-au-Prince, Haiti', 18.5944, -72.3074],
  [/lima\b/i, 'Lima, Peru', -12.0464, -77.0428],
  [/taipei|taiwan strait/i, 'Taipei, Taiwan', 25.033, 121.5654],
  [/pyongyang/i, 'Pyongyang, North Korea', 39.0392, 125.7625],
  [/bamako/i, 'Bamako, Mali', 12.6392, -8.0029],
  [/goma/i, 'Goma, DR Congo', -1.6585, 29.2203],
  [/mogadishu|مقديشو/i, 'Mogadishu, Somalia', 2.0469, 45.3182],
  [/kabul|كابل/i, 'Kabul, Afghanistan', 34.5553, 69.2075],
];

const CATEGORY_RULES: [EventCategory, RegExp][] = [
  ['strike', /strike|airstrike|missile|drone|explosion|shell|bomb|attack|удар|ракет|дрон|взрыв|обстрел|атак|غارة|قصف|صاروخ|انفجار|مسيرة|ataque|bombarde|explos|míssil|misil|dron/i],
  ['military_movement', /column|convoy|troops|deploy|warship|naval|armou?r|tank|mobiliz|колонн|войск|техник|танк|флот|رتل|قوات|دبابات|انتشار|tropas|blindad|despliegue|navio|buque/i],
  ['infrastructure', /power|grid|outage|blackout|bridge|pipeline|refinery|port|dam|substation|энерг|свет|мост|нпз|подстанц|كهرباء|جسر|مصفاة|ميناء|apag[aã]o|energ[ií]a|puente|ponte|refin/i],
  ['civilian', /civilian|refugee|displac|humanitarian|aid|hospital|casualt|evacuat|мирн|беженц|эвакуац|больниц|مدنيين|نازحين|لاجئين|مستشفى|إنسانية|civis|civiles|refugiad|desplazad|humanit/i],
];

const URL_RE = /https?:\/\/[^\s<>"')]+/i;

/** Offline fallback when Gemini is unavailable: keyword categorization + small gazetteer. */
export function heuristicParse(raw: string): EventDraft {
  const text = raw.replace(/\s+/g, ' ').trim();
  const sourceUrl = text.match(URL_RE)?.[0];
  const clean = text.replace(new RegExp(URL_RE, 'gi'), '').replace(/[#@]\S+/g, '').trim();
  const sentences = clean.split(/(?<=[.!?。])\s+/).filter(Boolean);
  const first = sentences[0] ?? clean;
  const title = first.length > 60 ? first.slice(0, 57).trimEnd() + '…' : first;
  const summary = sentences.slice(0, 2).join(' ').slice(0, 400);
  const category = CATEGORY_RULES.find(([, re]) => re.test(text))?.[0] ?? 'general';
  const hit = GAZETTEER.find(([re]) => re.test(text));
  return {
    title,
    summary,
    category,
    locationName: hit?.[1] ?? '',
    lat: hit?.[2] ?? 0,
    lng: hit?.[3] ?? 0,
    sourceUrl,
  };
}
