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
            date: new Date().toISOString(),
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
            date: new Date().toISOString(),
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
        // Goal-based exercise recommendations
        const goalBasedExercises: Record<string, string[]> = {
            lose_weight: ["Burpees", "Mountain Climbers", "Jumping Jacks", "High Knees", "Squats", "Lunges"],
            gain_weight: ["Squats", "Deadlifts", "Bench Press", "Rows", "Overhead Press"],
            build_muscle: ["Push-ups", "Pull-ups", "Squats", "Deadlifts", "Bench Press", "Rows"],
            maintain: ["Push-ups", "Squats", "Planks", "Lunges", "Burpees"],
            improve_fitness: ["Burpees", "Mountain Climbers", "Jumping Jacks", "Squats", "Lunges", "Planks"],
        };

        if (!workouts || workouts.length === 0) {
            // Default workout based on user goals or generic starter
            const goalExercises = profile?.goals ? goalBasedExercises[profile.goals] || [] : [];
            const selectedExercises = goalExercises.length > 0 
                ? goalExercises.slice(0, 3)
                : ["Push-ups", "Squats"];

            return {
                id: generateId(),
                date: new Date().toISOString(),
                name: profile?.goals === "build_muscle" ? "Strength Builder" : 
                      profile?.goals === "lose_weight" ? "Fat Burner" : 
                      "Full Body Starter",
                exercises: selectedExercises.map(exName => ({
                    id: generateId(),
                    name: exName,
                    sets: Array.from({ length: profile?.workoutsPerWeek && profile.workoutsPerWeek >= 4 ? 4 : 3 }, (_, i) => ({
                        id: generateId(),
                        reps: profile?.goals === "build_muscle" ? 8 : 
                              profile?.goals === "lose_weight" ? 15 : 12,
                        weight: 0,
                        completed: false,
                    })),
                })),
            };
        }

        // Analyze workout history
        const exerciseFrequency: Record<string, number> = {};
        const exerciseDetails: Record<string, { sets: number; reps: number }> = {};
        const recentWorkouts = workouts.slice(0, 10); // Last 10 workouts

        // Count exercise frequency and average sets/reps
        recentWorkouts.forEach(workout => {
            workout.exercises.forEach(exercise => {
                const name = exercise.name.toLowerCase();
                exerciseFrequency[name] = (exerciseFrequency[name] || 0) + 1;
                
                if (!exerciseDetails[name]) {
                    const totalSets = exercise.sets.length;
                    const avgReps = exercise.sets.reduce((sum, set) => sum + set.reps, 0) / totalSets;
                    exerciseDetails[name] = { sets: totalSets, reps: Math.round(avgReps) };
                }
            });
        });

        // Find exercises that haven't been done recently (last 3 workouts)
        const last3Workouts = workouts.slice(0, 3);
        const recentExercises = new Set<string>();
        last3Workouts.forEach(workout => {
            workout.exercises.forEach(ex => recentExercises.add(ex.name.toLowerCase()));
        });

        // Suggest exercises that are common but not done recently, or suggest variety
        const suggestedExercises: Exercise[] = [];
        const allExercises = Object.keys(exerciseFrequency);
        
        // Strategy: Pick 2-3 exercises
        // 1. Pick one that's common but not done recently
        // 2. Pick one that's done frequently (user likes it)
        // 3. Add a complementary exercise

        const sortedByFrequency = allExercises.sort((a, b) => exerciseFrequency[b] - exerciseFrequency[a]);
        
        // Find exercises not done recently
        const notRecentExercises = sortedByFrequency.filter(ex => !recentExercises.has(ex));
        
        if (notRecentExercises.length > 0) {
            // Suggest the most common exercise that hasn't been done recently
            const exerciseName = notRecentExercises[0];
            const details = exerciseDetails[exerciseName] || { sets: 3, reps: 10 };
            suggestedExercises.push({
                id: generateId(),
                name: exerciseName.charAt(0).toUpperCase() + exerciseName.slice(1),
                sets: Array.from({ length: details.sets }, (_, i) => ({
                    id: generateId(),
                    reps: details.reps,
                    weight: 0,
                    completed: false,
                })),
            });
        }

        // Add a frequently done exercise (user's favorite)
        if (sortedByFrequency.length > 0 && suggestedExercises.length < 3) {
            const favoriteExercise = sortedByFrequency[0];
            if (!suggestedExercises.find(ex => ex.name.toLowerCase() === favoriteExercise)) {
                const details = exerciseDetails[favoriteExercise] || { sets: 3, reps: 10 };
                suggestedExercises.push({
                    id: generateId(),
                    name: favoriteExercise.charAt(0).toUpperCase() + favoriteExercise.slice(1),
                    sets: Array.from({ length: details.sets }, (_, i) => ({
                        id: generateId(),
                        reps: details.reps,
                        weight: 0,
                        completed: false,
                    })),
                });
            }
        }

        // Add a complementary exercise based on goals or default
        if (suggestedExercises.length < 3) {
            const goalExercises = profile?.goals ? goalBasedExercises[profile.goals] || [] : [];
            const complementaryExercises = goalExercises.length > 0 
                ? goalExercises 
                : ["Planks", "Lunges", "Burpees", "Mountain Climbers"];
            
            const existingNames = suggestedExercises.map(ex => ex.name.toLowerCase());
            const complementary = complementaryExercises.find(
                ex => !existingNames.includes(ex.toLowerCase())
            );
            
            if (complementary) {
                const reps = profile?.goals === "build_muscle" ? 8 : 
                            profile?.goals === "lose_weight" ? 15 : 12;
                const sets = profile?.workoutsPerWeek && profile.workoutsPerWeek >= 4 ? 4 : 3;
                
                suggestedExercises.push({
                    id: generateId(),
                    name: complementary,
                    sets: Array.from({ length: sets }, (_, i) => ({
                        id: generateId(),
                        reps: reps,
                        weight: 0,
                        completed: false,
                    })),
                });
            }
        }

        if (suggestedExercises.length === 0) {
            return null;
        }

        // Determine workout name based on exercises
        const workoutName = suggestedExercises.length === 1 
            ? `${suggestedExercises[0].name} Focus`
            : suggestedExercises.length === 2
            ? `${suggestedExercises[0].name} & ${suggestedExercises[1].name}`
            : "Full Body Workout";

        return {
            id: generateId(),
            date: new Date().toISOString(),
            name: workoutName,
            exercises: suggestedExercises,
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
