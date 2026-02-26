import { Meal, Workout } from "./storage";
import { getCurrentModel, cycleToNextModel, isRateLimitError, resetToFirstModel, AVAILABLE_MODELS } from "./model-cycler";

export interface LLMResponse {
    text: string;
    action?: "LOG_WORKOUT" | "LOG_MEAL" | "SUGGESTION";
    data?: any;
}

async function callGeminiWithRetry(
    prompt: string,
    maxRetries: number = AVAILABLE_MODELS.length
): Promise<{ text: string }> {
    let lastError: any = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const currentModel = getCurrentModel();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not set");
        }

        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: prompt }] }],
                    }),
                }
            );

            if (!res.ok) {
                const errBody = await res.json().catch(() => ({}));
                const err: any = new Error(errBody?.error?.message || `HTTP ${res.status}`);
                err.code = res.status;
                err.status = res.status;
                throw err;
            }

            const data = await res.json();
            const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
            resetToFirstModel();
            return { text };
        } catch (error: any) {
            lastError = error;
            console.error(`Gemini error (model: ${currentModel}):`, error?.message);

            if (isRateLimitError(error)) {
                cycleToNextModel();
                if (attempt === maxRetries - 1) {
                    resetToFirstModel();
                    throw error;
                }
                continue;
            }

            throw error;
        }
    }

    throw lastError || new Error("Failed after all retries");
}

export const llmService = {
    processInput: async (userInput: string, context?: {
        recentWorkouts?: Workout[];
        recentMeals?: Meal[];
        ultrahumanData?: any;
    }): Promise<LLMResponse> => {
        try {
            const systemPrompt = `Fitness assistant. Detect and log workouts/meals. Extract date/time from user input if mentioned (e.g., "yesterday", "2 hours ago", "at 2pm"). If no date/time is mentioned, use current timestamp. Respond ONLY with valid JSON, no extra text.

Workout format: {"action":"LOG_WORKOUT","data":{"name":"Name","date":"ISO8601","exercises":[{"name":"Exercise","sets":[{"reps":10,"weight":0}]}]},"text":"Logged!"}
Meal format: {"action":"LOG_MEAL","data":{"name":"Food","date":"ISO8601","calories":100,"protein":5,"carbs":20,"fats":3},"text":"Logged: Food (100 kcal)"}
Date format: ISO8601 string. If user mentions "yesterday", "2 hours ago", "at 2pm", etc., calculate the date. If no date mentioned, use current exact timestamp.
Other: {"text":"Your response"}`;

            const userContext = context ? `\nContext: ${JSON.stringify({
                recentWorkouts: context.recentWorkouts?.slice(0, 2) || [],
                recentMeals: context.recentMeals?.slice(0, 2) || []
            })}` : "";

            const response = await callGeminiWithRetry(
                systemPrompt + "\nUser: " + userInput + userContext
            );

            const responseText = response.text;

            try {
                let jsonText = responseText.trim();
                if (jsonText.startsWith("```json")) {
                    jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
                } else if (jsonText.startsWith("```")) {
                    jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
                }
                return JSON.parse(jsonText);
            } catch {
                return { text: responseText };
            }
        } catch (error) {
            console.error("Error calling Gemini:", error);
            return {
                text: "Sorry, I'm having trouble processing your request right now. Please try again.",
            };
        }
    },

    generateSuggestion: async (context?: {
        recentWorkouts?: Workout[];
        recentMeals?: Meal[];
        ultrahumanData?: any;
    }): Promise<string> => {
        try {
            const systemPrompt = `You are a fitness coach. Generate a short, personalized workout suggestion based on the user's context. Keep it to 1-2 sentences. Use markdown bold (**text**) for emphasis.`;
            const userContext = context ? JSON.stringify(context, null, 2) : "No context available";
            const response = await callGeminiWithRetry(
                systemPrompt + "\n\nGenerate a workout suggestion based on this context:\n" + userContext
            );
            return response.text || "Time for a workout!";
        } catch (error) {
            console.error("Error generating suggestion:", error);
            return "Time for a great workout today!";
        }
    },
};
