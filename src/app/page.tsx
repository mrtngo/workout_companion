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
  TrendingUp
} from "lucide-react";
import { storage, Workout, Meal, WorkoutOfDay, UserProfile } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";
import { apiUrl } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const { language, t } = useLanguage();
  
  const [now, setNow] = useState<Date | null>(null);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [workoutOfDay, setWorkoutOfDay] = useState<WorkoutOfDay | null>(null);
  const [ultrahumanData, setUltrahumanData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

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
  
  const consumedCalories = todayMeals.reduce((acc, m) => acc + (m.calories || 0), 0);
  const consumedProtein = todayMeals.reduce((acc, m) => acc + (m.protein || 0), 0);
  const consumedCarbs = todayMeals.reduce((acc, m) => acc + (m.carbs || 0), 0);
  const consumedFat = todayMeals.reduce((acc, m) => acc + (m.fats || 0), 0);

  // Readiness ring logic
  const readinessScore = ultrahumanData?.recovery?.score || ultrahumanData?.sleep?.score || 84;
  
  // Whoop / Ultrahuman Data display mapping
  const hrvVal = ultrahumanData?.recovery?.hrv || 62;
  const rhrVal = ultrahumanData?.recovery?.restingHr || 54;
  const sleepVal = ultrahumanData?.sleep?.duration || 7.4;
  // Compute Strain based on active minutes
  const strainVal = ultrahumanData?.activity?.activeMinutes 
    ? (ultrahumanData.activity.activeMinutes / 10).toFixed(1) 
    : "11.2";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0d0d0d] text-neutral-400">
        <div className="font-mono-jetbrains text-sm">{t("home.loading")}</div>
      </div>
    );
  }

  const hrvLabel = language === "es" ? "VFC" : "HRV";
  const rhrLabel = language === "es" ? "FCR" : "RHR";
  const sleepLabel = language === "es" ? "SUEÑO" : "SLEEP";
  const strainLabel = language === "es" ? "ESFUERZO" : "STRAIN";

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white bg-glow-lime pb-32">
      <div className="max-w-md mx-auto px-6 pt-16">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <div className="font-mono-jetbrains text-[10px] tracking-[0.14em] text-neutral-500 uppercase">
              {formattedDate}
            </div>
            <h1 className="text-2xl font-medium tracking-tight mt-1">
              {greeting}, {userName}.
            </h1>
          </div>
          <Link href="/profile">
            <div className="w-10 h-10 rounded-full border border-white/14 flex items-center justify-center font-mono-jetbrains text-xs text-white font-medium hover:bg-white/5 active:scale-95 transition-all cursor-pointer">
              {userInitials}
            </div>
          </Link>
        </div>

        {/* Readiness Section */}
        <div className="mb-9">
          <div className="flex justify-between items-baseline mb-4">
            <div className="font-mono-jetbrains text-[10px] tracking-[0.14em] text-neutral-500 uppercase">
              {t("home.readiness")}
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.90_0.22_128)] shadow-[0_0_8px_oklch(0.90_0.22_128)] animate-pulse-live" />
              <div className="font-mono-jetbrains text-[10px] tracking-[0.14em] text-white uppercase">
                {language === "es" ? "En vivo · Anillo" : "Live · Ring"}
              </div>
            </div>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div>
              <div className="font-mono-jetbrains text-[108px] font-light leading-[0.9] tracking-[-0.04em]">
                {readinessScore}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[oklch(0.90_0.22_128)] text-[oklch(0.20_0.06_128)] font-mono-jetbrains text-[9px] font-bold tracking-[0.04em]">
                  ✦ {t("home.primed")}
                </div>
                <div className="font-mono-jetbrains text-[10px] text-neutral-500">
                  {language === "es" ? "+6 vs prom." : "+6 vs avg"}
                </div>
              </div>
            </div>
            {/* SVG readiness ring */}
            <div className="relative w-[88px] h-[88px] flex-shrink-0">
              <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
                <circle cx="44" cy="44" r="38" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="2" />
                <circle 
                  cx="44" 
                  cy="44" 
                  r="38" 
                  fill="none" 
                  stroke="oklch(0.90 0.22 128)" 
                  strokeWidth="2"
                  strokeDasharray={`${(readinessScore / 100) * 238.7} 238.7`} 
                  strokeLinecap="butt" 
                />
              </svg>
            </div>
          </div>

          {/* 4-column data strip */}
          <div className="grid grid-cols-4 mt-6 border-y border-white/8">
            {[
              { label: hrvLabel, value: hrvVal, unit: "ms" },
              { label: rhrLabel, value: rhrVal, unit: "bpm" },
              { label: sleepLabel, value: sleepVal, unit: "h" },
              { label: strainLabel, value: strainVal, unit: "" },
            ].map((item, idx) => (
              <div 
                key={item.label} 
                className={cn(
                  "py-3.5 px-2",
                  idx < 3 ? "border-r border-white/8" : ""
                )}
              >
                <div className="font-mono-jetbrains text-[9px] tracking-[0.14em] text-neutral-500 uppercase">{item.label}</div>
                <div className="font-mono-jetbrains text-[16px] font-medium mt-1.5 tracking-tight">
                  {item.value}
                  <span className="text-[10px] text-neutral-500 font-normal ml-0.5">{item.unit}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Workout Section */}
        {workoutOfDay ? (
          <div className="mb-9">
            <div className="flex justify-between items-baseline mb-3">
              <div className="font-mono-jetbrains text-[10px] tracking-[0.14em] text-neutral-500 uppercase">
                {t("home.programmedToday")}
              </div>
              <div className="font-mono-jetbrains text-[10px] tracking-[0.14em] text-neutral-400 uppercase">
                {language === "es" ? "Selección de hoy" : "Today's Selection"}
              </div>
            </div>

            <div className="bg-neutral-900 border border-white/8 p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-1 h-full bg-[oklch(0.90_0.22_128)]" />

              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="font-mono-jetbrains text-[9px] text-[oklch(0.90_0.22_128)] tracking-[0.16em] font-semibold uppercase mb-1">
                    {workoutOfDay.workout.exercises.length > 3 
                      ? (language === "es" ? "CUERPO COMPLETO" : "FULL BODY")
                      : (language === "es" ? "DIVIDIDO" : "SPLIT")} · DAY
                  </div>
                  <h3 className="text-xl font-medium tracking-tight leading-tight">
                    {workoutOfDay.workout.name}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="font-mono-jetbrains text-[20px] tracking-tight">60′</div>
                  <div className="font-mono-jetbrains text-[9px] text-neutral-500 uppercase mt-0.5">
                    {t("est")}
                  </div>
                </div>
              </div>

              {/* Exercise lists */}
              <div className="border-t border-white/8 pt-3 space-y-1">
                {workoutOfDay.workout.exercises.map((exercise, idx) => {
                  const setSample = exercise.sets[0];
                  return (
                    <div 
                      key={exercise.id} 
                      className="grid grid-cols-[24px_1fr_auto_auto] items-center gap-3 py-2 border-b border-white/8 last:border-0"
                    >
                      <div className="font-mono-jetbrains text-[10px] text-neutral-500">
                        {String(idx + 1).padStart(2, "0")}
                      </div>
                      <div className="text-sm truncate pr-2">{exercise.name}</div>
                      <div className="font-mono-jetbrains text-[10.5px] text-neutral-400">
                        {exercise.sets.length} × {setSample?.reps || 10}
                      </div>
                      <div className="font-mono-jetbrains text-[10.5px] text-[oklch(0.90_0.22_128)] min-w-[40px] text-right font-medium">
                        {setSample?.weight > 0 ? `${setSample.weight}kg` : (language === "es" ? "PC" : "BW")}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Start Session CTA */}
              <button 
                onClick={() => router.push(`/workout/session?wodId=${workoutOfDay.id}`)}
                className="w-full mt-4 py-3 bg-[oklch(0.90_0.22_128)] text-[oklch(0.20_0.06_128)] border-0 font-mono-jetbrains text-[11px] font-bold tracking-[0.14em] uppercase flex items-center justify-center gap-1.5 hover:opacity-95 active:scale-[0.98] transition-all cursor-pointer"
              >
                {t("home.startSession")} <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-9">
            <div className="flex justify-between items-baseline mb-3">
              <div className="font-mono-jetbrains text-[10px] tracking-[0.14em] text-neutral-500 uppercase">
                {t("home.programmedToday")}
              </div>
            </div>
            <div className="border border-dashed border-white/14 p-8 text-center text-neutral-400">
              <Dumbbell className="h-8 w-8 mx-auto mb-3 opacity-30 text-[oklch(0.90_0.22_128)]" />
              <p className="text-sm">
                {language === "es" ? "No hay entrenamiento sugerido para hoy." : "No workout suggested for today yet."}
              </p>
              <button 
                onClick={() => router.push("/workout")} 
                className="mt-3 font-mono-jetbrains text-[10px] tracking-wider text-[oklch(0.90_0.22_128)] uppercase font-semibold hover:underline cursor-pointer"
              >
                {language === "es" ? "Registrar entreno manualmente +" : "Log a workout manually +"}
              </button>
            </div>
          </div>
        )}

        {/* Intake progress bar & macros */}
        <div>
          <div className="flex justify-between items-baseline mb-3">
            <div className="font-mono-jetbrains text-[10px] tracking-[0.14em] text-neutral-500 uppercase">
              {t("home.intake")}
            </div>
            <div className="font-mono-jetbrains text-[10px] tracking-[0.14em] text-neutral-300 uppercase">
              {consumedCalories.toLocaleString()} / {calorieTarget.toLocaleString()} kcal
            </div>
          </div>

          {/* intake progress bar */}
          <div className="flex gap-1 h-1.5 bg-neutral-900 border border-white/8 mb-4 overflow-hidden">
            <div 
              style={{ width: `${Math.min((consumedProtein / proteinTarget) * 33, 33)}%` }} 
              className="bg-[oklch(0.90_0.22_128)] h-full" 
            />
            <div 
              style={{ width: `${Math.min((consumedCarbs / carbsTarget) * 33, 33)}%` }} 
              className="bg-[oklch(0.78_0.16_60)] h-full" 
            />
            <div 
              style={{ width: `${Math.min((consumedFat / fatTarget) * 33, 33)}%` }} 
              className="bg-purple-500 h-full" 
            />
          </div>

          {/* Macros 3-col values */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: t("protein"), val: consumedProtein, target: proteinTarget, color: "text-[oklch(0.90_0.22_128)]" },
              { label: t("carbs"), val: consumedCarbs, target: carbsTarget, color: "text-[oklch(0.78_0.16_60)]" },
              { label: t("fat"), val: consumedFat, target: fatTarget, color: "text-purple-400" },
            ].map((m) => (
              <div key={m.label}>
                <div className="font-mono-jetbrains text-[9px] tracking-[0.14em] text-neutral-500 uppercase">{m.label}</div>
                <div className="font-mono-jetbrains text-[15px] mt-1">
                  {m.val}g
                  <span className="text-[10px] text-neutral-500 font-normal"> / {m.target}g</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
