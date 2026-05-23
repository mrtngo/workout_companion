"use client";

import { useEffect, useState, useMemo } from "react";
import { 
  TrendingUp, 
  Search, 
  Zap, 
  Calendar, 
  Activity, 
  Flame,
  Award,
  ChevronDown
} from "lucide-react";
import { storage, Workout, Meal, UserProfile } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";

type TimeRange = "1W" | "1M" | "3M" | "6M" | "All";

// Compute Streaks
function computeStreak(workouts: Workout[]): number {
    const days = new Set(workouts.map((w) => w.date.split("T")[0]));
    const sorted = Array.from(days).sort((a, b) => b.localeCompare(a));
    if (sorted.length === 0) return 0;

    let streak = 1;
    for (let i = 1; i < sorted.length; i++) {
        const prev = new Date(sorted[i - 1]);
        const curr = new Date(sorted[i]);
        const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
        if (diffDays === 1) {
            streak++;
        } else {
            break;
        }
    }
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (sorted[0] !== today && sorted[0] !== yesterday) return 0;
    return streak;
}

// Compute PRs per exercise (max weight lifted all-time)
function computePRs(workouts: Workout[]): { exercise: string; weight: number; date: string; isFresh: boolean }[] {
    const prMap = new Map<string, { weight: number; date: string }>();
    
    // Sort workouts chronologically to find progression and see which ones are fresh (e.g. within last 7 days)
    const chronological = [...workouts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    for (const workout of chronological) {
        for (const exercise of workout.exercises) {
            const maxSet = exercise.sets.reduce(
                (best, set) => (set.completed && set.weight > best ? set.weight : best),
                0
            );
            if (maxSet > 0) {
                const existing = prMap.get(exercise.name.toUpperCase());
                if (!existing || maxSet > existing.weight) {
                    prMap.set(exercise.name.toUpperCase(), { weight: maxSet, date: workout.date });
                }
            }
        }
    }

    const sevenDaysAgo = Date.now() - 7 * 86400000;

    return Array.from(prMap.entries())
        .map(([exercise, { weight, date }]) => ({
            exercise,
            weight,
            date,
            isFresh: new Date(date).getTime() >= sevenDaysAgo
        }))
        .sort((a, b) => b.weight - a.weight);
}

// Compute Strength progression history for a specific exercise
function computeStrengthHistory(workouts: Workout[], exerciseName: string): { dateStr: string; weight: number; date: string }[] {
    const history: { dateStr: string; weight: number; date: string }[] = [];
    const targetName = exerciseName.trim().toLowerCase();

    // Sort chronologically
    const chronological = [...workouts].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    chronological.forEach(workout => {
        workout.exercises.forEach(ex => {
            if (ex.name.trim().toLowerCase() === targetName) {
                const maxWeight = ex.sets.reduce((best, s) => (s.completed && s.weight > best ? s.weight : best), 0);
                if (maxWeight > 0) {
                    const dateObj = new Date(workout.date);
                    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
                    history.push({
                        dateStr: `${months[dateObj.getMonth()]} ${dateObj.getDate()}`,
                        weight: maxWeight,
                        date: workout.date
                    });
                }
            }
        });
    });

    return history;
}

// Filter data by time range
function filterByRange<T extends { date: string }>(items: T[], range: TimeRange): T[] {
    if (range === "All") return items;
    const now = Date.now();
    const days = range === "1W" ? 7 : range === "1M" ? 30 : range === "3M" ? 90 : 180;
    const cutoff = now - days * 86400000;
    return items.filter((item) => new Date(item.date).getTime() >= cutoff);
}

export default function ProgressPage() {
    const { user } = useAuth();
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [meals, setMeals] = useState<Meal[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<TimeRange>("3M");
    const [selectedExercise, setSelectedExercise] = useState<string>("");

    useEffect(() => {
        if (!user) return;
        const load = async () => {
            const [w, m, p] = await Promise.all([
                storage.getWorkouts(user.uid),
                storage.getMeals(user.uid),
                storage.getUserProfile(user.uid),
            ]);
            setWorkouts(w);
            setMeals(m);
            setUserProfile(p);
            setLoading(false);
        };
        load();
    }, [user]);

    // Active Exercise List derived from workouts
    const exerciseNames = useMemo(() => {
        const names = new Set<string>();
        workouts.forEach(w => w.exercises.forEach(e => names.add(e.name.toUpperCase())));
        return Array.from(names).sort();
    }, [workouts]);

    // Default select first exercise
    useEffect(() => {
        if (exerciseNames.length > 0 && !selectedExercise) {
            setSelectedExercise(exerciseNames[0]);
        }
    }, [exerciseNames, selectedExercise]);

    // Filter workouts/meals by range
    const filteredWorkouts = useMemo(() => filterByRange(workouts, timeRange), [workouts, timeRange]);

    // Stats calculations
    const streak = useMemo(() => computeStreak(workouts), [workouts]);
    const totalSessions = filteredWorkouts.length;
    
    const avgSessionsPerWeek = useMemo(() => {
        if (filteredWorkouts.length === 0) return "0.0";
        const dates = filteredWorkouts.map(w => new Date(w.date).getTime());
        const maxDate = Math.max(...dates);
        const minDate = Math.min(...dates);
        const diffMs = maxDate - minDate;
        const diffWeeks = Math.max(1, Math.ceil(diffMs / (7 * 86400000)));
        return (filteredWorkouts.length / diffWeeks).toFixed(1);
    }, [filteredWorkouts]);

    const totalVolumeTonnes = useMemo(() => {
        const totalKg = filteredWorkouts.reduce((sum, w) => {
            return sum + w.exercises.reduce((exSum, ex) => {
                return exSum + ex.sets.reduce((setSum, s) => setSum + (s.completed ? s.weight * s.reps : 0), 0);
            }, 0);
        }, 0);
        return (totalKg / 1000).toFixed(0);
    }, [filteredWorkouts]);

    const prs = useMemo(() => computePRs(workouts), [workouts]);

    const strengthProgression = useMemo(() => {
        if (!selectedExercise) return [];
        return computeStrengthHistory(filteredWorkouts, selectedExercise);
    }, [filteredWorkouts, selectedExercise]);

    // Calculate dynamic 1RM Estimate path for SVG
    const chartData = useMemo(() => {
        if (strengthProgression.length < 2) return null;
        
        const w = 358;
        const h = 140;
        const weights = strengthProgression.map(d => d.weight);
        const max = Math.max(...weights) * 1.05;
        const min = Math.max(0, Math.min(...weights) * 0.95);
        const range = max - min || 1;

        const pts = strengthProgression.map((p, i) => [
            (i / (strengthProgression.length - 1)) * w,
            h - ((p.weight - min) / range) * h
        ]);

        const linePath = pts.map((p, i) => (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1)).join(" ");
        const fillPath = linePath + ` L ${w} ${h} L 0 ${h} Z`;

        // Get 3 grid line height levels
        const gridLines = [0.25, 0.5, 0.75].map(p => p * h);

        return {
            pts,
            linePath,
            fillPath,
            gridLines,
            maxWeight: Math.max(...weights),
            minWeight: Math.min(...weights)
        };
    }, [strengthProgression]);

    // Calculate percentage increase
    const percentIncrease = useMemo(() => {
        if (strengthProgression.length < 2) return "0";
        const first = strengthProgression[0].weight;
        const last = strengthProgression[strengthProgression.length - 1].weight;
        const diff = last - first;
        return ((diff / first) * 100).toFixed(1);
    }, [strengthProgression]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#0d0d0d] text-neutral-400">
                <div className="font-mono-jetbrains text-sm">LOADING PERFORMANCE METRICS...</div>
            </div>
        );
    }

    const ranges: TimeRange[] = ["1W", "1M", "3M", "6M", "All"];

    return (
        <div className="min-h-screen bg-[#0d0d0d] text-white bg-glow-lime pb-32">
            <div className="max-w-md mx-auto px-6 pt-16">
                
                {/* Header */}
                <header className="mb-6">
                    <div className="text-[10px] uppercase font-mono-jetbrains tracking-[0.16em] text-neutral-500 mb-1">
                        Performance
                    </div>
                    <h1 className="text-3xl font-medium tracking-tight">Trends</h1>
                </header>

                {/* Range Chips */}
                <div className="flex gap-1.5 mb-6 overflow-x-auto scrollbar-hide py-1">
                    {ranges.map((r) => (
                        <button
                            key={r}
                            onClick={() => setTimeRange(r)}
                            className={`px-3 py-1 font-mono-jetbrains text-[10px] tracking-wider uppercase transition-colors cursor-pointer border rounded-none ${
                                timeRange === r 
                                ? "bg-[oklch(0.90_0.22_128)] text-[oklch(0.20_0.06_128)] border-[oklch(0.90_0.22_128)] font-semibold" 
                                : "bg-neutral-950/20 text-neutral-400 border-white/8 hover:text-white"
                            }`}
                        >
                            {r}
                        </button>
                    ))}
                </div>

                {/* Hero 1RM Strength Progression Chart */}
                <section className="border border-white/8 bg-neutral-950/40 p-4 mb-6 relative">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[oklch(0.90_0.22_128)]/20 to-transparent" />
                    
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <div className="font-mono-jetbrains text-[9px] text-neutral-500 tracking-[0.12em] uppercase">
                                Est. Max Lift progression
                            </div>
                            <div className="flex items-baseline gap-2.5 mt-2">
                                <div className="font-mono-jetbrains text-3xl font-medium text-white leading-none">
                                    {strengthProgression.length > 0 ? strengthProgression[strengthProgression.length - 1].weight : "—"}
                                    <span className="text-neutral-500 text-xs ml-0.5 font-normal">kg</span>
                                </div>
                                {parseFloat(percentIncrease) !== 0 && (
                                    <div className="font-mono-jetbrains text-[9px] text-[oklch(0.90_0.22_128)] font-bold uppercase leading-none">
                                        {parseFloat(percentIncrease) > 0 ? "↑" : "↓"} {Math.abs(parseFloat(percentIncrease))}%
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Exercise Selector */}
                        <div className="relative">
                            {exerciseNames.length > 0 ? (
                                <div className="flex items-center gap-1 bg-neutral-900 border border-white/8 px-2 py-1 select-none cursor-pointer">
                                    <Search className="h-3 w-3 text-neutral-500" />
                                    <select
                                        value={selectedExercise}
                                        onChange={(e) => setSelectedExercise(e.target.value)}
                                        className="bg-transparent border-0 font-mono-jetbrains text-[9px] tracking-wider text-neutral-300 focus:outline-none cursor-pointer pr-4 appearance-none uppercase"
                                    >
                                        {exerciseNames.map(name => (
                                            <option key={name} value={name} className="bg-[#141414] text-white">
                                                {name}
                                            </option>
                                        ))}
                                    </select>
                                    <ChevronDown className="h-2.5 w-2.5 text-neutral-500 absolute right-2 pointer-events-none" />
                                </div>
                            ) : (
                                <div className="font-mono-jetbrains text-[8px] text-neutral-500">NO DATA</div>
                            )}
                        </div>
                    </div>

                    {/* Pure Inline SVG Line Chart */}
                    <div className="py-2">
                        {chartData ? (
                            <>
                                <svg width="100%" height="140" viewBox="0 0 358 140" preserveAspectRatio="none" className="block">
                                    <defs>
                                        <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="oklch(0.90 0.22 128)" stopOpacity="0.2" />
                                            <stop offset="100%" stopColor="oklch(0.90 0.22 128)" stopOpacity="0" />
                                        </linearGradient>
                                    </defs>
                                    
                                    {/* Gridlines */}
                                    {chartData.gridLines.map((y, idx) => (
                                        <line key={idx} x1="0" y1={y} x2="358" y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
                                    ))}
                                    
                                    {/* Area Fill */}
                                    <path d={chartData.fillPath} fill="url(#chartGlow)" />
                                    
                                    {/* Stroke Path */}
                                    <path d={chartData.linePath} stroke="oklch(0.90 0.22 128)" strokeWidth="1.5" fill="none" />
                                    
                                    {/* Highlight Endpoint dot */}
                                    <circle 
                                        cx={chartData.pts[chartData.pts.length - 1][0]} 
                                        cy={chartData.pts[chartData.pts.length - 1][1]} 
                                        r="3" 
                                        fill="oklch(0.90 0.22 128)" 
                                    />
                                </svg>
                                
                                {/* Chart X-axis labels */}
                                <div className="flex justify-between font-mono-jetbrains text-[8px] text-neutral-500 tracking-wider mt-2.5">
                                    <span>{strengthProgression[0].dateStr}</span>
                                    <span>{strengthProgression[Math.floor(strengthProgression.length / 2)].dateStr}</span>
                                    <span>{strengthProgression[strengthProgression.length - 1].dateStr}</span>
                                </div>
                            </>
                        ) : (
                            <div className="h-[140px] flex items-center justify-center border border-dashed border-white/8 bg-neutral-950/20">
                                <p className="font-mono-jetbrains text-[9px] uppercase tracking-widest text-neutral-500 text-center px-4 leading-relaxed">
                                    Log at least 2 sessions with {selectedExercise || "this exercise"} to render progression.
                                </p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Dense Grid stats dashboard */}
                <section className="grid grid-cols-2 gap-0 border border-white/8 bg-neutral-950/40 mb-6">
                    {[
                        ["Sessions", totalSessions, "this period"],
                        ["Avg / wk", avgSessionsPerWeek, "frequency"],
                        ["Streak", streak, "days consecutive"],
                        ["Volume", `${totalVolumeTonnes}t`, "tonnes lifted"]
                    ].map(([label, val, unit], idx) => (
                        <div 
                            key={idx} 
                            className={`p-4 ${idx % 2 === 0 ? "border-r border-white/8" : ""} ${
                                idx < 2 ? "border-b border-white/8" : ""
                            }`}
                        >
                            <div className="font-mono-jetbrains text-[9px] uppercase tracking-wider text-neutral-500">
                                {label}
                            </div>
                            <div className="font-mono-jetbrains text-2xl font-semibold text-white mt-1.5 leading-none">
                                {val}
                            </div>
                            <div className="font-mono-jetbrains text-[8px] text-neutral-500 tracking-wider mt-1.5 uppercase leading-none">
                                {unit}
                            </div>
                        </div>
                    ))}
                </section>

                {/* PR Leaderboard */}
                <section className="space-y-3">
                    <div className="text-[10px] uppercase font-mono-jetbrains tracking-[0.16em] text-neutral-400 border-b border-white/8 pb-2">
                        Personal Records
                    </div>
                    
                    {prs.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-white/8 bg-neutral-950/20">
                            <Award className="h-6 w-6 mx-auto mb-2 text-neutral-600" />
                            <p className="font-mono-jetbrains text-[9px] uppercase tracking-wider text-neutral-500">
                                No records logged yet.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-white/8">
                            {prs.map((pr) => {
                                const dObj = new Date(pr.date);
                                const dStr = `${String(dObj.getMonth() + 1).padStart(2, '0')}.${String(dObj.getDate()).padStart(2, '0')}`;
                                return (
                                    <div key={pr.exercise} className="py-3 flex justify-between items-center">
                                        <div className="font-mono-jetbrains text-xs tracking-wider text-neutral-300 font-medium">
                                            {pr.exercise}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="font-mono-jetbrains text-base font-semibold flex items-center gap-1 text-white">
                                                {pr.weight}
                                                <span className="text-neutral-500 text-[10px] font-normal">kg</span>
                                                {pr.isFresh && (
                                                    <span className="inline-flex items-center px-1 py-0.5 bg-[oklch(0.90_0.22_128)] text-[oklch(0.20_0.06_128)] text-[7px] font-bold tracking-widest uppercase">
                                                        <Zap className="h-2 w-2 fill-current" /> NEW
                                                    </span>
                                                )}
                                            </div>
                                            <div className="font-mono-jetbrains text-[9px] text-neutral-500 min-w-[36px] text-right">
                                                {dStr}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </section>

            </div>
        </div>
    );
}
