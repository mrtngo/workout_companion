import {
    collection,
    doc,
    getDocs,
    addDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    where,
    Timestamp,
    setDoc,
} from "firebase/firestore";
import { db } from "./firebase";

export interface WorkoutSet {
    id: string;
    reps: number;
    weight: number;
    completed: boolean;
}

export interface Exercise {
    id: string;
    name: string;
    sets: WorkoutSet[];
    group?: string; // Optional group/category for organizing exercises
}

export interface Workout {
    id: string;
    date: string; // ISO string
    name: string;
    exercises: Exercise[];
}

export interface Meal {
    id: string;
    date: string; // ISO string
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
}

export interface ConversationMessage {
    id: string;
    role: "user" | "assistant";
    content: string;
    videoUrl?: string;
    imageUrl?: string;
    timestamp: string; // ISO string
}

export interface Conversation {
    id: string;
    title: string;
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
    messageCount: number;
}

export interface WorkoutOfDay {
    id: string;
    workout: Workout;
    suggestedAt: string; // ISO string
    acceptedAt?: string; // ISO string
    completedAt?: string; // ISO string
    status: "suggested" | "accepted" | "completed";
    date: string; // ISO string (the date this workout is for)
}

export interface UserProfile {
    age: number;
    weight: number; // in kg
    gender: "male" | "female" | "other";
    goals: "lose_weight" | "gain_weight" | "maintain" | "build_muscle" | "improve_fitness";
    workoutsPerWeek: number;
    maxDailyCalories?: number; // calculated based on goals
    completedOnboarding: boolean;
    createdAt: string; // ISO string
    updatedAt: string; // ISO string
}

// Helper function to get user-specific collection path
const getWorkoutsCollection = (userId: string) => 
    collection(db, "users", userId, "workouts");

const getMealsCollection = (userId: string) => 
    collection(db, "users", userId, "meals");

const getConversationsCollection = (userId: string) => 
    collection(db, "users", userId, "conversations");

const getMessagesCollection = (userId: string, conversationId: string) => 
    collection(db, "users", userId, "conversations", conversationId, "messages");

const getWorkoutOfDayCollection = (userId: string) => 
    collection(db, "users", userId, "workoutOfDay");

const getUserProfileDoc = (userId: string) => 
    doc(db, "users", userId, "profile", "data");

export const storage = {
    getWorkouts: async (userId: string): Promise<Workout[]> => {
        if (!userId) return [];
        
        try {
            const workoutsRef = getWorkoutsCollection(userId);
            const q = query(workoutsRef, orderBy("date", "desc"));
            const querySnapshot = await getDocs(q);
            
            return querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Workout[];
        } catch (error) {
            console.error("Error fetching workouts:", error);
            return [];
        }
    },

    saveWorkout: async (userId: string, workout: Workout): Promise<void> => {
        if (!userId) throw new Error("User ID is required");
        
        try {
            const workoutsRef = getWorkoutsCollection(userId);
            const { id, ...workoutData } = workout;
            if (id) {
                // Update existing workout
                const workoutDoc = doc(workoutsRef, id);
                await updateDoc(workoutDoc, {
                    ...workoutData,
                    date: Timestamp.fromDate(new Date(workout.date)),
                });
            } else {
                // Create new workout
                await addDoc(workoutsRef, {
                    ...workoutData,
                    date: Timestamp.fromDate(new Date(workout.date)),
                });
            }
        } catch (error) {
            console.error("Error saving workout:", error);
            throw error;
        }
    },

    updateWorkout: async (userId: string, workout: Workout): Promise<void> => {
        if (!userId || !workout.id) throw new Error("User ID and workout ID are required");
        
        try {
            const workoutsRef = getWorkoutsCollection(userId);
            const workoutDoc = doc(workoutsRef, workout.id);
            const { id, ...workoutData } = workout;
            await updateDoc(workoutDoc, {
                ...workoutData,
                date: Timestamp.fromDate(new Date(workout.date)),
            });
        } catch (error) {
            console.error("Error updating workout:", error);
            throw error;
        }
    },

    deleteWorkout: async (userId: string, workoutId: string): Promise<void> => {
        if (!userId || !workoutId) throw new Error("User ID and workout ID are required");
        
        try {
            const workoutsRef = getWorkoutsCollection(userId);
            const workoutDoc = doc(workoutsRef, workoutId);
            await deleteDoc(workoutDoc);
        } catch (error) {
            console.error("Error deleting workout:", error);
            throw error;
        }
    },

    deleteWorkouts: async (userId: string, workoutIds: string[]): Promise<void> => {
        if (!userId || !workoutIds.length) return;
        
        try {
            const workoutsRef = getWorkoutsCollection(userId);
            await Promise.all(
                workoutIds.map(workoutId => {
                    const workoutDoc = doc(workoutsRef, workoutId);
                    return deleteDoc(workoutDoc);
                })
            );
        } catch (error) {
            console.error("Error deleting workouts:", error);
            throw error;
        }
    },

    getMeals: async (userId: string): Promise<Meal[]> => {
        if (!userId) return [];
        
        try {
            const mealsRef = getMealsCollection(userId);
            const q = query(mealsRef, orderBy("date", "desc"));
            const querySnapshot = await getDocs(q);
            
            return querySnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    ...data,
                    date: data.date?.toDate?.().toISOString() || data.date,
                };
            }) as Meal[];
        } catch (error) {
            console.error("Error fetching meals:", error);
            return [];
        }
    },

    saveMeal: async (userId: string, meal: Meal): Promise<void> => {
        if (!userId) throw new Error("User ID is required");
        
        try {
            const mealsRef = getMealsCollection(userId);
            const { id, ...mealData } = meal;
            if (id) {
                // Update existing meal
                const mealDoc = doc(mealsRef, id);
                await updateDoc(mealDoc, {
                    ...mealData,
                    date: Timestamp.fromDate(new Date(meal.date)),
                });
            } else {
                // Create new meal
                await addDoc(mealsRef, {
                    ...mealData,
                    date: Timestamp.fromDate(new Date(meal.date)),
                });
            }
        } catch (error) {
            console.error("Error saving meal:", error);
            throw error;
        }
    },

    updateMeal: async (userId: string, meal: Meal): Promise<void> => {
        if (!userId || !meal.id) throw new Error("User ID and meal ID are required");
        
        try {
            const mealsRef = getMealsCollection(userId);
            const mealDoc = doc(mealsRef, meal.id);
            const { id, ...mealData } = meal;
            await updateDoc(mealDoc, {
                ...mealData,
                date: Timestamp.fromDate(new Date(meal.date)),
            });
        } catch (error) {
            console.error("Error updating meal:", error);
            throw error;
        }
    },

    deleteMeal: async (userId: string, mealId: string): Promise<void> => {
        if (!userId || !mealId) throw new Error("User ID and meal ID are required");
        
        try {
            const mealsRef = getMealsCollection(userId);
            const mealDoc = doc(mealsRef, mealId);
            await deleteDoc(mealDoc);
        } catch (error) {
            console.error("Error deleting meal:", error);
            throw error;
        }
    },

    deleteMeals: async (userId: string, mealIds: string[]): Promise<void> => {
        if (!userId || !mealIds.length) return;
        
        try {
            const mealsRef = getMealsCollection(userId);
            await Promise.all(
                mealIds.map(mealId => {
                    const mealDoc = doc(mealsRef, mealId);
                    return deleteDoc(mealDoc);
                })
            );
        } catch (error) {
            console.error("Error deleting meals:", error);
            throw error;
        }
    },

    // Conversation management
    createConversation: async (userId: string, title?: string): Promise<string> => {
        if (!userId) throw new Error("User ID is required");
        
        try {
            const conversationsRef = getConversationsCollection(userId);
            const now = new Date();
            const conversationData = {
                title: title || `Conversation ${new Date().toLocaleDateString()}`,
                createdAt: Timestamp.fromDate(now),
                updatedAt: Timestamp.fromDate(now),
                messageCount: 0,
            };
            
            const docRef = await addDoc(conversationsRef, conversationData);
            
            // Add initial welcome message
            const messagesRef = getMessagesCollection(userId, docRef.id);
            await addDoc(messagesRef, {
                id: `welcome-${Date.now()}`,
                role: "assistant",
                content: "Hi! I'm your AI companion. Tell me what you ate or what workout you did, and I'll log it for you!",
                timestamp: Timestamp.fromDate(now),
            });
            
            // Update message count for initial message
            await updateDoc(doc(db, "users", userId, "conversations", docRef.id), {
                messageCount: 1,
            });
            
            return docRef.id;
        } catch (error) {
            console.error("Error creating conversation:", error);
            throw error;
        }
    },

    getConversations: async (userId: string): Promise<Conversation[]> => {
        if (!userId) return [];
        
        try {
            const conversationsRef = getConversationsCollection(userId);
            const q = query(conversationsRef, orderBy("updatedAt", "desc"));
            const querySnapshot = await getDocs(q);
            
            return querySnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: doc.id,
                    title: data.title,
                    createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt,
                    updatedAt: data.updatedAt?.toDate?.().toISOString() || data.updatedAt,
                    messageCount: data.messageCount || 0,
                };
            }) as Conversation[];
        } catch (error) {
            console.error("Error fetching conversations:", error);
            return [];
        }
    },

    getConversationMessages: async (userId: string, conversationId: string): Promise<ConversationMessage[]> => {
        if (!userId || !conversationId) return [];
        
        try {
            const messagesRef = getMessagesCollection(userId, conversationId);
            let querySnapshot;
            
            try {
                // Try to order by timestamp first (requires index)
                const q = query(messagesRef, orderBy("timestamp", "asc"));
                querySnapshot = await getDocs(q);
            } catch (orderError: any) {
                // If index doesn't exist, fall back to getting all messages and sorting client-side
                console.warn("Timestamp index not found, fetching all messages:", orderError);
                querySnapshot = await getDocs(messagesRef);
            }
            
            const messages = querySnapshot.docs.map((doc) => {
                const data = doc.data();
                return {
                    id: data.id || doc.id,
                    role: data.role,
                    content: data.content || "",
                    videoUrl: data.videoUrl,
                    imageUrl: data.imageUrl,
                    timestamp: data.timestamp?.toDate?.().toISOString() || data.timestamp || new Date().toISOString(),
                };
            }) as ConversationMessage[];
            
            // Sort by timestamp if we didn't use orderBy
            if (messages.length > 0 && messages[0].timestamp) {
                messages.sort((a, b) => {
                    const timeA = new Date(a.timestamp).getTime();
                    const timeB = new Date(b.timestamp).getTime();
                    return timeA - timeB;
                });
            }
            
            return messages;
        } catch (error) {
            console.error("Error fetching conversation messages:", error);
            return [];
        }
    },

    saveMessage: async (userId: string, conversationId: string, message: ConversationMessage): Promise<void> => {
        if (!userId || !conversationId) throw new Error("User ID and Conversation ID are required");
        
        try {
            const messagesRef = getMessagesCollection(userId, conversationId);
            const messageData: any = {
                id: message.id,
                role: message.role,
                content: message.content,
                timestamp: Timestamp.fromDate(new Date(message.timestamp)),
            };
            
            // Only include videoUrl if it exists
            if (message.videoUrl) {
                messageData.videoUrl = message.videoUrl;
            }
            if (message.imageUrl) {
                messageData.imageUrl = message.imageUrl;
            }
            
            await addDoc(messagesRef, messageData);
            
            // Update conversation metadata
            const conversationRef = doc(db, "users", userId, "conversations", conversationId);
            const conversationDoc = await getDoc(conversationRef);
            if (conversationDoc.exists()) {
                const currentCount = conversationDoc.data().messageCount || 0;
                await updateDoc(conversationRef, {
                    updatedAt: Timestamp.now(),
                    messageCount: currentCount + 1,
                });
            }
        } catch (error) {
            console.error("Error saving message:", error);
            throw error;
        }
    },

    updateConversationTitle: async (userId: string, conversationId: string, title: string): Promise<void> => {
        if (!userId || !conversationId) throw new Error("User ID and Conversation ID are required");
        
        try {
            const conversationRef = doc(db, "users", userId, "conversations", conversationId);
            await updateDoc(conversationRef, {
                title,
                updatedAt: Timestamp.now(),
            });
        } catch (error) {
            console.error("Error updating conversation title:", error);
            throw error;
        }
    },

    // Workout of the Day management
    getWorkoutOfDay: async (userId: string, date?: string): Promise<WorkoutOfDay | null> => {
        if (!userId) return null;
        
        try {
            const targetDate = date || new Date().toISOString().split('T')[0];
            const wodRef = getWorkoutOfDayCollection(userId);
            const q = query(wodRef, where("date", "==", targetDate));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) return null;
            
            // Get the most recent one if multiple exist
            const docs = querySnapshot.docs.sort((a, b) => {
                const aTime = a.data().suggestedAt?.toMillis?.() || 0;
                const bTime = b.data().suggestedAt?.toMillis?.() || 0;
                return bTime - aTime;
            });
            
            const doc = docs[0];
            const data = doc.data();
            return {
                id: doc.id,
                workout: data.workout,
                suggestedAt: data.suggestedAt?.toDate?.().toISOString() || data.suggestedAt,
                acceptedAt: data.acceptedAt?.toDate?.().toISOString() || data.acceptedAt,
                completedAt: data.completedAt?.toDate?.().toISOString() || data.completedAt,
                status: data.status,
                date: data.date,
            } as WorkoutOfDay;
        } catch (error) {
            console.error("Error fetching workout of day:", error);
            return null;
        }
    },

    saveWorkoutOfDay: async (userId: string, wod: WorkoutOfDay): Promise<string> => {
        if (!userId) throw new Error("User ID is required");
        
        try {
            const wodRef = getWorkoutOfDayCollection(userId);
            const { id, ...wodData } = wod;
            
            const dataToSave = {
                ...wodData,
                workout: wodData.workout,
                suggestedAt: Timestamp.fromDate(new Date(wodData.suggestedAt)),
                acceptedAt: wodData.acceptedAt ? Timestamp.fromDate(new Date(wodData.acceptedAt)) : null,
                completedAt: wodData.completedAt ? Timestamp.fromDate(new Date(wodData.completedAt)) : null,
            };
            
            if (id) {
                // Update existing
                const docRef = doc(db, "users", userId, "workoutOfDay", id);
                await updateDoc(docRef, dataToSave);
                return id;
            } else {
                // Create new
                const docRef = await addDoc(wodRef, dataToSave);
                return docRef.id;
            }
        } catch (error) {
            console.error("Error saving workout of day:", error);
            throw error;
        }
    },

    acceptWorkoutOfDay: async (userId: string, wodId: string): Promise<void> => {
        if (!userId || !wodId) throw new Error("User ID and WOD ID are required");
        
        try {
            const wodRef = doc(db, "users", userId, "workoutOfDay", wodId);
            await updateDoc(wodRef, {
                status: "accepted",
                acceptedAt: Timestamp.now(),
            });
        } catch (error) {
            console.error("Error accepting workout of day:", error);
            throw error;
        }
    },

    completeWorkoutOfDay: async (userId: string, wodId: string): Promise<void> => {
        if (!userId || !wodId) throw new Error("User ID and WOD ID are required");
        
        try {
            const wodRef = doc(db, "users", userId, "workoutOfDay", wodId);
            await updateDoc(wodRef, {
                status: "completed",
                completedAt: Timestamp.now(),
            });
        } catch (error) {
            console.error("Error completing workout of day:", error);
            throw error;
        }
    },

    // User Profile management
    getUserProfile: async (userId: string): Promise<UserProfile | null> => {
        if (!userId) return null;
        
        try {
            const profileRef = getUserProfileDoc(userId);
            const profileDoc = await getDoc(profileRef);
            
            if (!profileDoc.exists()) {
                return null;
            }
            
            const data = profileDoc.data();
            return {
                age: data.age,
                weight: data.weight,
                gender: data.gender,
                goals: data.goals,
                workoutsPerWeek: data.workoutsPerWeek,
                maxDailyCalories: data.maxDailyCalories,
                completedOnboarding: data.completedOnboarding || false,
                createdAt: data.createdAt?.toDate?.().toISOString() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.().toISOString() || data.updatedAt,
            } as UserProfile;
        } catch (error) {
            console.error("Error fetching user profile:", error);
            return null;
        }
    },

    saveUserProfile: async (userId: string, profile: Omit<UserProfile, "createdAt" | "updatedAt" | "completedOnboarding">): Promise<void> => {
        if (!userId) throw new Error("User ID is required");
        
        try {
            const profileRef = getUserProfileDoc(userId);
            const existingDoc = await getDoc(profileRef);
            const now = new Date();
            
            // Calculate max daily calories based on goals, weight, age, gender
            let maxDailyCalories = profile.maxDailyCalories;
            if (!maxDailyCalories) {
                // Basic BMR calculation (Mifflin-St Jeor Equation)
                // BMR = 10 * weight(kg) + 6.25 * height(cm) - 5 * age + gender_factor
                // Using average height estimation if not provided: 170cm for men, 160cm for women
                const estimatedHeight = profile.gender === "male" ? 170 : 160;
                let bmr: number;
                if (profile.gender === "male") {
                    bmr = 10 * profile.weight + 6.25 * estimatedHeight - 5 * profile.age + 5;
                } else {
                    bmr = 10 * profile.weight + 6.25 * estimatedHeight - 5 * profile.age - 161;
                }
                
                // Activity multiplier (sedentary = 1.2, light = 1.375, moderate = 1.55, active = 1.725)
                const activityMultiplier = profile.workoutsPerWeek <= 1 ? 1.2 : 
                                         profile.workoutsPerWeek <= 3 ? 1.375 :
                                         profile.workoutsPerWeek <= 5 ? 1.55 : 1.725;
                
                const tdee = bmr * activityMultiplier;
                
                // Adjust based on goals
                switch (profile.goals) {
                    case "lose_weight":
                        maxDailyCalories = Math.round(tdee * 0.85); // 15% deficit
                        break;
                    case "gain_weight":
                        maxDailyCalories = Math.round(tdee * 1.15); // 15% surplus
                        break;
                    case "build_muscle":
                        maxDailyCalories = Math.round(tdee * 1.1); // 10% surplus
                        break;
                    case "maintain":
                    case "improve_fitness":
                    default:
                        maxDailyCalories = Math.round(tdee);
                        break;
                }
            }
            
            const profileData = {
                ...profile,
                maxDailyCalories,
                completedOnboarding: true,
                createdAt: existingDoc.exists() 
                    ? (existingDoc.data().createdAt || Timestamp.fromDate(now))
                    : Timestamp.fromDate(now),
                updatedAt: Timestamp.fromDate(now),
            };
            
            await setDoc(profileRef, profileData);
        } catch (error) {
            console.error("Error saving user profile:", error);
            throw error;
        }
    },
};
