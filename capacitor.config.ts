import type { CapacitorConfig } from "@capacitor/cli";

const serverUrl = process.env.CAPACITOR_SERVER_URL;

const config: CapacitorConfig = {
  appId: "com.tincho.workoutcompanion",
  appName: "Workout Companion",
  webDir: "out",
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
  },
  ...(serverUrl
    ? {
        server: {
          url: serverUrl,
          cleartext: serverUrl.startsWith("http://"),
        },
      }
    : {}),
};

export default config;
