import { logger } from "firebase-functions";
import { defineSecret } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";

type Meal = {
  id?: string;
  name: string;
  date: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
};

type Workout = {
  id?: string;
  name: string;
  date: string;
  exercises: Array<{
    name: string;
    sets: Array<{
      reps: number;
      weight?: number;
    }>;
  }>;
};

type LLMResponse = {
  text: string;
  action?: "LOG_WORKOUT" | "LOG_MEAL" | "SUGGESTION";
  data?: unknown;
};

type ImageData = {
  base64: string;
  mimeType: string;
};

type ChatContext = {
  recentWorkouts?: Workout[];
  recentMeals?: Meal[];
  ultrahumanData?: unknown;
};

type UltrahumanData = {
  sleep?: {
    score: number;
    duration: number;
    deepSleep: number;
    remSleep: number;
  };
  recovery?: {
    score: number;
    hrv: number;
    restingHr: number;
  };
  activity?: {
    steps: number;
    calories: number;
    activeMinutes: number;
  };
};

const geminiApiKey = defineSecret("GEMINI_API_KEY");
const ultrahumanToken = defineSecret("ULTRAHUMAN_TOKEN");
const ultrahumanAccessCode = defineSecret("ULTRAHUMAN_ACCESS_CODE");

const availableModels = [
  "gemini-2.0-flash-lite",
  "gemini-2.0-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash-tts",
  "gemini-2.5-flash",
  "gemini-2.5-pro",
] as const;

const ultrahumanApiBase = "https://api.ultrahuman.com/v1";

function isRateLimitError(error: unknown): boolean {
  const maybeError = error as {
    message?: string;
    code?: number | string;
    status?: number | string;
    statusCode?: number | string;
  };
  const message = String(maybeError?.message || error || "").toLowerCase();
  const code = maybeError?.code || maybeError?.status || maybeError?.statusCode;

  return (
    code === 429 ||
    code === "RESOURCE_EXHAUSTED" ||
    message.includes("rate limit") ||
    message.includes("quota") ||
    message.includes("resource_exhausted") ||
    message.includes("429") ||
    message.includes("too many requests")
  );
}

async function callGeminiWithRetry(
  apiKey: string,
  prompt: string,
  imageData?: ImageData
): Promise<{ text: string }> {
  let lastError: unknown = null;

  for (const model of availableModels) {
    try {
      const parts: Array<{ text: string } | { inlineData: ImageData }> = [{ text: prompt }];
      if (imageData) {
        parts.push({ inlineData: imageData });
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts }],
            safetySettings: [
              {
                category: "HARM_CATEGORY_HARASSMENT",
                threshold: "BLOCK_NONE",
              },
              {
                category: "HARM_CATEGORY_HATE_SPEECH",
                threshold: "BLOCK_NONE",
              },
              {
                category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                threshold: "BLOCK_NONE",
              },
              {
                category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                threshold: "BLOCK_NONE",
              },
              {
                category: "HARM_CATEGORY_CIVIC_INTEGRITY",
                threshold: "BLOCK_NONE",
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        const error = new Error(errorBody?.error?.message || `HTTP ${response.status}`) as Error & {
          code?: number;
          status?: number;
        };
        error.code = response.status;
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      return {
        text: data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "",
      };
    } catch (error) {
      lastError = error;
      logger.warn("Gemini model call failed", {
        model,
        error: error instanceof Error ? error.message : String(error),
      });

      if (!isRateLimitError(error)) {
        throw error;
      }
    }
  }

  throw lastError || new Error("Failed after all Gemini model retries");
}

async function processInput(
  apiKey: string,
  userInput: string,
  context?: ChatContext,
  imageData?: ImageData,
  language: string = "en"
): Promise<LLMResponse> {
  let prompt: string;

  const targetLang = language === "es" ? "Spanish (ES)" : "English (EN)";

  if (imageData) {
    const now = new Date().toISOString();
    prompt = `You are a nutrition expert. Look at the food in this image. Identify all dishes/items visible and estimate the total calories, protein, carbs, and fats for the whole meal. Respond in ${targetLang}. Respond ONLY with JSON:
{"action":"LOG_MEAL","data":{"name":"<description>","date":"${now}","calories":N,"protein":N,"carbs":N,"fats":N},"text":"Logged: <description> (N kcal)"}`;
  } else {
    const now = new Date().toISOString();
    const systemPrompt = `You are a fitness, nutrition, and general assistant. Detect and log workouts/meals from user input, or answer questions naturally on any topic including training, meals, recovery, health, or general subjects. Respond ONLY with valid JSON, no extra text.

Current date/time: ${now}

Respond in the user's preferred language: ${targetLang}.

For MEALS: Use your nutrition knowledge to estimate realistic calories, protein, carbs, and fats based on the food and quantity mentioned. For example, 300g of beef ≈ 750 kcal, 69g protein, 0g carbs, 54g fats. Never return 0 for calories if the user mentioned a real food.

For DATES: Extract date/time if mentioned (e.g. "yesterday", "2 hours ago", "at 2pm"). If no date mentioned, use exactly: "${now}".

Meal format: {"action":"LOG_MEAL","data":{"name":"Food description","date":"ISO8601","calories":750,"protein":69,"carbs":0,"fats":54},"text":"Logged: Food (750 kcal)"}
Workout format: {"action":"LOG_WORKOUT","data":{"name":"Workout name","date":"ISO8601","exercises":[{"name":"Exercise","sets":[{"reps":10,"weight":60}]}]},"text":"Logged workout!"}
Other responses (general conversation or QA): {"text":"Your response"}

Always estimate nutrition realistically -- never return 0 calories for real food. Keep responses helpful, natural, and friendly.`;

    const userContext = context
      ? `\nContext: ${JSON.stringify({
          recentWorkouts: context.recentWorkouts?.slice(0, 2) || [],
          recentMeals: context.recentMeals?.slice(0, 2) || [],
        })}`
      : "";

    prompt = `${systemPrompt}\nUser: ${userInput}${userContext}`;
  }

  const response = await callGeminiWithRetry(apiKey, prompt, imageData);
  const responseText = response.text;

  try {
    let jsonText = responseText.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }
    return JSON.parse(jsonText) as LLMResponse;
  } catch {
    return { text: responseText };
  }
}

async function fetchUltrahumanData(token: string, accessCode: string): Promise<UltrahumanData> {
  const requestHeaders = {
    Authorization: `Bearer ${token}`,
    "x-access-code": accessCode,
  };

  const [sleepResponse, recoveryResponse, activityResponse] = await Promise.all([
    fetch(`${ultrahumanApiBase}/sleep/latest`, { headers: requestHeaders }),
    fetch(`${ultrahumanApiBase}/recovery/latest`, { headers: requestHeaders }),
    fetch(`${ultrahumanApiBase}/activity/latest`, { headers: requestHeaders }),
  ]);

  const data: UltrahumanData = {};

  if (sleepResponse.ok) {
    const sleepData = await sleepResponse.json();
    data.sleep = {
      score: sleepData.score || 0,
      duration: sleepData.duration_hours || 0,
      deepSleep: sleepData.deep_sleep_minutes || 0,
      remSleep: sleepData.rem_sleep_minutes || 0,
    };
  }

  if (recoveryResponse.ok) {
    const recoveryData = await recoveryResponse.json();
    data.recovery = {
      score: recoveryData.score || 0,
      hrv: recoveryData.hrv || 0,
      restingHr: recoveryData.resting_heart_rate || 0,
    };
  }

  if (activityResponse.ok) {
    const activityData = await activityResponse.json();
    data.activity = {
      steps: activityData.steps || 0,
      calories: activityData.calories_burned || 0,
      activeMinutes: activityData.active_minutes || 0,
    };
  }

  return data;
}

export const chat = onRequest(
  {
    cors: true,
    region: "us-central1",
    secrets: [geminiApiKey],
  },
  async (request, response) => {
    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }

    if (request.method !== "POST") {
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const { input, context, imageData, language } = request.body || {};

      if (!input && !imageData) {
        response.status(400).json({ error: "Input or imageData is required" });
        return;
      }

      const apiKey = geminiApiKey.value();
      if (!apiKey) {
        response.status(500).json({ error: "GEMINI_API_KEY is not configured" });
        return;
      }

      const result = await processInput(
        apiKey,
        input || "Analyze this meal photo",
        context,
        imageData,
        language
      );
      response.json(result);
    } catch (error) {
      logger.error("Error in chat function", error);
      response.status(500).json({ error: "Internal server error" });
    }
  }
);

export const ultrahuman = onRequest(
  {
    cors: true,
    region: "us-central1",
    secrets: [ultrahumanToken, ultrahumanAccessCode],
  },
  async (request, response) => {
    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }

    if (request.method !== "GET") {
      response.status(405).json({ error: "Method not allowed" });
      return;
    }

    try {
      const token = ultrahumanToken.value();
      const accessCode = ultrahumanAccessCode.value();

      if (!token || !accessCode) {
        response.status(500).json({ error: "Ultrahuman credentials not configured" });
        return;
      }

      const data = await fetchUltrahumanData(token, accessCode);
      response.json(data);
    } catch (error) {
      logger.error("Error in Ultrahuman function", error);
      response.status(500).json({ error: "Failed to fetch Ultrahuman data" });
    }
  }
);
