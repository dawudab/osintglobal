# osintglobal

Mobile-first, zero-trace 3D OSINT global event tracker (React + Vite + TypeScript + Tailwind + react-globe.gl + Firebase), with a passphrase-gated operator console and Gemini AI co-pilot.

- `/` — public 3D globe HUD with live 24h events
- `/ops-console` — zero-PII operator console (AI translate/summarize/geolocate, URL sanitizer, EXIF scrubber)

## Setup

```sh
npm install
cp .env.example .env   # then fill in real values
npm run dev            # http://localhost:5280
```

Deploy `firestore.rules` to enforce the anonymous event schema server-side.
