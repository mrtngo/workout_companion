# Deployment Instructions

## Firebase Deployment

Your app is configured for Firebase deployment with project ID: `trackapp-c7e3a`

### One-time secret setup

Gemini and Ultrahuman credentials are read by Firebase Functions, not by the
browser or iOS bundle:

```bash
firebase functions:secrets:set GEMINI_API_KEY
firebase functions:secrets:set ULTRAHUMAN_TOKEN
firebase functions:secrets:set ULTRAHUMAN_ACCESS_CODE
```

### Deploy

```bash
npm install
npm --prefix functions install
npm run build
npm run functions:build
firebase deploy --only functions,hosting
```

Firebase Hosting serves the static Next export from `out/`. Requests to
`/api/chat` and `/api/ultrahuman` are rewritten to Cloud Functions.

### Build iOS

```bash
NEXT_PUBLIC_API_BASE_URL=https://trackapp-c7e3a.web.app npm run ios:sync
npm run ios:open
```
