import { Meal, Workout, Exercise, WorkoutSet, UserProfile } from "./storage";

// Mock database for nutrition estimation
const FOOD_DATABASE: Record<string, { calories: number; protein: number; carbs: number; fats: number }> = {
    apple: { calories: 95, protein: 0.5, carbs: 25, fats: 0.3 },
    banana: { calories: 105, protein: 1.3, carbs: 27, fats: 0.3 },
    chicken: { calories: 165, protein: 31, carbs: 0, fats: 3.6 },
    "chicken breast": { calories: 165, protein: 31, carbs: 0, fats: 3.6 },
    rice: { calories: 130, protein: 2.7, carbs: 28, fats: 0.3 },
    egg: { calories: 78, protein: 6, carbs: 0.6, fats: 5 },
    salad: { calories: 150, protein: 5, carbs: 10, fats: 10 },
    pizza: { calories: 285, protein: 12, carbs: 36, fats: 10 },
    burger: { calories: 500, protein: 25, carbs: 40, fats: 25 },
};

// Simple UUID generator
const generateId = () => Math.random().toString(36).substring(2, 9);

export type MuscleGroup = "push" | "pull" | "legs" | "core" | "cardio" | "other";

const MUSCLE_GROUP_KEYWORDS: Array<{ group: MuscleGroup; keywords: string[] }> = [
    { group: "push", keywords: ["bench", "push-up", "pushup", "push up", "overhead press", "shoulder press", "dip", "tricep", "chest fly"] },
    { group: "pull", keywords: ["pull-up", "pullup", "pull up", "row", "lat pulldown", "pulldown", "face pull", "curl", "bicep"] },
    { group: "legs", keywords: ["squat", "deadlift", "lunge", "leg press", "calf", "hip thrust", "glute", "romanian"] },
    { group: "core", keywords: ["plank", "crunch", "sit-up", "situp", "russian twist", "leg raise", "ab "] },
    { group: "cardio", keywords: ["burpee", "mountain climber", "jumping jack", "high knee", "run", "jog", "sprint", "cycling", "rowing machine"] },
];

export const muscleGroupOf = (name: string): MuscleGroup => {
    const lower = name.toLowerCase();
    for (const { group, keywords } of MUSCLE_GROUP_KEYWORDS) {
        if (keywords.some(k => lower.includes(k))) return group;
    }
    return "other";
};

// Most recent matching entry across history, by exercise name (case-insensitive)
const findLastExerciseEntry = (workouts: Workout[] | undefined, name: string): Exercise | null => {
    if (!workouts) return null;
    const target = name.toLowerCase();
    for (const w of workouts) {
        const match = w.exercises.find(e => e.name.toLowerCase() === target);
        if (match) return match;
    }
    return null;
};

// Parse date from text, returns ISO string or null if no date found
const parseDateFromText = (text: string): string | null => {
    const lowerText = text.toLowerCase();
    const now = new Date();
    
    // Check for relative time references
    if (lowerText.includes("yesterday")) {
        const date = new Date(now);
        date.setDate(date.getDate() - 1);
        return date.toISOString();
    }
    
    if (lowerText.includes("today") || lowerText.includes("just now")) {
        return now.toISOString();
    }
    
    // Check for "X hours ago" or "X minutes ago"
    const hoursAgoMatch = lowerText.match(/(\d+)\s*hours?\s*ago/);
    if (hoursAgoMatch) {
        const hours = parseInt(hoursAgoMatch[1]);
        const date = new Date(now);
        date.setHours(date.getHours() - hours);
        return date.toISOString();
    }
    
    const minutesAgoMatch = lowerText.match(/(\d+)\s*minutes?\s*ago/);
    if (minutesAgoMatch) {
        const minutes = parseInt(minutesAgoMatch[1]);
        const date = new Date(now);
        date.setMinutes(date.getMinutes() - minutes);
        return date.toISOString();
    }
    
    // Check for time of day (e.g., "at 2pm", "at 14:30")
    const timeMatch = lowerText.match(/(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/);
    if (timeMatch) {
        const date = new Date(now);
        let hours = parseInt(timeMatch[1]);
        const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
        const period = timeMatch[3]?.toLowerCase();
        
        if (period === "pm" && hours !== 12) hours += 12;
        if (period === "am" && hours === 12) hours = 0;
        
        date.setHours(hours, minutes, 0, 0);
        // If the time is in the future, assume it was yesterday
        if (date > now) {
            date.setDate(date.getDate() - 1);
        }
        return date.toISOString();
    }
    
    // Check for date patterns (e.g., "on January 15", "on 2024-01-15")
    const datePatternMatch = lowerText.match(/(?:on\s+)?(\d{4})-(\d{2})-(\d{2})/);
    if (datePatternMatch) {
        const year = parseInt(datePatternMatch[1]);
        const month = parseInt(datePatternMatch[2]) - 1;
        const day = parseInt(datePatternMatch[3]);
        const date = new Date(year, month, day);
        // Use current time for that date
        const now = new Date();
        date.setHours(now.getHours(), now.getMinutes(), now.getSeconds());
        return date.toISOString();
    }
    
    // No date found, return null to use current time
    return null;
};

// Get date for logging - uses parsed date if found, otherwise current exact timestamp
const getLogDate = (text: string): string => {
    const parsedDate = parseDateFromText(text);
    return parsedDate || new Date().toISOString();
};

export interface AIResponse {
    text: string;
    action?: "LOG_WORKOUT" | "LOG_MEAL" | "SUGGESTION";
    data?: any;
}

export const aiLogic = {
    estimateNutrition: (text: string): Meal | null => {
        const lowerText = text.toLowerCase();
        let foundFood = null;
        let multiplier = 1;

        // Simple quantity detection (very basic)
        if (lowerText.includes("2 ") || lowerText.includes("two ")) multiplier = 2;
        if (lowerText.includes("3 ") || lowerText.includes("three ")) multiplier = 3;

        for (const [food, macros] of Object.entries(FOOD_DATABASE)) {
            if (lowerText.includes(food)) {
                foundFood = { name: food, ...macros };
                break;
            }
        }

        if (!foundFood) return null;

        return {
            id: generateId(),
            date: getLogDate(text),
            name: foundFood.name.charAt(0).toUpperCase() + foundFood.name.slice(1),
            calories: foundFood.calories * multiplier,
            protein: foundFood.protein * multiplier,
            carbs: foundFood.carbs * multiplier,
            fats: foundFood.fats * multiplier,
        };
    },

    parseWorkout: (text: string): Workout | null => {
        const lowerText = text.toLowerCase();

        // Very basic parsing logic
        // Expected format: "I did [sets] sets of [reps] [exercise]"
        // e.g., "I did 3 sets of 10 pushups"

        const setsMatch = lowerText.match(/(\d+)\s*sets?/);
        const repsMatch = lowerText.match(/(\d+)\s*reps?/);
        // Try to find exercise name by removing common words
        let exerciseName = lowerText
            .replace(/i did/g, "")
            .replace(/sets? of/g, "")
            .replace(/reps?/g, "")
            .replace(/\d+/g, "")
            .trim();

        if (!exerciseName) exerciseName = "Workout";

        const setsCount = setsMatch ? parseInt(setsMatch[1]) : 3;
        const repsCount = repsMatch ? parseInt(repsMatch[1]) : 10;

        const sets: WorkoutSet[] = [];
        for (let i = 0; i < setsCount; i++) {
            sets.push({
                id: generateId(),
                reps: repsCount,
                weight: 0, // Default to 0 for now
                completed: true,
            });
        }

        const exercise: Exercise = {
            id: generateId(),
            name: exerciseName.charAt(0).toUpperCase() + exerciseName.slice(1),
            sets: sets,
        };

        return {
            id: generateId(),
            date: getLogDate(text),
            name: "AI Logged Workout",
            exercises: [exercise],
        };
    },

    generateSuggestion: (): string => {
        const suggestions = [
            "Based on your recent activity, I recommend a **Full Body Workout** today. Focus on compound movements like Squats and Pushups.",
            "You haven't done cardio in a while. How about a **30-minute run**?",
            "It's been a heavy week. Maybe try some **Yoga or Stretching** today?",
            "Time for **Leg Day**! Let's aim for 4 sets of Squats and Lunges.",
        ];
        return suggestions[Math.floor(Math.random() * suggestions.length)];
    },

    suggestWorkoutFromHistory: (workouts: Workout[], profile?: UserProfile | null): Workout | null => {
        const goalReps = profile?.goals === "build_muscle" ? 8 :
                         profile?.goals === "lose_weight" ? 15 :
                         profile?.goals === "gain_weight" ? 6 : 12;
        const goalSets = profile?.workoutsPerWeek && profile.workoutsPerWeek >= 4 ? 4 : 3;

        // Group → ordered list of exercises (compound first), tuned per goal
        const groupExercises: Record<MuscleGroup, string[]> = {
            push: profile?.goals === "lose_weight"
                ? ["Push-ups", "Burpees", "Overhead Press", "Bench Press"]
                : ["Bench Press", "Overhead Press", "Push-ups", "Dips"],
            pull: ["Pull-ups", "Rows", "Lat Pulldown", "Face Pulls"],
            legs: profile?.goals === "lose_weight"
                ? ["Squats", "Lunges", "Jumping Jacks", "Mountain Climbers"]
                : ["Squats", "Deadlifts", "Lunges", "Romanian Deadlifts"],
            core: ["Planks", "Hanging Leg Raises", "Russian Twists"],
            cardio: ["Burpees", "Mountain Climbers", "Jumping Jacks", "High Knees"],
            other: ["Push-ups", "Squats", "Planks"],
        };

        const pickGroupForToday = (): MuscleGroup => {
            // Avoid groups hit in the most recent workout (and yesterday's if there is one)
            const today = new Date().toISOString().split('T')[0];
            const lastWorkouts = (workouts ?? []).filter(w => w.date && w.date.split('T')[0] !== today).slice(0, 2);
            const recentGroups = new Set<MuscleGroup>();
            lastWorkouts.forEach(w => w.exercises.forEach(e => recentGroups.add(muscleGroupOf(e.name))));

            const goalOrder: MuscleGroup[] = profile?.goals === "lose_weight"
                ? ["cardio", "legs", "push", "pull", "core"]
                : profile?.goals === "build_muscle" || profile?.goals === "gain_weight"
                ? ["push", "pull", "legs", "core", "cardio"]
                : ["push", "legs", "pull", "core", "cardio"];

            return goalOrder.find(g => !recentGroups.has(g)) ?? goalOrder[0];
        };

        // Build progressive-overload set for an exercise based on history
        const buildSetsFor = (name: string): WorkoutSet[] => {
            const lastEntry = findLastExerciseEntry(workouts, name);
            const setsCount = lastEntry ? Math.max(lastEntry.sets.length, goalSets) : goalSets;
            const targetReps = lastEntry?.sets[0]?.reps ?? goalReps;
            const lastWeight = lastEntry?.sets[0]?.weight ?? 0;
            const allCompleted = lastEntry?.sets.every(s => s.completed) ?? false;

            // Progressive overload: +2.5kg if all sets completed at target reps, else hold
            const nextWeight = lastWeight > 0 && allCompleted
                ? Math.round((lastWeight + 2.5) * 2) / 2
                : lastWeight;

            return Array.from({ length: setsCount }, () => ({
                id: generateId(),
                reps: targetReps,
                weight: nextWeight,
                completed: false,
            }));
        };

        const targetGroup = pickGroupForToday();
        const candidatePool = groupExercises[targetGroup];

        // Prefer exercises the user has actually done before (so weights are real); fall back to canonical list
        const userExercises = new Set<string>();
        (workouts ?? []).slice(0, 15).forEach(w => w.exercises.forEach(e => {
            if (muscleGroupOf(e.name) === targetGroup) userExercises.add(e.name);
        }));

        const chosen: string[] = [];
        userExercises.forEach(n => { if (chosen.length < 2) chosen.push(n); });
        for (const name of candidatePool) {
            if (chosen.length >= 3) break;
            if (!chosen.some(c => c.toLowerCase() === name.toLowerCase())) chosen.push(name);
        }

        // Add a core finisher unless we already have one
        if (!chosen.some(c => muscleGroupOf(c) === "core")) {
            chosen.push("Planks");
        }

        const exercises: Exercise[] = chosen.map(name => ({
            id: generateId(),
            name,
            group: muscleGroupOf(name),
            sets: buildSetsFor(name),
        }));

        if (exercises.length === 0) return null;

        const groupLabel: Record<MuscleGroup, string> = {
            push: "Push Day",
            pull: "Pull Day",
            legs: "Leg Day",
            core: "Core Session",
            cardio: "Conditioning",
            other: "Full Body",
        };

        return {
            id: generateId(),
            date: new Date().toISOString(),
            name: groupLabel[targetGroup],
            exercises,
        };
    },

    processInput: (text: string): AIResponse => {
        const lowerText = text.toLowerCase();

        // 1. Check for Meal Logging
        if (lowerText.includes("ate") || lowerText.includes("had") || lowerText.includes("drink") || lowerText.includes("drank")) {
            const meal = aiLogic.estimateNutrition(text);
            if (meal) {
                return {
                    text: `I've logged your meal: **${meal.name}** (${meal.calories} kcal).`,
                    action: "LOG_MEAL",
                    data: meal,
                };
            } else {
                return {
                    text: "I noticed you mentioned food, but I couldn't identify it in my database. Try saying 'I ate an apple'.",
                };
            }
        }

        // 2. Check for Workout Logging
        if (lowerText.includes("did") && (lowerText.includes("sets") || lowerText.includes("reps") || lowerText.includes("workout"))) {
            const workout = aiLogic.parseWorkout(text);
            if (workout) {
                return {
                    text: `Great job! I've logged your workout: **${workout.exercises[0].name}** (${workout.exercises[0].sets.length} sets).`,
                    action: "LOG_WORKOUT",
                    data: workout,
                };
            }
        }

        // 3. Check for Suggestion
        if (lowerText.includes("suggest") || lowerText.includes("what should i do")) {
            return {
                text: aiLogic.generateSuggestion(),
                action: "SUGGESTION",
            };
        }

        // 4. Default / RAG Fallback (Video search)
        if (lowerText.includes("how to")) {
            // This will be handled by the UI to show video, but we return text here
            return {
                text: "Here is a video demonstration:",
                // The UI handles the video logic separately for now, or we could move it here.
                // For now, let's keep the existing video logic in the UI or merge it.
            };
        }

        return {
            text: "I'm not sure I understand. You can tell me what you ate ('I ate an apple') or what you did ('I did 3 sets of pushups').",
        };
    }
};
