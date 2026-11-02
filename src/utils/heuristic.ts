import type { EventDraft } from '../types';
import { tagsToCategory } from './categories';

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
  [/tbilisi/i, 'Tbilisi, Georgia', 41.7151, 44.8271],
  [/seoul/i, 'Seoul, South Korea', 37.5665, 126.978],
  [/paris/i, 'Paris, France', 48.8566, 2.3522],
  [/berlin/i, 'Berlin, Germany', 52.52, 13.405],
  [/london/i, 'London, United Kingdom', 51.5072, -0.1276],
  [/washington/i, 'Washington, United States', 38.9072, -77.0369],
  [/nairobi/i, 'Nairobi, Kenya', -1.2921, 36.8219],
];

const TAG_RULES: [string, RegExp][] = [
  ['Protest', /protest|demonstrat|march|rally|riot|strike|activist|crowd|dissent|oppos|манифест|протест|مظاهر|احتجاج|protesta/i],
  ['Conflict', /strike|airstrike|missile|drone|explosion|shell|bomb|attack|clash|combat|military|troops|armed|удар|ракет|дрон|взрыв|غارة|قصف|صاروخ|ataque/i],
  ['Tech/Cyber', /cyber|hack|breach|internet|blackout|outage|telecom|ddos|ransomware|surveillance|censorship|server|ai|grid|хакер|интернет|سبراني|إنترنت/i],
  ['Government', /government|ministry|parliament|president|election|policy|sanction|law|court|decree|regime|state|правительств|выбор|حكومة|انتخابات/i],
  ['Human Rights', /human rights|civilian|refugee|displac|humanitarian|aid|hospital|casualt|evacuat|detain|arrest|journalist|prison|беженц|مدنيين|نازحين|حقوق/i],
  ['Election', /election|ballot|vote|voter|polling|referendum|выборы|انتخابات|elecci/i],
  ['Economic Crisis', /inflation|currency|bank|debt|shortage|famine|sanction|tariff|strike|economy|экономик|اقتصاد/i],
];

const URL_RE = /https?:\/\/[^\s<>"')]+/i;

/** Offline fallback when Gemini is unavailable: keyword tagger + gazetteer. */
export function heuristicParse(raw: string): EventDraft {
  const text = raw.replace(/\s+/g, ' ').trim();
  const sourceUrl = text.match(URL_RE)?.[0];
  const clean = text.replace(new RegExp(URL_RE, 'gi'), '').replace(/[#@]\S+/g, '').trim();
  const sentences = clean.split(/(?<=[.!?。])\s+/).filter(Boolean);
  const first = sentences[0] ?? clean;
  const title = first.length > 80 ? first.slice(0, 77).trimEnd() + '…' : first;
  const summary = sentences.slice(0, 3).join(' ').slice(0, 500);

  const matchedTags = TAG_RULES.filter(([, re]) => re.test(text))
    .map(([tag]) => tag)
    .slice(0, 3);
  const tags = matchedTags.length > 0 ? matchedTags : ['Protest'];
  const category = tagsToCategory(tags);
  const hit = GAZETTEER.find(([re]) => re.test(text));

  return {
    title,
    summary,
    category,
    tags,
    locationName: hit?.[1] ?? '',
    lat: hit?.[2] ?? 0,
    lng: hit?.[3] ?? 0,
    sourceUrl,
  };
}
