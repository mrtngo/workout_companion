import { Meal, Workout, Exercise, WorkoutSet, UserProfile } from "./storage";

// Mock database for nutrition estimation
const FOOD_DATABASE: Record<string, { calories: number; protein: number; carbs: number; fats: number }> = {
    apple: { calories: 95, protein: 0.5, carbs: 25, fats: 0.3 },
    manzana: { calories: 95, protein: 0.5, carbs: 25, fats: 0.3 },
    banana: { calories: 105, protein: 1.3, carbs: 27, fats: 0.3 },
    plátano: { calories: 105, protein: 1.3, carbs: 27, fats: 0.3 },
    platano: { calories: 105, protein: 1.3, carbs: 27, fats: 0.3 },
    chicken: { calories: 165, protein: 31, carbs: 0, fats: 3.6 },
    pollo: { calories: 165, protein: 31, carbs: 0, fats: 3.6 },
    "chicken breast": { calories: 165, protein: 31, carbs: 0, fats: 3.6 },
    "pechuga de pollo": { calories: 165, protein: 31, carbs: 0, fats: 3.6 },
    rice: { calories: 130, protein: 2.7, carbs: 28, fats: 0.3 },
    arroz: { calories: 130, protein: 2.7, carbs: 28, fats: 0.3 },
    egg: { calories: 78, protein: 6, carbs: 0.6, fats: 5 },
    huevo: { calories: 78, protein: 6, carbs: 0.6, fats: 5 },
    salad: { calories: 150, protein: 5, carbs: 10, fats: 10 },
    ensalada: { calories: 150, protein: 5, carbs: 10, fats: 10 },
    pizza: { calories: 285, protein: 12, carbs: 36, fats: 10 },
    burger: { calories: 500, protein: 25, carbs: 40, fats: 25 },
    hamburguesa: { calories: 500, protein: 25, carbs: 40, fats: 25 },
};

// Simple UUID generator
const generateId = () => Math.random().toString(36).substring(2, 9);

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

    generateSuggestion: (language: "en" | "es" = "en"): string => {
        const suggestionsEN = [
            "Based on your recent activity, I recommend a **Full Body Workout** today. Focus on compound movements like Squats and Pushups.",
            "You haven't done cardio in a while. How about a **30-minute run**?",
            "It's been a heavy week. Maybe try some **Yoga or Stretching** today?",
            "Time for **Leg Day**! Let's aim for 4 sets of Squats and Lunges.",
        ];
        const suggestionsES = [
            "Según tu actividad reciente, te recomiendo un **Entrenamiento de Cuerpo Completo** hoy. Enfréntate a movimientos compuestos como Sentadillas y Flexiones.",
            "No has hecho cardio en un tiempo. ¿Qué tal una **carrera de 30 minutos**?",
            "Ha sido una semana intensa. ¿Tal vez probar algo de **Yoga o Estiramientos** hoy?",
            "¡Es hora del **Día de Pierna**! Busquemos hacer 4 series de Sentadillas y Zancadas.",
        ];
        const suggestions = language === "es" ? suggestionsES : suggestionsEN;
        return suggestions[Math.floor(Math.random() * suggestions.length)];
    },

    suggestWorkoutFromHistory: (workouts: Workout[], profile?: UserProfile | null, language: "en" | "es" = "en"): Workout | null => {
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

            let defaultName = "Full Body Starter";
            if (profile?.goals === "build_muscle") defaultName = language === "es" ? "Creador de Fuerza" : "Strength Builder";
            else if (profile?.goals === "lose_weight") defaultName = language === "es" ? "Quemador de Grasa" : "Fat Burner";
            else defaultName = language === "es" ? "Iniciador de Cuerpo Completo" : "Full Body Starter";

            return {
                id: generateId(),
                date: new Date().toISOString(),
                name: defaultName,
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
        let workoutName = "";
        if (suggestedExercises.length === 1) {
            workoutName = language === "es" 
                ? `Enfoque en ${suggestedExercises[0].name}` 
                : `${suggestedExercises[0].name} Focus`;
        } else if (suggestedExercises.length === 2) {
            workoutName = language === "es"
                ? `${suggestedExercises[0].name} y ${suggestedExercises[1].name}`
                : `${suggestedExercises[0].name} & ${suggestedExercises[1].name}`;
        } else {
            workoutName = language === "es" ? "Entrenamiento de Cuerpo Completo" : "Full Body Workout";
        }

        return {
            id: generateId(),
            date: new Date().toISOString(),
            name: workoutName,
            exercises: suggestedExercises,
        };
    },

    processInput: (text: string, language: "en" | "es" = "en"): AIResponse => {
        const lowerText = text.toLowerCase();

        // 1. Check for Meal Logging
        const isMealTrigger = lowerText.includes("ate") || lowerText.includes("had") || lowerText.includes("drink") || lowerText.includes("drank") || lowerText.includes("comi") || lowerText.includes("comí") || lowerText.includes("tome") || lowerText.includes("tomé") || lowerText.includes("desayun") || lowerText.includes("almorz") || lowerText.includes("cené") || lowerText.includes("cene");
        if (isMealTrigger) {
            const meal = aiLogic.estimateNutrition(text);
            if (meal) {
                return {
                    text: language === "es" 
                        ? `He registrado tu comida: **${meal.name}** (${meal.calories} kcal).`
                        : `I've logged your meal: **${meal.name}** (${meal.calories} kcal).`,
                    action: "LOG_MEAL",
                    data: meal,
                };
            } else {
                return {
                    text: language === "es"
                        ? "Noté que mencionaste comida, pero no pude identificarla en mi base de datos. Intenta diciendo 'Comí una manzana'."
                        : "I noticed you mentioned food, but I couldn't identify it in my database. Try saying 'I ate an apple'.",
                };
            }
        }

        // 2. Check for Workout Logging
        const isWorkoutTrigger = (lowerText.includes("did") || lowerText.includes("hice")) && (lowerText.includes("sets") || lowerText.includes("reps") || lowerText.includes("workout") || lowerText.includes("series") || lowerText.includes("repeticiones") || lowerText.includes("entreno") || lowerText.includes("entrenamiento"));
        if (isWorkoutTrigger) {
            const workout = aiLogic.parseWorkout(text);
            if (workout) {
                // translate exercise name or default workout name if Spanish
                if (language === "es") {
                    workout.name = "Entrenamiento por IA";
                }
                
                const setsMatch = lowerText.match(/(\d+)\s*sets?/) || lowerText.match(/(\d+)\s*series/);
                const repsMatch = lowerText.match(/(\d+)\s*reps?/) || lowerText.match(/(\d+)\s*repeticiones/);
                let exerciseName = lowerText
                    .replace(/i did/g, "")
                    .replace(/hice/g, "")
                    .replace(/sets? of/g, "")
                    .replace(/series de/g, "")
                    .replace(/reps?/g, "")
                    .replace(/repeticiones/g, "")
                    .replace(/\d+/g, "")
                    .trim();
                
                if (!exerciseName) {
                    exerciseName = language === "es" ? "Ejercicio" : "Workout";
                } else {
                    exerciseName = exerciseName.charAt(0).toUpperCase() + exerciseName.slice(1);
                }

                workout.exercises[0].name = exerciseName;

                return {
                    text: language === "es"
                        ? `¡Buen trabajo! He registrado tu entrenamiento: **${workout.exercises[0].name}** (${workout.exercises[0].sets.length} series).`
                        : `Great job! I've logged your workout: **${workout.exercises[0].name}** (${workout.exercises[0].sets.length} sets).`,
                    action: "LOG_WORKOUT",
                    data: workout,
                };
            }
        }

        // 3. Check for Suggestion
        const isSuggestionTrigger = lowerText.includes("suggest") || lowerText.includes("what should i do") || lowerText.includes("sugier") || lowerText.includes("suger") || lowerText.includes("que debo hacer") || lowerText.includes("qué debo hacer") || lowerText.includes("que hacer") || lowerText.includes("qué hacer");
        if (isSuggestionTrigger) {
            return {
                text: aiLogic.generateSuggestion(language),
                action: "SUGGESTION",
            };
        }

        // 4. Default / RAG Fallback (Video search)
        const isVideoTrigger = lowerText.includes("how to") || lowerText.includes("como hacer") || lowerText.includes("cómo hacer");
        if (isVideoTrigger) {
            return {
                text: language === "es" ? "Aquí tienes una demostración en video:" : "Here is a video demonstration:",
            };
        }

        return {
            text: language === "es"
                ? "No estoy seguro de entender. Puedes decirme qué comiste ('Comí una manzana') o qué hiciste ('Hice 3 series de flexiones')."
                : "I'm not sure I understand. You can tell me what you ate ('I ate an apple') or what you did ('I did 3 sets of pushups').",
        };
    }
};
