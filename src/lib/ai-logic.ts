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
        const lowerText = text.toLowerCase().trim();

        // 1. Check for Greetings
        const isGreeting = /\b(hola|hello|hi|hey|buenas|buenos dias|buenos días|buenas tardes|buenas noches)\b/i.test(lowerText);
        if (isGreeting) {
            return {
                text: language === "es"
                    ? "¡Hola, Atleta! 👋 ¿Cómo va el día hoy? Estoy aquí para ayudarte con tus entrenamientos, resolver tus dudas sobre nutrición o registrar tus progresos. ¿De qué te gustaría hablar?"
                    : "Hello, Athlete! 👋 How is your day going? I'm here to help you with your training, answer nutrition questions, or log your progress. What would you like to talk about?"
            };
        }

        // 2. Check for Thanksgiving/Agreement
        const isThanks = /\b(gracias|thanks|thank you|ty|excelente|perfecto|ok|genial|great|awesome|entendido)\b/i.test(lowerText);
        if (isThanks) {
            return {
                text: language === "es"
                    ? "¡De nada! 💪 Mantente enfocado en tus objetivos. ¿Hay algo más en lo que pueda apoyarte hoy?"
                    : "You're welcome! 💪 Stay focused on your goals. Is there anything else I can help you with today?"
            };
        }

        // 3. Check for specific suggestions request
        const isSuggestionTrigger = /\b(sugier|suger|recomienda|recommend|suggest|what should i do|qué debo hacer|que debo hacer|qué hacer|que hacer)\b/i.test(lowerText);
        if (isSuggestionTrigger && /\b(workout|entrenamiento|entreno|rutina|ejercicio|ejercicios|hacer)\b/i.test(lowerText)) {
            return {
                text: aiLogic.generateSuggestion(language),
                action: "SUGGESTION",
            };
        }

        // 4. Check for Meal Logging triggers (requires actual log verbs with word boundaries)
        const isMealLogIntent = /\b(ate|had|drank|drink|logged|comi|comí|tome|tomé|desayune|desayuné|almorce|almorcé|cene|cené|merende|merendé|registre|registré)\b/i.test(lowerText);
        if (isMealLogIntent) {
            const meal = aiLogic.estimateNutrition(text);
            if (meal) {
                return {
                    text: language === "es" 
                        ? `He registrado tu comida: **${meal.name}** (${meal.calories} kcal). Puedes verla en tu pestaña de Nutrición.`
                        : `I've logged your meal: **${meal.name}** (${meal.calories} kcal). You can view it in your Fuel tab.`,
                    action: "LOG_MEAL",
                    data: meal,
                };
            }
        }

        // 5. Check for Workout Logging triggers
        const isWorkoutLogIntent = /\b(did|hice|entrené|entrene|registré|registre)\b/i.test(lowerText) && 
            /\b(sets|reps|workout|series|repeticiones|entreno|entrenamiento|flexiones|pushups|sentadillas|squats)\b/i.test(lowerText);
        if (isWorkoutLogIntent) {
            const workout = aiLogic.parseWorkout(text);
            if (workout) {
                if (language === "es") {
                    workout.name = "Entrenamiento por IA";
                }
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

        // 6. Check for Nutrition topics (General Advice)
        const isNutritionTopic = /\b(comida|comidas|nutricion|nutrición|dieta|diet|proteina|proteína|protein|carbohidrato|carbohidratos|carbs|carbos|grasa|grasas|fats|caloria|calorias|calorías|calories|receta|recipe|comer|cena|desayuno|almuerzo)\b/i.test(lowerText);
        if (isNutritionTopic) {
            return {
                text: language === "es"
                    ? "Para optimizar tu rendimiento, te recomiendo priorizar la **proteína** (1.6 a 2.2g por kg de peso corporal) para la recuperación muscular, consumir **carbohidratos complejos** (avena, arroz) antes de entrenar para tener energía, y mantener grasas saludables. Si quieres que registre una comida, escribe algo como: *'Comí arroz con pollo'*."
                    : "To optimize your performance, I recommend prioritizing **protein** (1.6 to 2.2g per kg of body weight) for muscle recovery, consuming **complex carbs** (oats, rice) before training for energy, and keeping healthy fats. If you want me to log a meal, try saying: *'I ate chicken and rice'*."
            };
        }

        // 7. Check for Workout/Exercise topics (General Advice)
        const isWorkoutTopic = /\b(entrenamiento|entrenamientos|entrenar|ejercicio|ejercicios|rutina|rutinas|workout|workouts|training|exercise|exercises|fuerza|strength|cardio|hipertrofia|musculo|músculo|hipertrophy|estiramiento|stretch|gimnasio|gym)\b/i.test(lowerText);
        if (isWorkoutTopic) {
            return {
                text: language === "es"
                    ? "La clave para ganar fuerza e hipertrofia es la **sobrecarga progresiva** (aumentar peso o repeticiones gradualmente). Asegúrate de calentar bien antes de cada sesión y mantener una técnica sólida. Puedes iniciar un entrenamiento en vivo con el botón '+' o pedirme una rutina diciendo: *'Sugiéreme un entrenamiento'*."
                    : "The key to building strength and hypertrophy is **progressive overload** (gradually increasing weight or reps). Make sure to warm up well before each session and maintain solid form. You can start a live workout with the '+' button, or ask me for a routine by saying: *'Suggest a workout'*."
            };
        }

        // 8. Check for Recovery / Sleep topics
        const isRecoveryTopic = /\b(sueño|sleep|recuperacion|recuperación|recovery|descanso|descansar|rest|cansado|tired|whoop|hrv|rhr|frecuencia cardiaca|frecuencia cardíaca)\b/i.test(lowerText);
        if (isRecoveryTopic) {
            return {
                text: language === "es"
                    ? "La recuperación es donde ocurre el progreso real. Intenta dormir entre **7 y 9 horas**, mantén una buena hidratación y presta atención a tu HRV y descanso de Whoop. Si te sientes muy cansado, hoy podría ser un buen día para descanso activo (caminar ligero, estiramientos)."
                    : "Recovery is where the actual progress happens. Aim for **7 to 9 hours of sleep**, maintain good hydration, and pay attention to your Whoop HRV and recovery score. If you feel very tired, today might be a good day for active recovery (light walking, stretching)."
            };
        }

        // 9. Default / Fallback demo video
        const isVideoTrigger = /\b(how to|como hacer|cómo hacer|demostracion|demo|tutorial)\b/i.test(lowerText);
        if (isVideoTrigger) {
            return {
                text: language === "es" 
                    ? "Aquí tienes una demostración en video del ejercicio para que revises la forma correcta:" 
                    : "Here is a video demonstration of the exercise for you to check the proper form:",
            };
        }

        // 10. Default General Response (natural & helpful, keeping scope in mind)
        return {
            text: language === "es"
                ? "Como tu coach de Workout Companion, puedo guiarte con tu entrenamiento, darte consejos sobre macronutrientes, sugerirte una rutina para hoy o registrar lo que comes y entrenas. ¿Qué objetivo tienes en mente hoy?"
                : "As your Workout Companion coach, I can guide you through your training, give macronutrient advice, suggest a routine for today, or log your meals and workouts. What goal do you have in mind today?"
        };
    }
};
