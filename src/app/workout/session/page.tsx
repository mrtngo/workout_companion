"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { 
  Play, 
  Pause, 
  Plus, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Check, 
  X, 
  PlusCircle, 
  Dumbbell,
  AlertCircle
} from "lucide-react";
import { storage, Workout, Exercise, WorkoutSet } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/i18n";

// Format seconds into MM:SS
function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function SessionScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { language, t } = useLanguage();
  
  const wodId = searchParams.get("wodId");

  // Timer states
  const [duration, setDuration] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Workout state
  const [workoutName, setWorkoutName] = useState(language === "es" ? "Sesión en Vivo" : "Live Session");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [activeExIdx, setActiveExIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Rest timer states
  const [isResting, setIsResting] = useState(false);
  const [restTarget, setRestTarget] = useState(120); // 2 minutes in seconds
  const [restElapsed, setRestElapsed] = useState(0);

  // Adding new exercise inline state
  const [newExName, setNewExName] = useState("");
  const [newExGroup, setNewExGroup] = useState("");
  const [showAddExForm, setShowAddExForm] = useState(false);

  // Timer intervals refs
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const restTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial Load: active session from localStorage OR WOD OR default
  useEffect(() => {
    if (!user) return;

    const loadSession = async () => {
      try {
        // Try localStorage first for ongoing session
        const saved = localStorage.getItem(`active_session_${user.uid}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setWorkoutName(parsed.workoutName || (language === "es" ? "Sesión en Vivo" : "Live Session"));
          setExercises(parsed.exercises || []);
          setActiveExIdx(parsed.activeExIdx || 0);
          setDuration(parsed.duration || 0);
          setIsPaused(parsed.isPaused || false);
          if (parsed.isResting) {
            setIsResting(true);
            setRestTarget(parsed.restTarget || 120);
            setRestElapsed(parsed.restElapsed || 0);
          }
          setIsLoading(false);
          return;
        }

        // If WOD parameter, fetch WOD
        if (wodId) {
          const todayDate = new Date().toISOString().split("T")[0];
          const wod = await storage.getWorkoutOfDay(user.uid, todayDate);
          if (wod && wod.id === wodId) {
            setWorkoutName(wod.workout.name || (language === "es" ? "Pecho & Tríceps" : "Chest & Triceps"));
            setExercises(wod.workout.exercises || []);
            setIsLoading(false);
            return;
          }
        }

        // Default layout
        setWorkoutName(language === "es" ? "Pecho & Tríceps" : "Chest & Triceps");
        setExercises([
          {
            id: "ex-1",
            name: language === "es" ? "Press de Banca" : "Bench Press",
            group: "PUSH",
            sets: [
              { id: "set-1", weight: 80, reps: 8, completed: false },
              { id: "set-2", weight: 80, reps: 8, completed: false },
              { id: "set-3", weight: 85, reps: 6, completed: false },
            ]
          },
          {
            id: "ex-2",
            name: language === "es" ? "Press Inclinado con Mancuernas" : "Incline DB Press",
            group: "PUSH",
            sets: [
              { id: "set-4", weight: 32, reps: 8, completed: false },
              { id: "set-5", weight: 32, reps: 8, completed: false },
            ]
          }
        ]);
      } catch (err) {
        console.error("Error setting up session:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();
  }, [user, wodId, language]);

  // 2. Active Session Autosave
  useEffect(() => {
    if (!user || isLoading) return;

    const sessionState = {
      workoutName,
      exercises,
      activeExIdx,
      duration,
      isPaused,
      isResting,
      restTarget,
      restElapsed
    };

    localStorage.setItem(`active_session_${user.uid}`, JSON.stringify(sessionState));
  }, [user, workoutName, exercises, activeExIdx, duration, isPaused, isResting, restTarget, restElapsed, isLoading]);

  // 3. Workout timer interval
  useEffect(() => {
    if (isPaused || isLoading) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPaused, isLoading]);

  // 4. Rest timer interval
  useEffect(() => {
    if (!isResting || isLoading) {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
      return;
    }

    restTimerRef.current = setInterval(() => {
      setRestElapsed((prev) => {
        if (prev >= restTarget) {
          setIsResting(false);
          if (restTimerRef.current) clearInterval(restTimerRef.current);
          // Play a small default beep sound if possible
          try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            osc.connect(ctx.destination);
            osc.frequency.setValueAtTime(800, ctx.currentTime);
            osc.start();
            osc.stop(ctx.currentTime + 0.15);
          } catch(e){}
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => {
      if (restTimerRef.current) clearInterval(restTimerRef.current);
    };
  }, [isResting, restTarget, isLoading]);

  // Current active exercise
  const currentExercise = exercises[activeExIdx];

  // Modify set values
  const handleSetChange = (setId: string, field: "weight" | "reps" | "rpe", value: number) => {
    setExercises((prev) =>
      prev.map((ex) => ({
        ...ex,
        sets: ex.sets.map((s) => {
          if (s.id === setId) {
            return { ...s, [field]: value };
          }
          return s;
        })
      }))
    );
  };

  // Toggle completed status on a set
  const toggleSetCompleted = (setId: string) => {
    setExercises((prev) => {
      let isSetDone = false;
      const updated = prev.map((ex) => {
        const setMatches = ex.sets.some((s) => s.id === setId);
        if (!setMatches) return ex;

        return {
          ...ex,
          sets: ex.sets.map((s) => {
            if (s.id === setId) {
              isSetDone = !s.completed;
              return { ...s, completed: isSetDone };
            }
            return s;
          })
        };
      });

      // If set was checked completed, start rest timer!
      if (isSetDone) {
        setRestElapsed(0);
        setIsResting(true);
      }

      return updated;
    });
  };

  // Add a set to current active exercise
  const handleAddSet = () => {
    if (!currentExercise) return;
    const lastSet = currentExercise.sets[currentExercise.sets.length - 1];
    const newSet: WorkoutSet & { rpe?: number } = {
      id: `set-${Date.now()}`,
      weight: lastSet ? lastSet.weight : 0,
      reps: lastSet ? lastSet.reps : 0,
      completed: false,
    };

    setExercises((prev) =>
      prev.map((ex, idx) => {
        if (idx !== activeExIdx) return ex;
        return {
          ...ex,
          sets: [...ex.sets, newSet]
        };
      })
    );
  };

  // Delete a set from current exercise
  const handleDeleteSet = (setId: string) => {
    setExercises((prev) =>
      prev.map((ex, idx) => {
        if (idx !== activeExIdx) return ex;
        return {
          ...ex,
          sets: ex.sets.filter((s) => s.id !== setId)
        };
      })
    );
  };

  // Add a new exercise to session
  const handleAddExercise = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExName.trim()) return;

    const newEx: Exercise = {
      id: `ex-${Date.now()}`,
      name: newExName.trim(),
      group: newExGroup.trim().toUpperCase() || "CUSTOM",
      sets: [
        { id: `set-${Date.now()}-1`, weight: 0, reps: 0, completed: false }
      ]
    };

    setExercises((prev) => [...prev, newEx]);
    setActiveExIdx(exercises.length); // Jump to new exercise
    setNewExName("");
    setNewExGroup("");
    setShowAddExForm(false);
  };

  // End workout and save to db
  const handleFinishWorkout = async () => {
    if (!user) return;
    if (exercises.length === 0) {
      alert(t("session.alertEx"));
      return;
    }

    // Filter out exercises with no sets, and filter out sets that are uncompleted
    const processedExercises = exercises
      .map((ex) => ({
        ...ex,
        // Keep all sets, but we can set uncompleted ones to deleted or just keep them as uncompleted
        sets: ex.sets.filter((s) => s.weight > 0 && s.reps > 0)
      }))
      .filter((ex) => ex.sets.length > 0);

    if (processedExercises.length === 0) {
      alert(t("session.alertSets"));
      return;
    }

    try {
      // Create workout payload
      const workoutPayload: Workout = {
        id: "", // Will be auto-generated by Firebase
        name: workoutName,
        date: new Date().toISOString(),
        exercises: processedExercises
      };

      await storage.saveWorkout(user.uid, workoutPayload);

      // If wodId was present, mark that WOD as completed
      if (wodId) {
        await storage.completeWorkoutOfDay(user.uid, wodId);
      }

      // Clear local storage active session
      localStorage.removeItem(`active_session_${user.uid}`);

      router.push("/workout");
    } catch (error) {
      console.error("Error saving workout:", error);
      alert(language === "es" ? "No se pudo guardar el entrenamiento. Por favor intenta de nuevo." : "Failed to save workout. Please try again.");
    }
  };

  // Discard workout
  const handleDiscardWorkout = () => {
    if (confirm(t("session.discard"))) {
      if (user) {
        localStorage.removeItem(`active_session_${user.uid}`);
      }
      router.push("/workout");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0d0d0d] text-neutral-400">
        <div className="font-mono-jetbrains text-sm">
          {language === "es" ? "INICIALIZANDO TEMPORIZADOR ACTIVO..." : "INITIALIZING ACTIVE TIMER..."}
        </div>
      </div>
    );
  }

  // Next set to log
  const nextSetToLog = currentExercise?.sets.find((s) => !s.completed);

  // SVG rest circle calculations
  const pctRest = isResting ? (restElapsed / restTarget) : 0;
  const radius = 28;
  const circumference = 2 * Math.PI * radius; // ~175.9

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white bg-glow-lime pb-36">
      
      {/* Sticky Header Strip */}
      <div className="fixed top-0 left-0 right-0 z-30 bg-[#0d0d0d]/90 backdrop-blur-md border-b border-white/8 py-3 px-6 max-w-md mx-auto">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse-live" />
            <span className="font-mono-jetbrains text-[9px] text-red-500 tracking-[0.14em] uppercase font-bold">
              {t("session.recording")}
            </span>
          </div>
          <div className="font-mono-jetbrains text-sm font-semibold tracking-wider text-white">
            {formatTime(duration)}
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="w-8 h-8 border border-white/14 bg-neutral-950/20 text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer rounded-none"
              title={isPaused ? (language === "es" ? "Reanudar Sesión" : "Resume Session") : (language === "es" ? "Pausar Sesión" : "Pause Session")}
            >
              {isPaused ? <Play className="h-3.5 w-3.5 fill-current" /> : <Pause className="h-3.5 w-3.5" />}
            </button>
            <button
              onClick={handleDiscardWorkout}
              className="w-8 h-8 border border-white/14 bg-neutral-950/20 text-neutral-400 hover:text-red-400 flex items-center justify-center cursor-pointer rounded-none"
              title={language === "es" ? "Descartar Entrenamiento" : "Discard Workout"}
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-6 pt-20">
        
        {/* Workout Name Header */}
        <div className="mb-6 flex justify-between items-center">
          <input 
            type="text" 
            value={workoutName} 
            onChange={(e) => setWorkoutName(e.target.value)}
            className="bg-transparent border-b border-transparent hover:border-white/20 focus:border-[oklch(0.90_0.22_128)] focus:outline-none text-2xl font-medium tracking-tight text-white w-full py-1"
          />
        </div>

        {/* Exercises navigation tabs */}
        {exercises.length > 0 && (
          <div className="flex items-center justify-between border-b border-white/8 pb-3 mb-5">
            <button 
              onClick={() => setActiveExIdx(prev => Math.max(0, prev - 1))}
              disabled={activeExIdx === 0}
              className="p-1 text-neutral-500 hover:text-white disabled:opacity-20 cursor-pointer"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <div className="text-center">
              <div className="font-mono-jetbrains text-[9px] text-neutral-500 tracking-[0.14em] uppercase mb-1">
                {t("session.exercise")} {activeExIdx + 1} {t("session.of")} {exercises.length}
              </div>
              <h2 className="text-lg font-medium text-white truncate max-w-[200px]">
                {currentExercise?.name}
              </h2>
              {currentExercise?.group && (
                <div className="font-mono-jetbrains text-[8px] text-[oklch(0.90_0.22_128)] tracking-widest uppercase mt-0.5">
                  {currentExercise.group}
                </div>
              )}
            </div>

            <button 
              onClick={() => setActiveExIdx(prev => Math.min(exercises.length - 1, prev + 1))}
              disabled={activeExIdx === exercises.length - 1}
              className="p-1 text-neutral-500 hover:text-white disabled:opacity-20 cursor-pointer"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Sets table */}
        {currentExercise ? (
          <div className="space-y-4">
            <div className="border border-white/8 bg-neutral-950/40 p-4 relative">
              <div className="absolute top-0 right-0 w-1 h-full bg-[oklch(0.90_0.22_128)]" />
              
              <div className="grid grid-cols-5 gap-2 pb-2 mb-2 border-b border-white/8 font-mono-jetbrains text-[9px] tracking-wider uppercase text-neutral-500">
                <div>{t("set")}</div>
                <div>{t("weight")} (kg)</div>
                <div>{t("reps")}</div>
                <div>RPE</div>
                <div className="text-right">{language === "es" ? "Reg." : "Log"}</div>
              </div>

              <div className="divide-y divide-white/4">
                {currentExercise.sets.map((set, idx) => {
                  const isCurrent = !set.completed && (!currentExercise.sets[idx - 1] || currentExercise.sets[idx - 1].completed);
                  return (
                    <div 
                      key={set.id}
                      className={`grid grid-cols-5 gap-2 py-3 items-center relative ${
                        isCurrent ? "bg-[oklch(0.90_0.22_128)]/5" : ""
                      }`}
                    >
                      {/* Active indicator bar */}
                      {isCurrent && (
                        <div className="absolute left-[-16px] top-0 bottom-0 w-[2px] bg-[oklch(0.90_0.22_128)]" />
                      )}

                      {/* Set Number */}
                      <div className="font-mono-jetbrains text-sm font-semibold text-white flex items-center gap-1">
                        {String(idx + 1).padStart(2, "0")}
                        {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-[oklch(0.90_0.22_128)]" />}
                      </div>

                      {/* Weight Input */}
                      <div>
                        <input
                           type="number"
                           value={set.weight || ""}
                           placeholder="kg"
                           disabled={set.completed}
                           onChange={(e) => handleSetChange(set.id, "weight", parseFloat(e.target.value) || 0)}
                           className="w-full bg-neutral-900 border border-white/8 font-mono-jetbrains text-sm px-1.5 py-1 text-white focus:outline-none focus:border-[oklch(0.90_0.22_128)] disabled:opacity-40 disabled:border-transparent rounded-none"
                        />
                      </div>

                      {/* Reps Input */}
                      <div>
                        <input
                           type="number"
                           value={set.reps || ""}
                           placeholder="reps"
                           disabled={set.completed}
                           onChange={(e) => handleSetChange(set.id, "reps", parseInt(e.target.value) || 0)}
                           className="w-full bg-neutral-900 border border-white/8 font-mono-jetbrains text-sm px-1.5 py-1 text-white focus:outline-none focus:border-[oklch(0.90_0.22_128)] disabled:opacity-40 disabled:border-transparent rounded-none"
                        />
                      </div>

                      {/* RPE Input */}
                      <div>
                        <select
                           value={(set as any).rpe || ""}
                           disabled={set.completed}
                           onChange={(e) => handleSetChange(set.id, "rpe", parseInt(e.target.value) || 0)}
                           className="w-full bg-neutral-900 border border-white/8 font-mono-jetbrains text-xs px-1 py-1.5 text-white focus:outline-none focus:border-[oklch(0.90_0.22_128)] disabled:opacity-40 disabled:border-transparent rounded-none"
                        >
                          <option value="">-</option>
                          {[10, 9.5, 9, 8.5, 8, 7.5, 7, 6.5, 6, 5].map((val) => (
                            <option key={val} value={val}>@{val}</option>
                          ))}
                        </select>
                      </div>

                      {/* Complete Checkbox */}
                      <div className="flex justify-end items-center gap-1.5">
                        <button
                           onClick={() => toggleSetCompleted(set.id)}
                           className={`w-6 h-6 border flex items-center justify-center cursor-pointer transition-colors rounded-none ${
                             set.completed
                               ? "bg-[oklch(0.90_0.22_128)] text-[oklch(0.20_0.06_128)] border-[oklch(0.90_0.22_128)]"
                               : "border-white/14 text-transparent hover:border-white/40"
                           }`}
                        >
                          <Check className="h-3.5 w-3.5 stroke-[3]" />
                        </button>
                        <button
                           onClick={() => handleDeleteSet(set.id)}
                           className="p-1 text-neutral-600 hover:text-red-400 cursor-pointer"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Set button */}
              <button
                onClick={handleAddSet}
                className="w-full mt-3 py-2 border border-dashed border-white/14 bg-neutral-950/20 hover:bg-neutral-900/30 text-neutral-400 hover:text-white font-mono-jetbrains text-[9px] tracking-widest uppercase flex items-center justify-center gap-1 cursor-pointer rounded-none"
              >
                <Plus className="h-3.5 w-3.5" /> {t("session.addSet")}
              </button>
            </div>

            {/* Quick Log Set CTA Bar */}
            {nextSetToLog && (
              <button
                onClick={() => toggleSetCompleted(nextSetToLog.id)}
                className="w-full py-4 bg-[oklch(0.90_0.22_128)] text-[oklch(0.20_0.06_128)] border-none font-mono-jetbrains text-xs font-bold tracking-[0.16em] uppercase hover:opacity-95 active:scale-[0.98] transition-transform cursor-pointer rounded-none"
              >
                {t("session.logSet")} {currentExercise.sets.indexOf(nextSetToLog) + 1} → {nextSetToLog.weight > 0 ? `${nextSetToLog.weight}kg` : (language === "es" ? "PC" : "BW")} · {nextSetToLog.reps} reps
              </button>
            )}
          </div>
        ) : (
          <div className="text-center py-10 border border-dashed border-white/8 bg-neutral-950/20">
            <AlertCircle className="h-6 w-6 mx-auto mb-2 text-neutral-500" />
            <p className="font-mono-jetbrains text-[10px] tracking-wider uppercase text-neutral-400">
              {language === "es" ? "No se han agregado ejercicios." : "No exercises added."}
            </p>
          </div>
        )}

        {/* Rest Timer Block */}
        <div className="mt-5 border border-white/8 bg-neutral-950/40 p-4 flex justify-between items-center relative">
          <div className="absolute top-0 left-0 w-1 h-full bg-neutral-500/30" />
          {isResting && <div className="absolute top-0 left-0 w-1 h-full bg-[oklch(0.90_0.22_128)] animate-pulse" />}

          <div>
            <div className="font-mono-jetbrains text-[9px] text-neutral-500 tracking-[0.12em] uppercase">{t("session.rest")}</div>
            <div className="font-mono-jetbrains text-3xl font-medium tracking-tight mt-1.5">
              {isResting ? formatTime(restTarget - restElapsed) : "00:00"}
            </div>
            <div className="flex gap-2 items-center mt-2">
              <span className="font-mono-jetbrains text-[8px] text-neutral-500 tracking-wider uppercase">
                {t("session.target")}: {formatTime(restTarget)}
              </span>
              <button
                onClick={() => setRestTarget((prev) => prev + 30)}
                className="px-1.5 py-0.5 bg-neutral-900 border border-white/8 text-neutral-400 hover:text-white font-mono-jetbrains text-[7px] font-bold tracking-wider uppercase cursor-pointer rounded-none"
              >
                +30s
              </button>
            </div>
          </div>

          {/* SVG Rest Ring */}
          <div className="relative w-16 h-16 cursor-pointer" onClick={() => setIsResting(!isResting)}>
            <svg width="64" height="64" viewBox="0 0 64 64" className="rotate-[-90deg]">
              {/* background ring */}
              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
              {/* active progress ring */}
              <circle 
                cx="32" 
                cy="32" 
                r="28" 
                fill="none" 
                stroke={isResting ? "oklch(0.90 0.22 128)" : "rgba(255,255,255,0.2)"}
                strokeWidth="2.5" 
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={circumference * (1 - pctRest)}
                strokeLinecap="square"
                className="transition-[stroke-dashoffset] duration-1000 ease-linear"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-[oklch(0.90_0.22_128)]">
              {isResting ? <Pause className="h-4.5 w-4.5 fill-current" /> : <Play className="h-4.5 w-4.5 fill-current" />}
            </div>
          </div>
        </div>

        {/* Add Exercise Inline Form Trigger */}
        <div className="mt-5 border-t border-white/8 pt-5">
          {!showAddExForm ? (
            <button
              onClick={() => setShowAddExForm(true)}
              className="w-full py-3 border border-white/8 hover:border-white/20 bg-neutral-950/20 text-neutral-400 hover:text-white font-mono-jetbrains text-[10px] tracking-wider uppercase flex items-center justify-center gap-1.5 cursor-pointer rounded-none"
            >
              <PlusCircle className="h-4 w-4" /> {t("session.addEx")}
            </button>
          ) : (
            <form onSubmit={handleAddExercise} className="border border-white/8 bg-neutral-950/40 p-4 space-y-3">
              <div className="font-mono-jetbrains text-[9px] uppercase tracking-wider text-neutral-400">
                {t("session.newEx")}
              </div>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder={t("session.exName")}
                  value={newExName}
                  onChange={(e) => setNewExName(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/8 font-mono-jetbrains text-xs px-3 py-2 text-white focus:outline-none focus:border-[oklch(0.90_0.22_128)] rounded-none"
                  required
                />
                <input
                  type="text"
                  placeholder={t("session.exCat")}
                  value={newExGroup}
                  onChange={(e) => setNewExGroup(e.target.value)}
                  className="w-full bg-neutral-900 border border-white/8 font-mono-jetbrains text-xs px-3 py-2 text-white focus:outline-none focus:border-[oklch(0.90_0.22_128)] rounded-none"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setShowAddExForm(false)}
                  className="px-3 py-1.5 border border-white/8 font-mono-jetbrains text-[9px] tracking-wider uppercase text-neutral-400 hover:text-white cursor-pointer rounded-none"
                >
                  {t("cancel")}
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[oklch(0.90_0.22_128)] text-[oklch(0.20_0.06_128)] border-none font-mono-jetbrains text-[9px] tracking-wider uppercase font-semibold cursor-pointer rounded-none"
                >
                  {language === "es" ? "Agregar Ejercicio" : "Add Exercise"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Global Action: Finish Session */}
        <div className="mt-8 pt-5 border-t border-white/8">
          <button
            onClick={handleFinishWorkout}
            className="w-full py-4 border border-[oklch(0.90_0.22_128)] bg-[oklch(0.90_0.22_128)] hover:bg-[oklch(0.90_0.22_128)]/90 text-[oklch(0.20_0.06_128)] font-mono-jetbrains text-xs font-bold tracking-[0.2em] uppercase transition-all shadow-[0_6px_20px_rgba(168,232,55,0.15)] hover:shadow-[0_8px_24px_rgba(168,232,55,0.25)] active:scale-[0.98] cursor-pointer rounded-none"
          >
            {t("session.finish")}
          </button>
        </div>

      </div>
    </div>
  );
}
