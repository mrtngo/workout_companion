# Workout Companion App - Setup Instructions

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use an existing one)
3. Enable **Authentication**:
   - Go to Authentication > Sign-in method
   - Enable **Email/Password** and **Google** sign-in providers
4. Create a **Firestore Database**:
   - Go to Firestore Database > Create database
   - Start in **test mode** for MVP (you can add security rules later)
5. Get your Firebase config:
   - Go to Project Settings > General
   - Scroll down to "Your apps" and click the web icon (</>)
   - Copy the config values

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory (see `.env.example` for reference):

```env
# Firebase Configuration (REQUIRED)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Required when building the bundled iOS app.
# Use your Firebase Hosting URL so the app can call /api/chat and /api/ultrahuman.
NEXT_PUBLIC_API_BASE_URL=https://your-project.web.app
```

**Note:** All Firebase environment variables must start with `NEXT_PUBLIC_` to be accessible in the browser.
Gemini and Ultrahuman secrets are stored as Firebase Functions secrets instead
of browser environment variables.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app! 🎉

## 📱 iOS App

This project includes a Capacitor iOS shell. The Next app is exported as static
files and bundled into the native iOS project, while `/api/chat` and
`/api/ultrahuman` run as Firebase HTTPS functions so secrets stay off-device.

### One-time setup

```bash
npm install
firebase functions:secrets:set GEMINI_API_KEY
firebase functions:secrets:set ULTRAHUMAN_TOKEN
firebase functions:secrets:set ULTRAHUMAN_ACCESS_CODE
npm run ios:sync
```

### Build the bundled iOS app

Build with your Firebase Hosting URL as the API base. The URL is public and is
baked into the static client bundle; the actual Gemini and Ultrahuman secrets
remain in Firebase Functions.

```bash
NEXT_PUBLIC_API_BASE_URL=https://your-project.web.app npm run ios:sync
npm run ios:open
```

From Xcode, select a simulator or physical device and press Run.

### Deploy the backend and web app

```bash
npm run build
firebase deploy --only functions,hosting
```

### Useful commands

```bash
npm run build            # export static Next files to out/
npm run functions:build  # type-check and compile Firebase Functions
npm run ios:sync         # build static files and copy them into iOS
npm run ios:open         # open the Xcode workspace
npm run ios:run          # sync, then run from the Capacitor CLI
```

## ✨ Features

- **User Authentication**: Sign in with Google or email/password
- **Cloud Data Storage**: All data persists in Firebase Firestore
- **User-Scoped Data**: Each user has their own private workout and nutrition data
- **AI-Powered Chat**: Natural language logging for workouts and meals
- **Ultrahuman Integration**: View sleep, recovery, and activity metrics
- **Workout Tracking**: Log exercises, sets, reps, and weights
- **Nutrition Tracking**: Log meals with automatic macro estimation
- **Daily Suggestions**: AI-generated workout recommendations

## 📱 Using the App

### Quick Log (Dashboard)
Type natural language like:
- "I ate a banana"
- "I did 3 sets of 10 pushups"

### AI Assistant
Chat with the AI to:
- Log workouts: "I did 5 sets of squats"
- Log meals: "I ate chicken and rice"
- Ask questions: "How do I do a bench press?"
- Get suggestions: "What should I work out today?"

### Ultrahuman Data
Your health metrics from Ultrahuman Ring will automatically appear on the dashboard if configured.

## 🔧 Troubleshooting

- **Authentication not working:** Make sure all Firebase env variables are set and start with `NEXT_PUBLIC_`
- **Can't sign in:** Verify that Email/Password and Google sign-in are enabled in Firebase Console
- **Data not saving:** Check that Firestore is created and in test mode (or security rules allow writes)
- **No AI responses:** Check that your Gemini API key is configured correctly
- **No Ultrahuman data:** Check that your token and access code are correct
- **Server not starting:** Run `npm install` again

## 💡 Tips

- The app uses **Gemini 1.5 Flash** for fast, intelligent responses
- All data is stored in **Firebase Firestore** and scoped to each user
- You can sign out using the logout button in the top right of the home page
- Ultrahuman data refreshes when you reload the dashboard

## 🔒 Security Notes

- For production, update Firestore security rules to restrict access to user's own data
- Example security rule:
  ```
  match /users/{userId}/{document=**} {
    allow read, write: if request.auth != null && request.auth.uid == userId;
  }
  ```
