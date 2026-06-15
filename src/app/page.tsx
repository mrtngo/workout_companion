"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Play, 
  Flame, 
  Dumbbell, 
  Activity, 
  Clock, 
  Plus, 
  User, 
  CheckCircle2, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  Sun,
  Moon
} from "lucide-react";
import { storage, Workout, Meal, WorkoutOfDay, UserProfile } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { apiUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { language, t } = useLanguage();
  
  const [now, setNow] = useState<Date | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [workoutOfDay, setWorkoutOfDay] = useState<WorkoutOfDay | null>(null);
  const [ultrahumanData, setUltrahumanData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // New Generic Stats State
  const [activeStatsTab, setActiveStatsTab] = useState<"activity" | "ring">("activity");
  const [waterIntake, setWaterIntake] = useState(1.0); // Liters
  const [stepsCount, setStepsCount] = useState(7820);

  useEffect(() => {
    setNow(new Date());
    const clockInterval = setInterval(() => setNow(new Date()), 1000 * 60);
    return () => clearInterval(clockInterval);
  }, []);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const [w, m, profile] = await Promise.all([
          storage.getWorkouts(user.uid),
          storage.getMeals(user.uid),
          storage.getUserProfile(user.uid),
        ]);
        setWorkouts(w);
        setMeals(m);
        setUserProfile(profile);

        // Load Workout of Day
        const todayDate = new Date().toISOString().split("T")[0];
        const wod = await storage.getWorkoutOfDay(user.uid, todayDate);
        setWorkoutOfDay(wod);
      } catch (err) {
        console.error("Error loading home data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();

    // Fetch Ultrahuman data
    fetch(apiUrl("/api/ultrahuman"))
      .then(res => res.json())
      .then(data => {
        if (data && !data.error) {
          setUltrahumanData(data);
        }
      })
      .catch(err => console.error("Failed to fetch Ultrahuman data:", err));
  }, [user]);

  // Load generic activity state from localStorage
  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const savedWater = localStorage.getItem(`water_${todayStr}`);
    if (savedWater) {
      setWaterIntake(parseFloat(savedWater));
    } else {
      setWaterIntake(1.0);
    }
    
    const savedSteps = localStorage.getItem(`steps_${todayStr}`);
    if (savedSteps) {
      setStepsCount(parseInt(savedSteps));
    } else {
      const baseSteps = 6800 + Math.floor(Math.random() * 2000);
      setStepsCount(baseSteps);
      localStorage.setItem(`steps_${todayStr}`, String(baseSteps));
    }
  }, []);

  const addWater = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const newWater = Math.round((waterIntake + 0.25) * 100) / 100;
    setWaterIntake(newWater);
    localStorage.setItem(`water_${todayStr}`, String(newWater));
  };

  // Greeting logic
  const greeting = useMemo(() => {
    if (!now) return t("home.greeting");
    const h = now.getHours();
    if (h < 6) return t("home.night");
    if (h < 12) return t("home.morning");
    if (h < 19) return t("home.afternoon");
    return t("home.evening");
  }, [now, t]);

  // Dynamic values
  const formattedDate = useMemo(() => {
    if (!now) return "";
    const MONTHS = language === "es" 
      ? ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"]
      : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const DAYS = language === "es"
      ? ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return `${DAYS[now.getDay()]} · ${MONTHS[now.getMonth()]} ${now.getDate()} · ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  }, [now, language]);

  const userName = useMemo(() => {
    if (user?.displayName) return user.displayName.split(" ")[0];
    if (user?.email) return user.email.split("@")[0];
    return t("home.greeting");
  }, [user, t]);

  const userInitials = useMemo(() => {
    if (user?.displayName) {
      const parts = user.displayName.split(" ");
      return parts.map(p => p[0]).join("").toUpperCase().slice(0, 2);
    }
    if (user?.email) return user.email.slice(0, 2).toUpperCase();
    return "AT";
  }, [user]);

  // Macro Target computations
  const calorieTarget = userProfile?.maxDailyCalories || 2400;
  const proteinTarget = Math.round((calorieTarget * 0.3) / 4);
  const carbsTarget = Math.round((calorieTarget * 0.45) / 4);
  const fatTarget = Math.round((calorieTarget * 0.25) / 9);

  // Today's Intake summaries
  const today = new Date().toISOString().split("T")[0];
  const todayMeals = useMemo(() => meals.filter(m => m.date.startsWith(today)), [meals, today]);
  const todayWorkouts = useMemo(() => workouts.filter(w => w.date.startsWith(today)), [workouts, today]);
  
  const consumedCalories = todayMeals.reduce((acc, m) => acc + (m.calories || 0), 0);
  const consumedProtein = todayMeals.reduce((acc, m) => acc + (m.protein || 0), 0);
  const consumedCarbs = todayMeals.reduce((acc, m) => acc + (m.carbs || 0), 0);
  const consumedFat = todayMeals.reduce((acc, m) => acc + (m.fats || 0), 0);

  // Generic Workout Streak calculation
  const workoutStreak = useMemo(() => {
    if (workouts.length === 0) return 0;
    
    const workoutDates = new Set(workouts.map(w => {
      if (!w.date) return "";
      try {
        return w.date.split("T")[0];
      } catch {
        return "";
      }
    }).filter(Boolean));
    
    let streak = 0;
    let checkDate = new Date();
    const todayStr = checkDate.toISOString().split("T")[0];
    if (!workoutDates.has(todayStr)) {
      checkDate.setDate(checkDate.getDate() - 1);
    }
    
    for (let i = 0; i < 30; i++) {
      const dateStr = checkDate.toISOString().split("T")[0];
      if (workoutDates.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }
    return streak || 1;
  }, [workouts]);

  // Generic Active Calories Burned calculation
  const activeBurn = useMemo(() => {
    if (todayWorkouts.length > 0) {
      let totalSets = 0;
      todayWorkouts.forEach(w => {
        if (w.exercises) {
          w.exercises.forEach(ex => {
            if (ex.sets) totalSets += ex.sets.length;
          });
        }
      });
      return 150 + totalSets * 25; // Base 150 + 25 per set
    }
    return 80; // Minimal baseline active burn
  }, [todayWorkouts]);

  // Generic Daily Progress Score (completion score)
  const completionScore = useMemo(() => {
    const stepsPct = Math.min(stepsCount / 10000, 1);
    const waterPct = Math.min(waterIntake / 2.5, 1);
    const nutritionPct = todayMeals.length > 0 ? 1 : 0;
    const workoutPct = todayWorkouts.length > 0 ? 1 : 0;
    
    const total = (stepsPct * 25) + (waterPct * 25) + (nutritionPct * 25) + (workoutPct * 25);
    return Math.round(total);
  }, [stepsCount, waterIntake, todayMeals, todayWorkouts]);

  // Readiness ring logic
  const readinessScore = ultrahumanData?.recovery?.score || ultrahumanData?.sleep?.score || 84;
  
  // Whoop / Ultrahuman Data display mapping
  const hrvVal = ultrahumanData?.recovery?.hrv || 62;
  const rhrVal = ultrahumanData?.recovery?.restingHr || 54;
  const sleepVal = ultrahumanData?.sleep?.duration || 7.4;
  const strainVal = ultrahumanData?.activity?.activeMinutes 
    ? (ultrahumanData.activity.activeMinutes / 10).toFixed(1) 
    : "11.2";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-muted-foreground">
        <div className="font-mono-jetbrains text-sm">{t("home.loading")}</div>
      </div>
    );
  }

  const hrvLabel = language === "es" ? "VFC" : "HRV";
  const rhrLabel = language === "es" ? "FCR" : "RHR";
  const sleepLabel = language === "es" ? "SUEÑO" : "SLEEP";
  const strainLabel = language === "es" ? "ESFUERZO" : "STRAIN";

  return (
    <div className="min-h-screen bg-background text-foreground bg-glow-lime pb-32">
      <div className="max-w-md mx-auto px-6 pt-16">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="font-mono-jetbrains text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              {formattedDate}
            </div>
            <h1 className="text-2xl font-medium tracking-tight mt-1 text-foreground">
              {greeting}, {userName}.
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-foreground hover:bg-foreground/5 active:scale-95 transition-all cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link href="/profile">
              <div className="w-10 h-10 rounded-full border border-border flex items-center justify-center font-mono-jetbrains text-xs text-foreground font-medium hover:bg-foreground/5 active:scale-95 transition-all cursor-pointer">
                {userInitials}
              </div>
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mb-9">
          {/* Header & Tabs */}
          <div className="flex justify-between items-center mb-4">
            <div className="font-mono-jetbrains text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              {activeStatsTab === "activity" 
                ? (language === "es" ? "ACTIVIDAD DIARIA" : "DAILY ACTIVITY") 
                : t("home.readiness")}
            </div>
            
            <div className="flex bg-secondary border border-border rounded-full p-0.5 font-mono-jetbrains text-[9px] font-semibold tracking-wider">
              <button
                onClick={() => setActiveStatsTab("activity")}
                className={cn(
                  "px-2.5 py-1 rounded-full uppercase transition-all cursor-pointer",
                  activeStatsTab === "activity"
                    ? "bg-primary text-primary-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {language === "es" ? "Actividad" : "Activity"}
              </button>
              <button
                onClick={() => setActiveStatsTab("ring")}
                className={cn(
                  "px-2.5 py-1 rounded-full uppercase transition-all cursor-pointer flex items-center gap-1",
                  activeStatsTab === "ring"
                    ? "bg-primary text-primary-foreground shadow-sm font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className="w-1 h-1 rounded-full bg-current animate-pulse" />
                {language === "es" ? "Anillo" : "Ring"}
              </button>
            </div>
          </div>

          {activeStatsTab === "activity" ? (
            /* ACTIVITY STATS VIEW */
            <>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="font-mono-jetbrains text-[108px] font-light leading-[0.9] tracking-[-0.04em] text-foreground">
                    {completionScore}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary text-primary-foreground font-mono-jetbrains text-[9px] font-bold tracking-[0.04em]">
                      ✦ {completionScore >= 75 ? (language === "es" ? "EXCELENTE" : "CRUSHING IT") : (language === "es" ? "EN PROGRESO" : "IN PROGRESS")}
                    </div>
                    <div className="font-mono-jetbrains text-[10px] text-muted-foreground">
                      {language === "es" 
                        ? `${[todayMeals.length > 0, todayWorkouts.length > 0, stepsCount >= 10000, waterIntake >= 2.5].filter(Boolean).length} de 4 objetivos`
                        : `${[todayMeals.length > 0, todayWorkouts.length > 0, stepsCount >= 10000, waterIntake >= 2.5].filter(Boolean).length} of 4 goals met`
                      }
                    </div>
                  </div>
                </div>
                {/* SVG circular progress ring */}
                <div className="relative w-[88px] h-[88px] flex-shrink-0">
                  <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
                    <circle cx="44" cy="44" r="38" fill="none" stroke="var(--border)" strokeWidth="2" />
                    <circle 
                      cx="44" 
                      cy="44" 
                      r="38" 
                      fill="none" 
                      stroke="var(--primary)" 
                      strokeWidth="2"
                      strokeDasharray={`${(completionScore / 100) * 238.7} 238.7`} 
                      strokeLinecap="butt" 
                    />
                  </svg>
                </div>
              </div>

              {/* 4-column activity data strip */}
              <div className="grid grid-cols-4 mt-6 border-y border-border">
                {[
                  { 
                    label: language === "es" ? "PASOS" : "STEPS", 
                    value: stepsCount.toLocaleString(), 
                    unit: "/ 10k",
                    action: null 
                  },
                  { 
                    label: language === "es" ? "QUEMA ACT." : "ACTIVE BURN", 
                    value: activeBurn, 
                    unit: "kcal",
                    action: null
                  },
                  { 
                    label: language === "es" ? "AGUA (+)" : "WATER (+)", 
                    value: `${waterIntake.toFixed(2)}L`, 
                    unit: "/ 2.5L",
                    action: addWater,
                    highlight: true
                  },
                  { 
                    label: language === "es" ? "RACHA" : "STREAK", 
                    value: workoutStreak, 
                    unit: language === "es" ? "días" : "days",
                    action: null
                  },
                ].map((item, idx) => {
                  const contentMarkup = (
                    <>
                      <div className="font-mono-jetbrains text-[9px] tracking-[0.14em] text-muted-foreground uppercase flex items-center gap-0.5 justify-center sm:justify-start">
                        {item.label}
                        {item.highlight && <span className="text-primary font-bold animate-pulse">•</span>}
                      </div>
                      <div className="font-mono-jetbrains text-[16px] font-medium mt-1.5 tracking-tight text-foreground">
                        {item.value}
                        <span className="text-[9px] text-muted-foreground font-normal ml-0.5">{item.unit}</span>
                      </div>
                    </>
                  );
                  
                  if (item.action) {
                    return (
                      <button 
                        key={item.label}
                        onClick={item.action}
                        type="button"
                        className={cn(
                          "py-3.5 px-2 text-left hover:bg-primary/5 active:scale-95 transition-all cursor-pointer select-none outline-none",
                          idx < 3 ? "border-r border-border" : ""
                        )}
                      >
                        {contentMarkup}
                      </button>
                    );
                  }

                  return (
                    <div 
                      key={item.label} 
                      className={cn(
                        "py-3.5 px-2 text-left",
                        idx < 3 ? "border-r border-border" : ""
                      )}
                    >
                      {contentMarkup}
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* SMART RING VIEW */
            <>
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="font-mono-jetbrains text-[108px] font-light leading-[0.9] tracking-[-0.04em] text-foreground">
                    {readinessScore}
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-primary text-primary-foreground font-mono-jetbrains text-[9px] font-bold tracking-[0.04em]">
                      ✦ {t("home.primed")}
                    </div>
                    <div className="font-mono-jetbrains text-[10px] text-muted-foreground">
                      {language === "es" ? "+6 vs prom." : "+6 vs avg"}
                    </div>
                  </div>
                </div>
                {/* SVG readiness ring */}
                <div className="relative w-[88px] h-[88px] flex-shrink-0">
                  <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
                    <circle cx="44" cy="44" r="38" fill="none" stroke="var(--border)" strokeWidth="2" />
                    <circle 
                      cx="44" 
                      cy="44" 
                      r="38" 
                      fill="none" 
                      stroke="var(--primary)" 
                      strokeWidth="2"
                      strokeDasharray={`${(readinessScore / 100) * 238.7} 238.7`} 
                      strokeLinecap="butt" 
                    />
                  </svg>
                </div>
              </div>

              {/* 4-column data strip */}
              <div className="grid grid-cols-4 mt-6 border-y border-border">
                {[
                  { label: hrvLabel, value: hrvVal, unit: "ms" },
                  { label: rhrLabel, value: rhrVal, unit: "bpm" },
                  { label: sleepLabel, value: sleepVal, unit: "h" },
                  { label: strainLabel, value: strainVal, unit: "" },
                ].map((item, idx) => (
                  <div 
                    key={item.label} 
                    className={cn(
                      "py-3.5 px-2 text-left",
                      idx < 3 ? "border-r border-border" : ""
                    )}
                  >
                    <div className="font-mono-jetbrains text-[9px] tracking-[0.14em] text-muted-foreground uppercase">{item.label}</div>
                    <div className="font-mono-jetbrains text-[16px] font-medium mt-1.5 tracking-tight text-foreground">
                      {item.value}
                      <span className="text-[10px] text-muted-foreground font-normal ml-0.5">{item.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Today's Workout Section */}
        {workoutOfDay ? (
          <div className="mb-9">
            <div className="flex justify-between items-baseline mb-3">
              <div className="font-mono-jetbrains text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                {t("home.programmedToday")}
              </div>
              <div className="font-mono-jetbrains text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                {language === "es" ? "Selección de hoy" : "Today's Selection"}
              </div>
            </div>

            <div className="bg-card border border-border p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1 h-full bg-primary" />

              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="font-mono-jetbrains text-[9px] text-primary tracking-[0.16em] font-semibold uppercase mb-1">
                    {workoutOfDay.workout.exercises.length > 3 
                      ? (language === "es" ? "CUERPO COMPLETO" : "FULL BODY")
                      : (language === "es" ? "DIVIDIDO" : "SPLIT")} · DAY
                  </div>
                  <h3 className="text-xl font-medium tracking-tight leading-tight text-foreground">
                    {workoutOfDay.workout.name}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="font-mono-jetbrains text-[20px] tracking-tight text-foreground">60′</div>
                  <div className="font-mono-jetbrains text-[9px] text-muted-foreground uppercase mt-0.5">
                    {t("est")}
                  </div>
                </div>
              </div>

              {/* Exercise lists */}
              <div className="border-t border-border pt-3 space-y-1">
                {workoutOfDay.workout.exercises.map((exercise, idx) => {
                  const setSample = exercise.sets[0];
                  return (
                    <div 
                      key={exercise.id} 
                      className="grid grid-cols-[24px_1fr_auto_auto] items-center gap-3 py-2 border-b border-border last:border-0"
                    >
                      <div className="font-mono-jetbrains text-[10px] text-muted-foreground">
                        {String(idx + 1).padStart(2, "0")}
                      </div>
                      <div className="text-sm truncate pr-2 text-foreground">{exercise.name}</div>
                      <div className="font-mono-jetbrains text-[10.5px] text-muted-foreground">
                        {exercise.sets.length} × {setSample?.reps || 10}
                      </div>
                      <div className="font-mono-jetbrains text-[10.5px] text-primary min-w-[40px] text-right font-medium">
                        {setSample?.weight > 0 ? `${setSample.weight}kg` : (language === "es" ? "PC" : "BW")}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Start Session CTA */}
              <button 
                onClick={() => router.push(`/workout/session?wodId=${workoutOfDay.id}`)}
                className="w-full mt-4 py-3 bg-primary text-primary-foreground border-0 font-mono-jetbrains text-[11px] font-bold tracking-[0.14em] uppercase flex items-center justify-center gap-1.5 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
              >
                {t("home.startSession")} <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-9">
            <div className="flex justify-between items-baseline mb-3">
              <div className="font-mono-jetbrains text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
                {t("home.programmedToday")}
              </div>
            </div>
            <div className="border border-dashed border-border p-8 text-center text-muted-foreground">
              <Dumbbell className="h-8 w-8 mx-auto mb-3 opacity-30 text-primary" />
              <p className="text-sm">
                {language === "es" ? "No hay entrenamiento sugerido para hoy." : "No workout suggested for today yet."}
              </p>
              <button 
                onClick={() => router.push("/workout")} 
                className="mt-3 font-mono-jetbrains text-[10px] tracking-wider text-primary uppercase font-semibold hover:underline cursor-pointer"
              >
                {language === "es" ? "Registrar entreno manualmente +" : "Log a workout manually +"}
              </button>
            </div>
          </div>
        )}

        {/* Intake progress bar & macros */}
        <div>
          <div className="flex justify-between items-baseline mb-3">
            <div className="font-mono-jetbrains text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
              {t("home.intake")}
            </div>
            <div className="font-mono-jetbrains text-[10px] tracking-[0.14em] text-foreground uppercase">
              {consumedCalories.toLocaleString()} / {calorieTarget.toLocaleString()} kcal
            </div>
          </div>

          {/* intake progress bar */}
          <div className="flex gap-1 h-1.5 bg-card border border-border mb-4 overflow-hidden">
            <div 
              style={{ width: `${Math.min((consumedProtein / proteinTarget) * 33, 33)}%` }} 
              className="bg-primary h-full" 
            />
            <div 
              style={{ width: `${Math.min((consumedCarbs / carbsTarget) * 33, 33)}%` }} 
              className="bg-[var(--warm-orange)] h-full" 
            />
            <div 
              style={{ width: `${Math.min((consumedFat / fatTarget) * 33, 33)}%` }} 
              className="bg-purple-500 h-full" 
            />
          </div>

          {/* Macros 3-col values */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: t("protein"), val: consumedProtein, target: proteinTarget, color: "text-primary" },
              { label: t("carbs"), val: consumedCarbs, target: carbsTarget, color: "text-[var(--warm-orange)]" },
              { label: t("fat"), val: consumedFat, target: fatTarget, color: "text-purple-500 dark:text-purple-400" },
            ].map((m) => (
              <div key={m.label}>
                <div className="font-mono-jetbrains text-[9px] tracking-[0.14em] text-muted-foreground uppercase">{m.label}</div>
                <div className="font-mono-jetbrains text-[15px] mt-1 text-foreground">
                  {m.val}g
                  <span className="text-[10px] text-muted-foreground font-normal"> / {m.target}g</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
