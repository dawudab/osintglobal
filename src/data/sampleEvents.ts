import type { EventDraft, OsintEvent } from '../types';
import { DAY_MS, fuzzTimestamp } from '../utils/opsec';

const SAMPLES: (EventDraft & { hoursAgo: number })[] = [
  { hoursAgo: 0.3, category: 'strike', title: '[DEMO] Drone strike reported near port facilities', locationName: 'Port Sudan, Sudan', lat: 19.6158, lng: 37.2164, summary: 'Local channels report multiple explosions near fuel storage at the southern port. Damage extent and casualties remain unconfirmed.' },
  { hoursAgo: 1.2, category: 'military_movement', title: '[DEMO] Armored column observed moving east', locationName: 'Kharkiv, Ukraine', lat: 49.9935, lng: 36.2304, summary: 'Geolocated footage shows a column of at least 12 armored vehicles on the M03 highway. Direction of travel indicates repositioning toward the front line.' },
  { hoursAgo: 2.1, category: 'civilian', title: '[DEMO] Displacement surge at southern crossing', locationName: 'Rafah, Gaza Strip', lat: 31.2969, lng: 34.2455, summary: 'Aid organizations report a sharp increase in civilians moving toward the crossing. Shelter capacity is described as critically strained.' },
  { hoursAgo: 3.4, category: 'military_movement', title: '[DEMO] Naval group transits Bab el-Mandeb', locationName: 'Bab el-Mandeb Strait', lat: 12.5833, lng: 43.3333, summary: 'AIS data indicates a three-ship naval group transiting northbound. Escort posture suggests heightened maritime threat levels.' },
  { hoursAgo: 4.8, category: 'infrastructure', title: '[DEMO] Regional power grid outage reported', locationName: 'Caracas, Venezuela', lat: 10.4806, lng: -66.9036, summary: 'Large sections of the capital lost power following a transmission line failure. Authorities have not stated a cause or restoration timeline.' },
  { hoursAgo: 6.0, category: 'general', title: '[DEMO] Large protest gathers downtown', locationName: 'São Paulo, Brazil', lat: -23.5505, lng: -46.6333, summary: 'Thousands gathered on Avenida Paulista in a largely peaceful demonstration. Police presence is significant but no clashes are reported.' },
  { hoursAgo: 7.5, category: 'military_movement', title: '[DEMO] Increased air activity over strait', locationName: 'Taiwan Strait', lat: 24.0, lng: 119.5, summary: 'Defense officials logged an elevated number of aircraft crossing the median line. Activity coincides with announced naval exercises.' },
  { hoursAgo: 9.2, category: 'strike', title: '[DEMO] Militant attack on rural checkpoint', locationName: 'Gao, Mali', lat: 16.2717, lng: -0.0447, summary: 'Armed men attacked a security checkpoint on the outskirts of the city. Security forces report the attackers withdrew after an exchange of fire.' },
  { hoursAgo: 12.0, category: 'civilian', title: '[DEMO] Aid convoy reaches besieged town', locationName: 'Mandalay, Myanmar', lat: 21.9588, lng: 96.0891, summary: 'A humanitarian convoy delivered food and medical supplies after a week-long delay. Access for further deliveries remains uncertain.' },
  { hoursAgo: 15.5, category: 'infrastructure', title: '[DEMO] Main port operations suspended', locationName: 'Port-au-Prince, Haiti', lat: 18.5944, lng: -72.3074, summary: 'Port authorities suspended operations citing security threats near the terminal. Fuel and food imports are expected to be disrupted.' },
  { hoursAgo: 18.0, category: 'general', title: '[DEMO] Cyber incident disrupts ministry sites', locationName: 'Tehran, Iran', lat: 35.6892, lng: 51.389, summary: 'Several government websites were offline for several hours following a reported cyberattack. No group has claimed responsibility.' },
  { hoursAgo: 21.0, category: 'strike', title: '[DEMO] Missile intercept reported over city', locationName: 'Haifa, Israel', lat: 32.794, lng: 34.9896, summary: 'Air defense interceptions were observed over the bay area. Initial reports indicate minor damage from falling debris.' },
];

export function buildSampleEvents(now = Date.now()): OsintEvent[] {
  return SAMPLES.map(({ hoursAgo, ...e }, i) => {
    const createdAt = fuzzTimestamp(now - hoursAgo * 3600_000);
    return { ...e, id: `demo-${i}`, createdAt, expiresAt: createdAt + DAY_MS };
  });
}
