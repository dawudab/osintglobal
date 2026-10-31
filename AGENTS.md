# CENTCOM // OSINT Tracker

- Dev: `npm run dev` → http://localhost:5280 (fixed `strictPort`; another local project uses 5173). Needs `.env`; Firebase config has hardcoded fallbacks
- `three` is pinned with an npm `overrides` entry so globe.gl and three-globe share ONE copy — duplicate three instances make the globe render blank
- Verify: `npx tsc -b` (must be zero errors) and `npm run build`
- Firestore rules live in `firestore.rules` (deploy via Firebase console or `firebase deploy --only firestore:rules`)
- Gemini: `gemini-2.5-flash` with fallback to `gemini-flash-latest` (the provided key gets 404 on 2.5-flash); heuristic parser in `src/utils/heuristic.ts` if both fail
- OPSEC invariants: no analytics/cookies on `/`; Firestore docs contain only `OsintEvent` schema fields; `createdAt` floored to the minute; images re-encoded via canvas (`src/utils/opsec.ts`)
