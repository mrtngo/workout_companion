"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { Activity, Flame, Trophy, Sparkles, Send, LogOut, CheckCircle2, Dumbbell } from "lucide-react";
import { generateAvatarUrl } from "@/lib/avatar";
import Link from "next/link";
import { storage, WorkoutOfDay, UserProfile } from "@/lib/storage";
import { aiLogic } from "@/lib/ai-logic";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ workouts: 0, calories: 0 });
  const [suggestion, setSuggestion] = useState("");
  const [quickLog, setQuickLog] = useState("");
  const [ultrahumanData, setUltrahumanData] = useState<any>(null);
  const [workoutOfDay, setWorkoutOfDay] = useState<WorkoutOfDay | null>(null);
  const [isLoadingWOD, setIsLoadingWOD] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      // Load stats
      const workouts = await storage.getWorkouts(user.uid);
      const meals = await storage.getMeals(user.uid);

      // Simple weekly workout count (mock logic for now, just counts all)
      const workoutCount = workouts.length;

      // Daily calories
      const today = new Date().toISOString().split('T')[0];
      const dailyCalories = meals
        .filter(m => m.date.startsWith(today))
        .reduce((acc, m) => acc + m.calories, 0);

      setStats({ workouts: workoutCount, calories: dailyCalories });

      // Load user profile
      const profile = await storage.getUserProfile(user.uid);
      setUserProfile(profile);

      // Load or generate workout of the day
      const todayDate = new Date().toISOString().split('T')[0];
      let wod = await storage.getWorkoutOfDay(user.uid, todayDate);
      
      if (!wod) {
        // Generate a new suggestion based on history and profile
        const suggestedWorkout = aiLogic.suggestWorkoutFromHistory(workouts, profile);
        if (suggestedWorkout) {
          const newWOD: WorkoutOfDay = {
            id: "",
            workout: suggestedWorkout,
            suggestedAt: new Date().toISOString(),
            status: "suggested",
            date: todayDate,
          };
          const wodId = await storage.saveWorkoutOfDay(user.uid, newWOD);
          wod = { ...newWOD, id: wodId };
        }
      }
      
      setWorkoutOfDay(wod);
      setIsLoadingWOD(false);
    };

    loadData();

    // Fetch Ultrahuman data
    fetch("/api/ultrahuman")
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setUltrahumanData(data);
        }
      })
      .catch(err => console.error("Failed to fetch Ultrahuman data:", err));

    // Generate suggestion
    setSuggestion(aiLogic.generateSuggestion());

    // Generate avatar
    if (user) {
      const seed = user.email || user.uid;
      setAvatarUrl(generateAvatarUrl(seed));
    }
  }, [user]);

  const handleQuickLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickLog.trim() || !user) return;

    // Pass the input to the assistant page via query param or just navigate
    // For simplicity, we'll just navigate to assistant with the input pre-filled 
    // (requires modifying assistant page to read query param, or we just process it here)

    // Let's process it here for "magic" feel, then redirect to relevant page
    const response = aiLogic.processInput(quickLog);

    if (response.action === "LOG_MEAL" && response.data) {
      await storage.saveMeal(user.uid, response.data);
      router.push("/nutrition");
    } else if (response.action === "LOG_WORKOUT" && response.data) {
      await storage.saveWorkout(user.uid, response.data);
      router.push("/workout");
    } else {
      // If unsure, go to assistant
      router.push("/assistant");
    }
  };

  const handleAcceptWorkout = async () => {
    if (!user || !workoutOfDay) return;
    
    try {
      await storage.acceptWorkoutOfDay(user.uid, workoutOfDay.id);
      const updatedWOD = await storage.getWorkoutOfDay(user.uid);
      setWorkoutOfDay(updatedWOD);
    } catch (error) {
      console.error("Error accepting workout:", error);
    }
  };

  const handleCompleteWorkout = async () => {
    if (!user || !workoutOfDay) return;
    
    try {
      // Save the workout as completed
      const completedWorkout = {
        ...workoutOfDay.workout,
        date: new Date().toISOString(),
      };
      await storage.saveWorkout(user.uid, completedWorkout);
      
      // Mark workout of day as completed
      await storage.completeWorkoutOfDay(user.uid, workoutOfDay.id);
      
      // Reload data
      const todayDate = new Date().toISOString().split('T')[0];
      const updatedWOD = await storage.getWorkoutOfDay(user.uid, todayDate);
      setWorkoutOfDay(updatedWOD);
      
      // Reload stats
      const workouts = await storage.getWorkouts(user.uid);
      setStats(prev => ({ ...prev, workouts: workouts.length }));
      
      router.push("/workout");
    } catch (error) {
      console.error("Error completing workout:", error);
    }
  };

  return (
    <div className="p-4 space-y-6 pb-24">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Hello, {user?.displayName || user?.email?.split('@')[0] || 'User'}</h1>
          <p className="text-muted-foreground">Ready to crush it today?</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/profile">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="Profile"
                className="h-10 w-10 rounded-full border-2 border-primary/20 cursor-pointer hover:border-primary/40 transition-colors"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
            )}
          </Link>
        </div>
      </header>

      {/* Workout of the Day Card */}
      {!isLoadingWOD && workoutOfDay && (
        <Card className="bg-gradient-to-br from-orange-500 to-red-600 text-white border-none shadow-lg">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <Dumbbell className="h-5 w-5 text-yellow-300" />
              <CardTitle className="text-base font-semibold">Workout of the Day</CardTitle>
            </div>
            {workoutOfDay.status === "completed" && (
              <CheckCircle2 className="h-5 w-5 text-green-300" />
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <h3 className="font-bold text-lg mb-2">{workoutOfDay.workout.name}</h3>
              <div className="space-y-2">
                {workoutOfDay.workout.exercises.map((exercise, idx) => (
                  <div key={idx} className="text-sm bg-white/10 rounded p-2">
                    <div className="font-semibold">{exercise.name}</div>
                    <div className="text-xs opacity-90">
                      {exercise.sets.length} sets × {exercise.sets[0]?.reps || 0} reps
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              {workoutOfDay.status === "suggested" && (
                <Button
                  onClick={handleAcceptWorkout}
                  className="flex-1 bg-white text-orange-600 hover:bg-white/90"
                  size="sm"
                >
                  Accept Workout
                </Button>
              )}
              {workoutOfDay.status === "accepted" && (
                <Button
                  onClick={handleCompleteWorkout}
                  className="flex-1 bg-green-500 hover:bg-green-600"
                  size="sm"
                >
                  Mark as Completed
                </Button>
              )}
              {workoutOfDay.status === "completed" && (
                <div className="flex-1 text-center text-sm opacity-90">
                  ✓ Completed today
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Suggestion Card */}
      <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-lg">
        <CardHeader className="pb-2 flex flex-row items-center gap-2">
          <Sparkles className="h-5 w-5 text-yellow-300" />
          <CardTitle className="text-base font-semibold">Daily Suggestion</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm font-medium leading-relaxed" dangerouslySetInnerHTML={{ __html: suggestion.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
        </CardContent>
      </Card>

      {/* Quick Log Input */}
      <form onSubmit={handleQuickLog} className="relative">
        <Input
          placeholder="Quick log: 'I ate a banana' or 'I did 50 squats'"
          className="pr-10 h-12 shadow-sm"
          value={quickLog}
          onChange={(e) => setQuickLog(e.target.value)}
        />
        <Button
          type="submit"
          size="icon"
          variant="ghost"
          className="absolute right-1 top-1 h-10 w-10 text-muted-foreground hover:text-primary"
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Workouts</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.workouts}</div>
            <p className="text-xs text-muted-foreground">Total logged</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Calories</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.calories}
              {userProfile?.maxDailyCalories && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  / {userProfile.maxDailyCalories}
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Consumed today
              {userProfile?.maxDailyCalories && (
                <span className={`ml-2 ${
                  stats.calories > userProfile.maxDailyCalories 
                    ? "text-destructive" 
                    : stats.calories > userProfile.maxDailyCalories * 0.9 
                    ? "text-yellow-600" 
                    : "text-green-600"
                }`}>
                  ({Math.round((stats.calories / userProfile.maxDailyCalories) * 100)}%)
                </span>
              )}
            </p>
            {userProfile?.maxDailyCalories && (
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all ${
                    stats.calories > userProfile.maxDailyCalories 
                      ? "bg-destructive" 
                      : stats.calories > userProfile.maxDailyCalories * 0.9 
                      ? "bg-yellow-600" 
                      : "bg-green-600"
                  }`}
                  style={{ width: `${Math.min((stats.calories / userProfile.maxDailyCalories) * 100, 100)}%` }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ultrahuman Health Metrics */}
      {ultrahumanData && (
        <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-semibold">Health Metrics (Ultrahuman)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3 text-center">
              {ultrahumanData.sleep && (
                <div className="bg-white/20 rounded-lg p-3">
                  <div className="text-2xl font-bold">{ultrahumanData.sleep.score}</div>
                  <div className="text-xs opacity-90">Sleep Score</div>
                  <div className="text-xs opacity-75 mt-1">{ultrahumanData.sleep.duration}h</div>
                </div>
              )}
              {ultrahumanData.recovery && (
                <div className="bg-white/20 rounded-lg p-3">
                  <div className="text-2xl font-bold">{ultrahumanData.recovery.score}</div>
                  <div className="text-xs opacity-90">Recovery</div>
                  <div className="text-xs opacity-75 mt-1">HRV: {ultrahumanData.recovery.hrv}</div>
                </div>
              )}
              {ultrahumanData.activity && (
                <div className="bg-white/20 rounded-lg p-3">
                  <div className="text-2xl font-bold">{Math.round(ultrahumanData.activity.steps / 1000)}k</div>
                  <div className="text-xs opacity-90">Steps</div>
                  <div className="text-xs opacity-75 mt-1">{ultrahumanData.activity.activeMinutes}min</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 gap-4">
          <Link href="/workout">
            <Button className="w-full" size="lg">
              Start Workout
            </Button>
          </Link>
          <Link href="/nutrition">
            <Button variant="outline" className="w-full" size="lg">
              Log Meal
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
