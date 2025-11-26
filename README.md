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
# Google Gemini API Key
GOOGLE_API_KEY=your_gemini_api_key_here

# Ultrahuman API (optional)
ULTRAHUMAN_TOKEN=your_ultrahuman_token_here
ULTRAHUMAN_ACCESS_CODE=your_ultrahuman_access_code_here

# Firebase Configuration (REQUIRED)
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

**Note:** All Firebase environment variables must start with `NEXT_PUBLIC_` to be accessible in the browser.

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see your app! 🎉

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
