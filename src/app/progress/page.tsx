"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { storage, Workout, Meal, UserProfile } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    ResponsiveContainer,
} from "recharts";

type TimeRange = "1W" | "1M" | "3M" | "All";

function computePRs(workouts: Workout[]): { exercise: string; weight: number; date: string }[] {
    const prMap = new Map<string, { weight: number; date: string }>();
    for (const workout of workouts) {
        for (const exercise of workout.exercises) {
            const maxSet = exercise.sets.reduce(
                (best, set) => (set.weight > best ? set.weight : best),
                0
            );
            if (maxSet > 0) {
                const existing = prMap.get(exercise.name);
                if (!existing || maxSet > existing.weight) {
                    prMap.set(exercise.name, { weight: maxSet, date: workout.date });
                }
            }
        }
    }
    return Array.from(prMap.entries())
        .map(([exercise, { weight, date }]) => ({ exercise, weight, date }))
        .sort((a, b) => b.weight - a.weight);
}

function computeWeeklyFrequency(workouts: Workout[]): { week: string; count: number }[] {
    const weekMap = new Map<string, number>();
    for (const workout of workouts) {
        const d = new Date(workout.date);
        // Get Monday of that week
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(d.setDate(diff));
        const weekKey = monday.toISOString().split("T")[0];
        weekMap.set(weekKey, (weekMap.get(weekKey) ?? 0) + 1);
    }
    return Array.from(weekMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([week, count]) => ({
            week: new Date(week).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
            count,
        }));
}

function computeStrengthProgression(
    workouts: Workout[],
    exercise: string
): { date: string; weight: number }[] {
    const result: { date: string; weight: number }[] = [];
    for (const workout of workouts) {
        for (const ex of workout.exercises) {
            if (ex.name === exercise) {
                const maxWeight = ex.sets.reduce(
                    (best, set) => (set.weight > best ? set.weight : best),
                    0
                );
                if (maxWeight > 0) {
                    result.push({
                        date: new Date(workout.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                        }),
                        weight: maxWeight,
                    });
                }
            }
        }
    }
    return result.sort((a, b) => a.date.localeCompare(b.date));
}

function computeDailyCalories(meals: Meal[]): { date: string; calories: number }[] {
    const dayMap = new Map<string, number>();
    for (const meal of meals) {
        const dateKey = meal.date.split("T")[0];
        dayMap.set(dateKey, (dayMap.get(dateKey) ?? 0) + meal.calories);
    }
    return Array.from(dayMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([dateKey, calories]) => ({
            date: new Date(dateKey).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
            }),
            calories: Math.round(calories),
        }));
}

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
    // Check if streak includes today or yesterday
    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    if (sorted[0] !== today && sorted[0] !== yesterday) return 0;
    return streak;
}

function filterByRange<T extends { date: string }>(items: T[], range: TimeRange): T[] {
    if (range === "All") return items;
    const now = Date.now();
    const ms = range === "1W" ? 7 : range === "1M" ? 30 : 90;
    const cutoff = now - ms * 86400000;
    return items.filter((item) => new Date(item.date).getTime() >= cutoff);
}

export default function ProgressPage() {
    const { user } = useAuth();
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [meals, setMeals] = useState<Meal[]>([]);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [timeRange, setTimeRange] = useState<TimeRange>("1M");
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
            setProfile(p);
            setLoading(false);
        };
        load();
    }, [user]);

    const filteredWorkouts = useMemo(
        () => filterByRange(workouts, timeRange),
        [workouts, timeRange]
    );

    const filteredMeals = useMemo(
        () => filterByRange(meals, timeRange),
        [meals, timeRange]
    );

    const prs = useMemo(() => computePRs(workouts), [workouts]);
    const weeklyFrequency = useMemo(
        () => computeWeeklyFrequency(filteredWorkouts),
        [filteredWorkouts]
    );
    const dailyCalories = useMemo(
        () => computeDailyCalories(filteredMeals),
        [filteredMeals]
    );
    const streak = useMemo(() => computeStreak(workouts), [workouts]);

    const exerciseNames = useMemo(() => {
        const names = new Set<string>();
        for (const w of workouts) {
            for (const e of w.exercises) names.add(e.name);
        }
        return Array.from(names).sort();
    }, [workouts]);

    // Auto-select first exercise
    useEffect(() => {
        if (exerciseNames.length > 0 && !selectedExercise) {
            setSelectedExercise(exerciseNames[0]);
        }
    }, [exerciseNames, selectedExercise]);

    const strengthProgression = useMemo(
        () => (selectedExercise ? computeStrengthProgression(filteredWorkouts, selectedExercise) : []),
        [filteredWorkouts, selectedExercise]
    );

    const totalWorkouts = filteredWorkouts.length;
    const avgPerWeek =
        weeklyFrequency.length > 0
            ? (totalWorkouts / weeklyFrequency.length).toFixed(1)
            : "0";
    const bestPR = prs.length > 0 ? `${prs[0].weight}kg` : "—";

    const ranges: TimeRange[] = ["1W", "1M", "3M", "All"];

    if (loading) {
        return (
            <div className="p-4 pb-24 flex items-center justify-center min-h-[60vh]">
                <p className="text-muted-foreground">Loading...</p>
            </div>
        );
    }

    return (
        <div className="p-4 pb-24 space-y-6">
            <h1 className="text-2xl font-bold">Progress</h1>

            {/* Time range selector */}
            <div className="flex gap-2">
                {ranges.map((r) => (
                    <button
                        key={r}
                        onClick={() => setTimeRange(r)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                            timeRange === r
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:text-foreground"
                        }`}
                    >
                        {r}
                    </button>
                ))}
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
                <Card>
                    <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground">Workouts</p>
                        <p className="text-2xl font-bold text-primary">{totalWorkouts}</p>
                        <p className="text-xs text-muted-foreground">this period</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground">Avg / Week</p>
                        <p className="text-2xl font-bold text-primary">{avgPerWeek}</p>
                        <p className="text-xs text-muted-foreground">workouts</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground">Streak</p>
                        <p className="text-2xl font-bold text-primary">{streak}</p>
                        <p className="text-xs text-muted-foreground">days</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <p className="text-xs text-muted-foreground">Best PR</p>
                        <p className="text-2xl font-bold text-primary">{bestPR}</p>
                        <p className="text-xs text-muted-foreground truncate">{prs[0]?.exercise ?? "—"}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Workout Frequency */}
            <Card>
                <CardHeader>
                    <CardTitle>Workout Frequency</CardTitle>
                </CardHeader>
                <CardContent>
                    {weeklyFrequency.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">
                            No workout data for this period.
                        </p>
                    ) : (
                        <ResponsiveContainer width="100%" height={180}>
                            <BarChart data={weeklyFrequency} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="count" name="Workouts" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* Personal Records */}
            <Card>
                <CardHeader>
                    <CardTitle>Personal Records</CardTitle>
                </CardHeader>
                <CardContent>
                    {prs.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">
                            Log workouts with weights to see your PRs.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {prs.map((pr) => (
                                <div
                                    key={pr.exercise}
                                    className="flex items-center justify-between py-2 border-b last:border-0"
                                >
                                    <span className="text-sm font-medium truncate max-w-[60%]">{pr.exercise}</span>
                                    <div className="text-right">
                                        <span className="text-sm font-bold text-primary">{pr.weight} kg</span>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(pr.date).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                            })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Strength Progression */}
            <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle>Strength Progression</CardTitle>
                    {exerciseNames.length > 0 && (
                        <select
                            value={selectedExercise}
                            onChange={(e) => setSelectedExercise(e.target.value)}
                            className="text-xs bg-muted text-foreground rounded px-2 py-1 border-0 outline-none max-w-[140px]"
                        >
                            {exerciseNames.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    )}
                </CardHeader>
                <CardContent>
                    {strengthProgression.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">
                            {exerciseNames.length === 0
                                ? "Log workouts with exercises to track strength."
                                : "No data for this exercise in the selected period."}
                        </p>
                    ) : (
                        <ResponsiveContainer width="100%" height={180}>
                            <LineChart data={strengthProgression} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(value) => [`${value} kg`, "Weight"]} />
                                <Line
                                    type="monotone"
                                    dataKey="weight"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>

            {/* Calorie Trends */}
            <Card>
                <CardHeader>
                    <CardTitle>Calorie Trends</CardTitle>
                </CardHeader>
                <CardContent>
                    {dailyCalories.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">
                            Log meals to see calorie trends.
                        </p>
                    ) : (
                        <ResponsiveContainer width="100%" height={180}>
                            <LineChart data={dailyCalories} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(value) => [`${value} kcal`, "Calories"]} />
                                {profile?.maxDailyCalories && (
                                    <ReferenceLine
                                        y={profile.maxDailyCalories}
                                        stroke="hsl(var(--destructive))"
                                        strokeDasharray="4 4"
                                        label={{ value: "Goal", position: "insideTopRight", fontSize: 11 }}
                                    />
                                )}
                                <Line
                                    type="monotone"
                                    dataKey="calories"
                                    stroke="hsl(var(--primary))"
                                    strokeWidth={2}
                                    dot={{ r: 4 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
