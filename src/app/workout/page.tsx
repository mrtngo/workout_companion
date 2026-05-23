"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Calendar, 
  Dumbbell, 
  ChevronDown, 
  ChevronUp, 
  Edit, 
  Trash2, 
  CheckSquare, 
  Square,
  Zap,
  ArrowRight,
  TrendingUp,
  X
} from "lucide-react";
import Link from "next/link";
import { storage, Workout } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";
import { useLanguage } from "@/lib/i18n";

type GroupByOption = "day" | "week" | "month" | "none";

interface SparklineProps {
  data: number[];
  w?: number;
  h?: number;
  color?: string;
  fill?: boolean;
}

// Sparkline component matching redesign aesthetics
function Sparkline({ data, w = 80, h = 20, color = "oklch(0.90 0.22 128)", fill = false }: SparklineProps) {
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / Math.max(data.length - 1, 1)) * w;
    const y = h - ((v - min) / range) * h;
    return [x, y];
  });
  const d = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
  const dFill = d + ` L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      {fill && <path d={dFill} fill={color} opacity="0.12" />}
      <path d={d} stroke={color} strokeWidth="1.5" fill="none" />
    </svg>
  );
}

export default function WorkoutPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { language, t } = useLanguage();
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set());
    const [selectedWorkouts, setSelectedWorkouts] = useState<Set<string>>(new Set());
    const [groupBy, setGroupBy] = useState<GroupByOption>("day");
    const [activeFilter, setActiveFilter] = useState<string>("All");
    const [userProfile, setUserProfile] = useState<any>(null);

    useEffect(() => {
        if (!user) return;
        
        const loadData = async () => {
            const [wData, profile] = await Promise.all([
                storage.getWorkouts(user.uid),
                storage.getUserProfile(user.uid)
            ]);
            setWorkouts(wData);
            setUserProfile(profile);
        };
        
        loadData();
    }, [user]);

    const toggleWorkout = (workoutId: string) => {
        setExpandedWorkouts(prev => {
            const next = new Set(prev);
            if (next.has(workoutId)) {
                next.delete(workoutId);
            } else {
                next.add(workoutId);
            }
            return next;
        });
    };

    const toggleSelectWorkout = (workoutId: string) => {
        setSelectedWorkouts(prev => {
            const next = new Set(prev);
            if (next.has(workoutId)) {
                next.delete(workoutId);
            } else {
                next.add(workoutId);
            }
            return next;
        });
    };

    const selectAllWorkouts = () => {
        if (selectedWorkouts.size === filteredWorkouts.length) {
            setSelectedWorkouts(new Set());
        } else {
            setSelectedWorkouts(new Set(filteredWorkouts.map(w => w.id)));
        }
    };

    const handleEdit = (workout: Workout) => {
        sessionStorage.setItem('editWorkout', JSON.stringify(workout));
        router.push('/workout/log?edit=true');
    };

    const handleDelete = async (workoutId: string) => {
        if (!user) return;
        const confirmMsg = language === 'es' 
            ? '¿Estás seguro de que deseas eliminar este entrenamiento?' 
            : 'Are you sure you want to delete this workout?';
        if (!confirm(confirmMsg)) return;
        
        try {
            await storage.deleteWorkout(user.uid, workoutId);
            setWorkouts(prev => prev.filter(w => w.id !== workoutId));
            setSelectedWorkouts(prev => {
                const next = new Set(prev);
                next.delete(workoutId);
                return next;
            });
        } catch (error) {
            console.error('Error deleting workout:', error);
            alert(language === 'es' ? 'Error al eliminar el entrenamiento' : 'Failed to delete workout');
        }
    };

    const handleBulkDelete = async () => {
        if (!user || selectedWorkouts.size === 0) return;
        const confirmMsg = language === 'es'
            ? `¿Estás seguro de que deseas eliminar ${selectedWorkouts.size} entrenamiento(s)?`
            : `Are you sure you want to delete ${selectedWorkouts.size} workout(s)?`;
        if (!confirm(confirmMsg)) return;
        
        try {
            await storage.deleteWorkouts(user.uid, Array.from(selectedWorkouts));
            setWorkouts(prev => prev.filter(w => !selectedWorkouts.has(w.id)));
            setSelectedWorkouts(new Set());
        } catch (error) {
            console.error('Error deleting workouts:', error);
            alert(language === 'es' ? 'Error al eliminar los entrenamientos' : 'Failed to delete workouts');
        }
    };

    // Calculate PR sets across all history
    const exercisePRs = useMemo(() => {
        const prMap: Record<string, number> = {}; // exercise -> max weight
        const chronological = [...workouts].reverse();
        const prCountPerWorkout: Record<string, number> = {};

        chronological.forEach((workout) => {
            let count = 0;
            workout.exercises.forEach((ex) => {
                const exName = ex.name.trim().toLowerCase();
                ex.sets.forEach((set) => {
                    if (set.completed && set.weight > 0 && set.reps > 0) {
                        const currentMax = prMap[exName] || 0;
                        if (set.weight > currentMax) {
                            prMap[exName] = set.weight;
                            count++;
                        }
                    }
                });
            });
            prCountPerWorkout[workout.id] = count;
        });

        return prCountPerWorkout;
    }, [workouts]);

    // Filter workouts by active category chip
    const filteredWorkouts = useMemo(() => {
        if (activeFilter === "All") return workouts;
        return workouts.filter(w => {
            const hasMatchInName = w.name.toLowerCase().includes(activeFilter.toLowerCase());
            const hasMatchInExerciseGroup = w.exercises.some(ex => 
                ex.group?.toLowerCase() === activeFilter.toLowerCase() ||
                ex.name.toLowerCase().includes(activeFilter.toLowerCase())
            );
            return hasMatchInName || hasMatchInExerciseGroup;
        });
    }, [workouts, activeFilter]);

    // Grouping logic for rendering lists
    const groupWorkouts = (list: Workout[], option: GroupByOption): Record<string, Workout[]> => {
        if (option === "none") {
            const allKey = language === "es" ? "Todos los Entrenamientos" : "All Workouts";
            return { [allKey]: list };
        }

        const grouped: Record<string, Workout[]> = {};
        const locale = language === "es" ? "es-ES" : "en-US";

        list.forEach(workout => {
            const date = new Date(workout.date);
            let key: string;

            if (option === "day") {
                key = date.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            } else if (option === "week") {
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1));
                const datePart = weekStart.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
                key = language === "es" ? `Semana del ${datePart}` : `Week of ${datePart}`;
            } else if (option === "month") {
                key = date.toLocaleDateString(locale, { year: 'numeric', month: 'long' });
            } else {
                key = language === "es" ? "Todos los Entrenamientos" : "All Workouts";
            }

            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(workout);
        });

        return grouped;
    };

    const groupedWorkouts = useMemo(() => {
        return groupWorkouts(filteredWorkouts, groupBy);
    }, [filteredWorkouts, groupBy, language]);

    // Calculate weekly snapshot metrics
    const workoutsThisWeek = useMemo(() => {
        const now = new Date();
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        const startOfWeek = new Date(now.setDate(diff));
        startOfWeek.setHours(0, 0, 0, 0);

        return workouts.filter(w => new Date(w.date) >= startOfWeek);
    }, [workouts]);

    const weeklySessions = workoutsThisWeek.length;
    const weeklyVolume = useMemo(() => {
        const totalKg = workoutsThisWeek.reduce((sum, w) => {
            return sum + w.exercises.reduce((exSum, ex) => {
                return exSum + ex.sets.reduce((setSum, s) => setSum + (s.completed ? s.weight * s.reps : 0), 0);
            }, 0);
        }, 0);
        return (totalKg / 1000).toFixed(1);
    }, [workoutsThisWeek]);

    const weeklyPRs = useMemo(() => {
        return workoutsThisWeek.reduce((sum, w) => sum + (exercisePRs[w.id] || 0), 0);
    }, [workoutsThisWeek, exercisePRs]);

    // Sparkline points (daily volumes for the last 7 days)
    const last7DaysVolumes = useMemo(() => {
        const vols = [0, 0, 0, 0, 0, 0, 0];
        const now = new Date();
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(now.getDate() - (6 - i));
            const dStr = d.toISOString().split("T")[0];
            const dayWorkouts = workouts.filter(w => w.date.startsWith(dStr));
            const dayWeight = dayWorkouts.reduce((sum, w) => {
                return sum + w.exercises.reduce((exSum, ex) => {
                    return exSum + ex.sets.reduce((setSum, s) => setSum + (s.completed ? s.weight * s.reps : 0), 0);
                }, 0);
            }, 0);
            vols[i] = dayWeight / 1000;
        }
        return vols;
    }, [workouts]);

    // Calculate parameters for list rows
    const getWorkoutDetails = (w: Workout) => {
        const setsCount = w.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
        const totalWeight = w.exercises.reduce((sum, ex) => {
            return sum + ex.sets.reduce((setSum, s) => setSum + (s.completed ? s.weight * s.reps : 0), 0);
        }, 0);
        const volTonnes = totalWeight / 1000;
        const volStr = volTonnes < 0.1 ? `${totalWeight}kg` : `${volTonnes.toFixed(1)}t`;

        // Estimate duration based on sets (3 mins per set + 10 mins warmup)
        const estDuration = setsCount * 3 + 10;

        const dateObj = new Date(w.date);
        const dateStr = `${String(dateObj.getMonth() + 1).padStart(2, '0')}.${String(dateObj.getDate()).padStart(2, '0')}`;
        
        // Day label
        const todayStr = new Date().toISOString().split("T")[0];
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        const workoutDateStr = w.date.split("T")[0];

        let dayLabel = dateObj.toLocaleDateString(language === "es" ? "es-ES" : "en-US", { weekday: 'short' }).toUpperCase();
        if (workoutDateStr === todayStr) dayLabel = language === "es" ? "HOY" : "TOD";
        else if (workoutDateStr === yesterdayStr) dayLabel = language === "es" ? "AYER" : "YST";

        return {
            setsCount,
            volStr,
            estDuration,
            dateStr,
            dayLabel
        };
    };

    const getFilterLabel = (cat: string) => {
        if (cat === "All") return language === "es" ? "Todos" : "All";
        if (cat === "Push") return language === "es" ? "Empuje" : "Push";
        if (cat === "Pull") return language === "es" ? "Tracción" : "Pull";
        if (cat === "Legs") return language === "es" ? "Piernas" : "Legs";
        return cat;
    };

    return (
        <div className="min-h-screen bg-[#0d0d0d] text-white bg-glow-lime pb-32">
            <div className="max-w-md mx-auto px-6 pt-16">
                
                {/* Header */}
                <header className="flex justify-between items-end mb-6">
                    <div>
                        <div className="text-[10px] uppercase font-mono-jetbrains tracking-[0.16em] text-neutral-500 mb-1">
                            {t("train.trainingLog")}
                        </div>
                        <h1 className="text-3xl font-medium tracking-tight">{t("train.sessions")}</h1>
                    </div>
                    <Link href="/workout/log">
                        <Button className="w-10 h-10 rounded-none bg-[oklch(0.90_0.22_128)] hover:bg-[oklch(0.90_0.22_128)]/90 text-[oklch(0.20_0.06_128)] flex items-center justify-center border-none p-0 cursor-pointer">
                            <Plus className="h-5 w-5 stroke-[2.5]" />
                        </Button>
                    </Link>
                </header>

                {/* Weekly Snapshot */}
                <section className="border border-white/8 p-4 bg-neutral-950/40 relative overflow-hidden mb-6">
                    <div className="absolute top-0 right-0 w-1 h-full bg-[oklch(0.90_0.22_128)]" />
                    <div className="flex justify-between items-center mb-4">
                        <div className="text-[10px] uppercase font-mono-jetbrains tracking-[0.16em] text-neutral-400">
                            {t("train.thisWeek")}
                        </div>
                        <Sparkline data={last7DaysVolumes} w={80} h={20} />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <div className="text-[9px] uppercase font-mono-jetbrains tracking-[0.12em] text-neutral-500 mb-1">
                                {t("train.sessions")}
                            </div>
                            <div className="font-mono-jetbrains text-2xl font-medium tracking-tight">
                                {weeklySessions}<span className="text-neutral-500 text-xs ml-0.5 font-normal">/{userProfile?.workoutsPerWeek || 6}</span>
                            </div>
                        </div>
                        <div>
                            <div className="text-[9px] uppercase font-mono-jetbrains tracking-[0.12em] text-neutral-500 mb-1">
                                {t("train.volume")}
                            </div>
                            <div className="font-mono-jetbrains text-2xl font-medium tracking-tight">
                                {weeklyVolume}<span className="text-neutral-500 text-xs ml-0.5 font-normal">t</span>
                            </div>
                        </div>
                        <div>
                            <div className="text-[9px] uppercase font-mono-jetbrains tracking-[0.12em] text-neutral-500 mb-1">
                                {t("train.prs")}
                            </div>
                            <div className="font-mono-jetbrains text-2xl font-medium tracking-tight">
                                {weeklyPRs}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Filters */}
                <div className="space-y-4 mb-6">
                    <div className="flex gap-1.5 overflow-x-auto scrollbar-hide py-1">
                        {["All", "Push", "Pull", "Legs", "Core"].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveFilter(cat)}
                                className={`px-3 py-1 font-mono-jetbrains text-[10px] tracking-wider uppercase transition-colors cursor-pointer border rounded-none ${
                                    activeFilter === cat 
                                    ? "bg-[oklch(0.90_0.22_128)] text-[oklch(0.20_0.06_128)] border-[oklch(0.90_0.22_128)] font-semibold" 
                                    : "bg-neutral-950/20 text-neutral-400 border-white/8 hover:text-white"
                                }`}
                            >
                                {getFilterLabel(cat)}
                            </button>
                        ))}
                    </div>

                    {/* Group By Selector & Bulk Action Tools */}
                    {filteredWorkouts.length > 0 && (
                        <div className="flex justify-between items-center border-t border-white/8 pt-3">
                            <div className="flex gap-1">
                                {(["day", "week", "month", "none"] as GroupByOption[]).map((opt) => (
                                    <button
                                        key={opt}
                                        onClick={() => setGroupBy(opt)}
                                        className={`px-2 py-0.5 font-mono-jetbrains text-[8px] tracking-widest uppercase border rounded-none cursor-pointer ${
                                            groupBy === opt 
                                            ? "border-[oklch(0.90_0.22_128)] text-[oklch(0.90_0.22_128)] bg-[oklch(0.90_0.22_128)]/5" 
                                            : "border-transparent text-neutral-500 hover:text-neutral-300"
                                        }`}
                                    >
                                        {opt === "none" ? t("train.flat") : (language === "es" ? (opt === "day" ? "Día" : opt === "week" ? "Semana" : "Mes") : opt)}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={selectAllWorkouts}
                                    className="flex items-center gap-1.5 px-2 py-1 bg-neutral-950/40 border border-white/8 hover:border-white/20 font-mono-jetbrains text-[8px] tracking-wider uppercase text-neutral-400 hover:text-white cursor-pointer rounded-none"
                                >
                                    {selectedWorkouts.size === filteredWorkouts.length && filteredWorkouts.length > 0 ? (
                                        <CheckSquare className="h-3 w-3 text-[oklch(0.90_0.22_128)]" />
                                    ) : (
                                        <Square className="h-3 w-3" />
                                    )}
                                    {t("train.selectAll")}
                                </button>
                                {selectedWorkouts.size > 0 && (
                                    <button
                                        onClick={handleBulkDelete}
                                        className="flex items-center gap-1 px-2 py-1 bg-red-950/20 border border-red-500/30 hover:border-red-500/60 font-mono-jetbrains text-[8px] tracking-wider uppercase text-red-400 hover:text-red-300 cursor-pointer rounded-none"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                        {t("delete")} ({selectedWorkouts.size})
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Workout List */}
                <div className="divide-y divide-white/8">
                    {filteredWorkouts.length === 0 ? (
                        <div className="text-center py-12 border border-dashed border-white/8 bg-neutral-950/20">
                            <Dumbbell className="h-8 w-8 mx-auto mb-3 text-neutral-600 animate-pulse" />
                            <div className="font-mono-jetbrains text-xs uppercase tracking-widest text-neutral-400">
                                {t("train.noSessions")}
                            </div>
                            <Link href="/workout/log" className="text-[oklch(0.90_0.22_128)] font-mono-jetbrains text-[10px] tracking-wider uppercase hover:underline mt-3 block">
                                {t("train.createFirst")}
                            </Link>
                        </div>
                    ) : (
                        Object.entries(groupedWorkouts).map(([groupKey, groupWorkouts]) => (
                            <div key={groupKey} className="space-y-0">
                                {groupBy !== "none" && (
                                    <div className="flex items-center gap-3 pt-4 pb-2">
                                        <span className="font-mono-jetbrains text-[9px] tracking-[0.16em] text-[oklch(0.90_0.22_128)] font-bold uppercase">
                                            {groupKey}
                                        </span>
                                        <div className="h-px flex-1 bg-white/8"></div>
                                    </div>
                                )}
                                {groupWorkouts.map((workout) => {
                                    const isExpanded = expandedWorkouts.has(workout.id);
                                    const isSelected = selectedWorkouts.has(workout.id);
                                    const { setsCount, volStr, estDuration, dateStr, dayLabel } = getWorkoutDetails(workout);
                                    const prCount = exercisePRs[workout.id] || 0;

                                    return (
                                        <div 
                                            key={workout.id} 
                                            className={`py-4 transition-colors ${
                                                isSelected ? "bg-[oklch(0.90_0.22_128)]/5" : ""
                                            }`}
                                        >
                                            <div className="flex gap-4 items-center">
                                                {/* Select button */}
                                                <button
                                                    onClick={() => toggleSelectWorkout(workout.id)}
                                                    className="p-1 hover:bg-neutral-900 rounded-none cursor-pointer"
                                                >
                                                    {isSelected ? (
                                                        <CheckSquare className="h-4 w-4 text-[oklch(0.90_0.22_128)]" />
                                                    ) : (
                                                        <Square className="h-4 w-4 text-neutral-600" />
                                                    )}
                                                </button>
                                
                                                {/* Date & Day */}
                                                <div className="w-12 flex-shrink-0">
                                                    <div className="font-mono-jetbrains text-[9px] text-neutral-500 tracking-[0.12em] uppercase leading-none">
                                                        {dayLabel}
                                                    </div>
                                                    <div className="font-mono-jetbrains text-sm font-semibold text-white mt-1 leading-none">
                                                        {dateStr}
                                                    </div>
                                                </div>
                                
                                                {/* Details */}
                                                <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleWorkout(workout.id)}>
                                                    <h3 className="text-sm font-medium text-white mb-1 truncate hover:text-[oklch(0.90_0.22_128)] transition-colors">
                                                        {workout.name}
                                                    </h3>
                                                    <div className="flex gap-1.5 items-center font-mono-jetbrains text-[9px] text-neutral-500 tracking-wider uppercase leading-none">
                                                        <span>{estDuration}′</span>
                                                        <span>·</span>
                                                        <span>{volStr}</span>
                                                        <span>·</span>
                                                        <span>{setsCount} {language === "es" ? "series" : "sets"}</span>
                                                    </div>
                                                </div>
                                
                                                {/* PR / Action indicators */}
                                                <div className="flex items-center gap-2" onClick={() => toggleWorkout(workout.id)}>
                                                    {prCount > 0 ? (
                                                        <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[oklch(0.90_0.22_128)] text-[oklch(0.20_0.06_128)] font-mono-jetbrains text-[8px] font-bold tracking-wider uppercase leading-none">
                                                            <Zap className="h-2 w-2 fill-current" />
                                                            {prCount} {language === "es" ? "RÉCORD" : "PR"}
                                                        </div>
                                                    ) : (
                                                        <div className="text-neutral-600 hover:text-neutral-400">
                                                            <ArrowRight className="h-3 w-3" />
                                                        </div>
                                                    )}
                                                    <button className="p-1 text-neutral-500 hover:text-white cursor-pointer">
                                                        {isExpanded ? (
                                                            <ChevronUp className="h-4 w-4" />
                                                        ) : (
                                                            <ChevronDown className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                
                                            {/* Expanded workout sets content */}
                                            {isExpanded && (
                                                <div className="mt-4 ml-6 p-4 border border-white/8 bg-neutral-950/40 relative">
                                                    <div className="absolute top-2 right-2 flex gap-1">
                                                        <button
                                                            onClick={() => handleEdit(workout)}
                                                            className="p-1 text-neutral-400 hover:text-[oklch(0.90_0.22_128)] cursor-pointer"
                                                            title={t("train.editWorkout")}
                                                        >
                                                            <Edit className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(workout.id)}
                                                            className="p-1 text-neutral-400 hover:text-red-400 cursor-pointer"
                                                            title={t("train.deleteWorkout")}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                
                                                    <div className="space-y-4">
                                                        {workout.exercises.map((ex, exIdx) => (
                                                            <div key={ex.id || exIdx} className="space-y-1.5">
                                                                <div className="font-medium text-xs text-[oklch(0.90_0.22_128)]">
                                                                    {String(exIdx+1).padStart(2, '0')} · {ex.name}
                                                                </div>
                                                                {ex.group && (
                                                                    <div className="font-mono-jetbrains text-[8px] tracking-widest text-neutral-500 uppercase leading-none">
                                                                        {ex.group}
                                                                    </div>
                                                                )}
                                                                
                                                                {/* Sets table */}
                                                                <div className="border border-white/4 divide-y divide-white/4">
                                                                    <div className="grid grid-cols-4 gap-2 bg-neutral-900/50 p-1.5 font-mono-jetbrains text-[8px] tracking-wider uppercase text-neutral-500">
                                                                        <div>{t("set")}</div>
                                                                        <div>{t("weight")}</div>
                                                                        <div>{t("reps")}</div>
                                                                        <div className="text-right">{t("status")}</div>
                                                                    </div>
                                                                    {ex.sets.map((set, setIdx) => (
                                                                        <div 
                                                                            key={set.id || setIdx} 
                                                                            className="grid grid-cols-4 gap-2 p-1.5 items-center font-mono-jetbrains text-[10px] text-neutral-300"
                                                                        >
                                                                            <div>{setIdx + 1}</div>
                                                                            <div className="text-white">{set.weight > 0 ? `${set.weight} kg` : "-"}</div>
                                                                            <div className="text-white">{set.reps}</div>
                                                                            <div className="text-right text-[8px]">
                                                                                {set.completed ? (
                                                                                    <span className="text-[oklch(0.90_0.22_128)] font-bold">✓ {t("done").toUpperCase()}</span>
                                                                                ) : (
                                                                                    <span className="text-neutral-500">-</span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
