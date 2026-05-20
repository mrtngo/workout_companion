import { Meal, Workout, UserProfile } from "./storage";
import { getCurrentModel, cycleToNextModel, isRateLimitError, resetToFirstModel, AVAILABLE_MODELS } from "./model-cycler";

const generateId = () => Math.random().toString(36).substring(2, 9);

export interface LLMResponse {
    text: string;
    action?: "LOG_WORKOUT" | "LOG_MEAL" | "SUGGESTION";
    data?: any;
}

async function callGeminiWithRetry(
    prompt: string,
    imageData?: { base64: string; mimeType: string },
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
            const parts: any[] = [{ text: prompt }];
            if (imageData) {
                parts.push({ inlineData: { mimeType: imageData.mimeType, data: imageData.base64 } });
            }

            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        contents: [{ parts }],
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
    }, imageData?: { base64: string; mimeType: string }): Promise<LLMResponse> => {
        try {
            let prompt: string;

            if (imageData) {
                const now = new Date().toISOString();
                prompt = `You are a nutrition expert. Look at the food in this image. Identify all dishes/items visible and estimate the total calories, protein, carbs, and fats for the whole meal. Respond ONLY with JSON:
{"action":"LOG_MEAL","data":{"name":"<description>","date":"${now}","calories":N,"protein":N,"carbs":N,"fats":N},"text":"Logged: <description> (N kcal)"}`;
            } else {
                const now = new Date().toISOString();
                const systemPrompt = `You are a fitness and nutrition assistant. Detect and log workouts/meals from user input. Respond ONLY with valid JSON, no extra text.

Current date/time: ${now}

For MEALS: Use your nutrition knowledge to estimate realistic calories, protein, carbs, and fats based on the food and quantity mentioned. For example, 300g of beef ≈ 750 kcal, 69g protein, 0g carbs, 54g fats. Never return 0 for calories if the user mentioned a real food.

For DATES: Extract date/time if mentioned (e.g. "yesterday", "2 hours ago", "at 2pm"). If no date mentioned, use exactly: "${now}".

Meal format: {"action":"LOG_MEAL","data":{"name":"Food description","date":"ISO8601","calories":750,"protein":69,"carbs":0,"fats":54},"text":"Logged: Food (750 kcal)"}
Workout format: {"action":"LOG_WORKOUT","data":{"name":"Workout name","date":"ISO8601","exercises":[{"name":"Exercise","sets":[{"reps":10,"weight":60}]}]},"text":"Logged workout!"}
Other responses: {"text":"Your response"}

Always estimate nutrition realistically — never return 0 calories for real food.`;

                const userContext = context ? `\nContext: ${JSON.stringify({
                    recentWorkouts: context.recentWorkouts?.slice(0, 2) || [],
                    recentMeals: context.recentMeals?.slice(0, 2) || []
                })}` : "";

                prompt = systemPrompt + "\nUser: " + userInput + userContext;
            }

            const response = await callGeminiWithRetry(prompt, imageData);

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

    generateWorkout: async (
        profile: UserProfile | null,
        recentWorkouts: Workout[]
    ): Promise<Workout | null> => {
        try {
            const today = new Date().toISOString().split("T")[0];

            // Trim history to the bits the model needs (name, date, exercises with sets summary)
            const trimmedHistory = (recentWorkouts ?? []).slice(0, 10).map(w => ({
                date: w.date?.split("T")[0],
                name: w.name,
                exercises: w.exercises.map(e => ({
                    name: e.name,
                    sets: e.sets.map(s => ({ reps: s.reps, weight: s.weight, completed: s.completed })),
                })),
            }));

            const prompt = `You are an experienced strength coach designing today's workout for ONE user.

Today: ${today}
User profile: ${JSON.stringify({
                age: profile?.age,
                weight: profile?.weight,
                gender: profile?.gender,
                goal: profile?.goals,
                workoutsPerWeek: profile?.workoutsPerWeek,
            })}
Recent workouts (most recent first, up to 10): ${JSON.stringify(trimmedHistory)}

Design today's session following these rules:
- Pick a logical split based on what was trained recently — do NOT hit the same muscle group as yesterday.
- 3-5 exercises. Compound lifts first, accessories after. Add one core movement if room.
- For each exercise, choose sets and reps appropriate to the user's goal (lose_weight → higher reps 12-15, build_muscle → 6-10, gain_weight → 4-8, maintain/improve_fitness → 8-12).
- For weights: if the user has done this exercise before in the history, base the weight on their last session. If they completed all sets at the target reps, add 2.5kg (progressive overload). If not, keep the weight the same. Use 0 for bodyweight exercises.
- For exercises they have NOT done before, set weight to 0 (they'll fill it in).
- Workout name should describe the focus (e.g. "Upper Body Push", "Leg Day", "Pull & Core").

Respond ONLY with valid JSON, no markdown, no commentary:
{"name":"<workout name>","exercises":[{"name":"<exercise>","sets":[{"reps":N,"weight":N}, ...]}]}`;

            const response = await callGeminiWithRetry(prompt);

            let jsonText = response.text.trim();
            if (jsonText.startsWith("```json")) {
                jsonText = jsonText.replace(/^```json\s*/, "").replace(/\s*```$/, "");
            } else if (jsonText.startsWith("```")) {
                jsonText = jsonText.replace(/^```\s*/, "").replace(/\s*```$/, "");
            }

            type RawSet = { reps?: unknown; weight?: unknown };
            type RawExercise = { name?: unknown; sets?: unknown };
            type RawWorkout = { name?: unknown; exercises?: unknown };

            const parsed = JSON.parse(jsonText) as RawWorkout;
            if (!parsed?.name || !Array.isArray(parsed.exercises) || parsed.exercises.length === 0) {
                return null;
            }

            const exercises = (parsed.exercises as RawExercise[])
                .filter(ex => ex?.name && Array.isArray(ex.sets) && (ex.sets as unknown[]).length > 0)
                .map(ex => ({
                    id: generateId(),
                    name: String(ex.name),
                    sets: (ex.sets as RawSet[]).map(s => ({
                        id: generateId(),
                        reps: Math.max(1, Math.round(Number(s?.reps) || 10)),
                        weight: Math.max(0, Number(s?.weight) || 0),
                        completed: false,
                    })),
                }));

            if (exercises.length === 0) return null;

            return {
                id: generateId(),
                date: new Date().toISOString(),
                name: String(parsed.name),
                exercises,
            };
        } catch (error) {
            console.error("Error generating workout:", error);
            return null;
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
