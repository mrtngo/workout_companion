import { storage, Workout, Meal, Exercise, WorkoutSet, UserProfile } from "./storage";

// Mock exercise database
const EXERCISES = [
    { name: "Push-ups", sets: 3, reps: 15, weight: 0 },
    { name: "Squats", sets: 4, reps: 12, weight: 0 },
    { name: "Bench Press", sets: 4, reps: 8, weight: 80 },
    { name: "Deadlift", sets: 3, reps: 5, weight: 120 },
    { name: "Pull-ups", sets: 3, reps: 10, weight: 0 },
    { name: "Lunges", sets: 3, reps: 12, weight: 0 },
    { name: "Shoulder Press", sets: 3, reps: 10, weight: 40 },
    { name: "Bicep Curls", sets: 3, reps: 12, weight: 15 },
    { name: "Planks", sets: 3, reps: 60, weight: 0 }, // reps = seconds
    { name: "Burpees", sets: 3, reps: 10, weight: 0 },
    { name: "Mountain Climbers", sets: 3, reps: 20, weight: 0 },
    { name: "Leg Press", sets: 4, reps: 12, weight: 100 },
    { name: "Rows", sets: 3, reps: 10, weight: 50 },
    { name: "Tricep Dips", sets: 3, reps: 12, weight: 0 },
];

// Mock meal database
const MEALS = [
    { name: "Oatmeal with Banana", calories: 350, protein: 12, carbs: 65, fats: 8 },
    { name: "Grilled Chicken Breast", calories: 165, protein: 31, carbs: 0, fats: 3.6 },
    { name: "Brown Rice", calories: 130, protein: 2.7, carbs: 28, fats: 0.3 },
    { name: "Salmon Fillet", calories: 206, protein: 22, carbs: 0, fats: 12 },
    { name: "Greek Yogurt", calories: 100, protein: 17, carbs: 6, fats: 0 },
    { name: "Protein Shake", calories: 120, protein: 25, carbs: 3, fats: 1 },
    { name: "Eggs (2)", calories: 156, protein: 12, carbs: 1.2, fats: 10 },
    { name: "Sweet Potato", calories: 180, protein: 4, carbs: 41, fats: 0.3 },
    { name: "Broccoli", calories: 55, protein: 4, carbs: 11, fats: 0.6 },
    { name: "Apple", calories: 95, protein: 0.5, carbs: 25, fats: 0.3 },
    { name: "Banana", calories: 105, protein: 1.3, carbs: 27, fats: 0.3 },
    { name: "Almonds (1 oz)", calories: 164, protein: 6, carbs: 6, fats: 14 },
    { name: "Whole Wheat Bread", calories: 80, protein: 4, carbs: 15, fats: 1 },
    { name: "Avocado", calories: 234, protein: 3, carbs: 12, fats: 21 },
    { name: "Tuna Salad", calories: 200, protein: 30, carbs: 5, fats: 7 },
];

const generateId = () => Math.random().toString(36).substring(2, 9);

function generateWorkoutForDate(date: Date, workoutFrequency: number): Workout | null {
    // Skip some days based on workout frequency (e.g., 3 workouts/week = ~43% chance per day)
    const workoutProbability = workoutFrequency / 7;
    if (Math.random() > workoutProbability) {
        return null;
    }

    // Select 2-4 exercises for the workout
    const numExercises = Math.floor(Math.random() * 3) + 2; // 2-4 exercises
    const selectedExercises = EXERCISES.sort(() => Math.random() - 0.5).slice(0, numExercises);

    const exercises: Exercise[] = selectedExercises.map(ex => {
        const sets: WorkoutSet[] = [];
        const numSets = ex.sets + Math.floor(Math.random() * 2) - 1; // Vary sets by ±1
        const baseReps = ex.reps;
        
        for (let i = 0; i < numSets; i++) {
            // Vary reps slightly
            const reps = baseReps + Math.floor(Math.random() * 5) - 2;
            sets.push({
                id: generateId(),
                reps: Math.max(1, reps),
                weight: ex.weight > 0 ? ex.weight + Math.floor(Math.random() * 10) - 5 : 0,
                completed: true,
            });
        }

        return {
            id: generateId(),
            name: ex.name,
            sets,
        };
    });

    // Workout names based on exercises
    const workoutNames = [
        "Morning Workout",
        "Evening Session",
        "Gym Session",
        "Home Workout",
        "Strength Training",
        "Cardio Day",
        "Full Body",
        "Upper Body",
        "Lower Body",
    ];

    return {
        id: generateId(),
        date: date.toISOString(),
        name: workoutNames[Math.floor(Math.random() * workoutNames.length)],
        exercises,
    };
}

function generateMealsForDate(date: Date): Meal[] {
    const meals: Meal[] = [];
    const numMeals = Math.floor(Math.random() * 2) + 2; // 2-3 meals per day

    for (let i = 0; i < numMeals; i++) {
        const meal = MEALS[Math.floor(Math.random() * MEALS.length)];
        meals.push({
            id: generateId(),
            date: new Date(date.getTime() + i * 4 * 60 * 60 * 1000).toISOString(), // Spread meals throughout day
            name: meal.name,
            calories: meal.calories + Math.floor(Math.random() * 50) - 25,
            protein: meal.protein + Math.random() * 2 - 1,
            carbs: meal.carbs + Math.random() * 5 - 2.5,
            fats: meal.fats + Math.random() * 2 - 1,
        });
    }

    return meals;
}

export async function seedMockData(userId: string, days: number = 30) {
    console.log(`Generating ${days} days of mock data for user ${userId}...`);

    // Create user profile if it doesn't exist
    let profile = await storage.getUserProfile(userId);
    if (!profile) {
        await storage.saveUserProfile(userId, {
            age: 30,
            weight: 75,
            gender: "male",
            goals: "build_muscle",
            workoutsPerWeek: 4,
        });
        profile = await storage.getUserProfile(userId);
    }

    const workouts: Workout[] = [];
    const meals: Meal[] = [];

    // Generate data for the last N days
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        date.setHours(8 + Math.floor(Math.random() * 10), 0, 0, 0); // Random time between 8 AM and 6 PM

        // Generate workout
        const workout = generateWorkoutForDate(date, profile?.workoutsPerWeek || 4);
        if (workout) {
            workouts.push(workout);
        }

        // Generate meals
        const dayMeals = generateMealsForDate(date);
        meals.push(...dayMeals);
    }

    // Save workouts
    console.log(`Saving ${workouts.length} workouts...`);
    for (const workout of workouts) {
        try {
            await storage.saveWorkout(userId, workout);
        } catch (error) {
            console.error(`Error saving workout ${workout.id}:`, error);
        }
    }

    // Save meals
    console.log(`Saving ${meals.length} meals...`);
    for (const meal of meals) {
        try {
            await storage.saveMeal(userId, meal);
        } catch (error) {
            console.error(`Error saving meal ${meal.id}:`, error);
        }
    }

    console.log(`✅ Mock data generation complete!`);
    console.log(`   - ${workouts.length} workouts created`);
    console.log(`   - ${meals.length} meals created`);
    console.log(`   - Profile: ${profile?.age}yo, ${profile?.weight}kg, ${profile?.goals}`);

    return { workouts, meals, profile };
}

