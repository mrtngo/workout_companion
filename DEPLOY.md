# Deployment Instructions

## Firebase Deployment

Your app is configured for Firebase deployment with project ID: `trackapp-c7e3a`

### Quick Deploy (Static Pages Only - API routes won't work)

1. Build the app:
   ```bash
   npm run build
   ```

2. Deploy to Firebase:
   ```bash
   firebase deploy --only hosting
   ```

### Full Deployment with API Routes

For Next.js App Router with API routes, consider:

1. **Vercel** (Recommended - Easiest for Next.js):
   - Push to GitHub
   - Go to https://vercel.com
   - Import repository
   - Auto-deploys with full Next.js support

2. **Firebase Functions** (More complex):
   - Requires setting up Firebase Functions
   - API routes need to be converted to Cloud Functions
   - More setup required

### Current Status

✅ Firebase configuration files created:
- `.firebaserc` - Project configuration
- `firebase.json` - Hosting configuration

✅ Build is working
✅ All code committed to git

### Next Steps

1. Verify Firebase project access:
   ```bash
   firebase projects:list
   ```

2. If project doesn't appear, you may need to:
   - Create it in Firebase Console: https://console.firebase.google.com
   - Or use a different project ID

3. Deploy:
   ```bash
   firebase deploy
   ```

