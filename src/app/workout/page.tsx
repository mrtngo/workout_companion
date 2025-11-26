"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar, Dumbbell, ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { storage, Workout } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";

type GroupByOption = "day" | "week" | "month" | "none";

export default function WorkoutPage() {
    const { user } = useAuth();
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set());
    const [groupBy, setGroupBy] = useState<GroupByOption>("day");

    useEffect(() => {
        if (!user) return;
        
        const loadWorkouts = async () => {
            const data = await storage.getWorkouts(user.uid);
            setWorkouts(data);
        };
        
        loadWorkouts();
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

    const groupWorkouts = (workouts: Workout[], groupBy: GroupByOption): Record<string, Workout[]> => {
        if (groupBy === "none") {
            return { "All Workouts": workouts };
        }

        const grouped: Record<string, Workout[]> = {};

        workouts.forEach(workout => {
            const date = new Date(workout.date);
            let key: string;

            if (groupBy === "day") {
                key = date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            } else if (groupBy === "week") {
                const weekStart = new Date(date);
                weekStart.setDate(date.getDate() - date.getDay());
                key = `Week of ${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
            } else if (groupBy === "month") {
                key = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
            } else {
                key = "All Workouts";
            }

            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(workout);
        });

        // Sort workouts within each group by date (newest first)
        Object.keys(grouped).forEach(key => {
            grouped[key].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });

        return grouped;
    };

    const groupedWorkouts = groupWorkouts(workouts, groupBy);

    return (
        <div className="p-4 space-y-6 pb-24">
            <header className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Workouts</h1>
                <Link href="/workout/log">
                    <Button size="icon" className="rounded-full h-10 w-10">
                        <Plus className="h-6 w-6" />
                    </Button>
                </Link>
            </header>

            {/* Group By Filter */}
            {workouts.length > 0 && (
                <div className="flex gap-2">
                    <Button
                        variant={groupBy === "none" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setGroupBy("none")}
                    >
                        All
                    </Button>
                    <Button
                        variant={groupBy === "day" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setGroupBy("day")}
                    >
                        By Day
                    </Button>
                    <Button
                        variant={groupBy === "week" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setGroupBy("week")}
                    >
                        By Week
                    </Button>
                    <Button
                        variant={groupBy === "month" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setGroupBy("month")}
                    >
                        By Month
                    </Button>
                </div>
            )}

            <div className="space-y-6">
                {workouts.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No workouts logged yet.</p>
                        <Link href="/workout/log" className="text-primary hover:underline mt-2 block">
                            Start your first workout
                        </Link>
                    </div>
                ) : (
                    Object.entries(groupedWorkouts).map(([groupKey, groupWorkouts]) => (
                        <div key={groupKey} className="space-y-4">
                            {groupBy !== "none" && (
                                <div className="flex items-center gap-2 pt-2">
                                    <div className="h-px flex-1 bg-border"></div>
                                    <h2 className="text-lg font-semibold text-muted-foreground px-2">
                                        {groupKey}
                                    </h2>
                                    <div className="h-px flex-1 bg-border"></div>
                                </div>
                            )}
                            {groupWorkouts.map((workout) => {
                                const isExpanded = expandedWorkouts.has(workout.id);
                                const groupedExercises = workout.exercises.reduce((acc, ex) => {
                                    const group = ex.group || "Ungrouped";
                                    if (!acc[group]) acc[group] = [];
                                    acc[group].push(ex);
                                    return acc;
                                }, {} as Record<string, typeof workout.exercises>);

                                return (
                                    <Card key={workout.id}>
                                        <CardHeader 
                                            className="pb-2 cursor-pointer"
                                            onClick={() => toggleWorkout(workout.id)}
                                        >
                                            <CardTitle className="text-lg flex justify-between items-center">
                                                <span>{workout.name}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-normal text-muted-foreground flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        {new Date(workout.date).toLocaleDateString()}
                                                    </span>
                                                    {isExpanded ? (
                                                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </div>
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            {!isExpanded ? (
                                                <>
                                                    <p className="text-sm text-muted-foreground mb-2">
                                                        {workout.exercises.length} Exercises
                                                    </p>
                                                    <div className="space-y-2">
                                                        {Object.entries(groupedExercises).slice(0, 3).map(([groupName, exercises]) => (
                                                            <div key={groupName} className="space-y-1">
                                                                {groupName !== "Ungrouped" && (
                                                                    <div className="text-xs font-semibold text-muted-foreground uppercase">
                                                                        {groupName}
                                                                    </div>
                                                                )}
                                                                {exercises.slice(0, 2).map((ex) => (
                                                                    <div key={ex.id} className="text-xs flex justify-between pl-2">
                                                                        <span>{ex.name}</span>
                                                                        <span className="text-muted-foreground">
                                                                            {ex.sets.length} sets
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        ))}
                                                        {workout.exercises.length > 3 && (
                                                            <div className="text-xs text-muted-foreground pt-1">
                                                                + {workout.exercises.length - 3} more exercises
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="space-y-4">
                                                    {Object.entries(groupedExercises).map(([groupName, exercises]) => (
                                                        <div key={groupName} className="space-y-3">
                                                            {groupName !== "Ungrouped" && (
                                                                <div className="flex items-center gap-2 pt-2">
                                                                    <div className="h-px flex-1 bg-border"></div>
                                                                    <div className="text-xs font-semibold text-muted-foreground uppercase px-2">
                                                                        {groupName}
                                                                    </div>
                                                                    <div className="h-px flex-1 bg-border"></div>
                                                                </div>
                                                            )}
                                                            {exercises.map((exercise) => (
                                                                <div key={exercise.id} className="space-y-2">
                                                                    <div className="font-semibold text-sm">{exercise.name}</div>
                                                                    <div className="space-y-1">
                                                                        <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground">
                                                                            <div>Set</div>
                                                                            <div>Weight</div>
                                                                            <div>Reps</div>
                                                                            <div>Status</div>
                                                                        </div>
                                                                        {exercise.sets.map((set, setIndex) => (
                                                                            <div 
                                                                                key={set.id} 
                                                                                className="grid grid-cols-4 gap-2 text-sm items-center py-1 border-b border-border/50 last:border-0"
                                                                            >
                                                                                <div className="font-medium">{setIndex + 1}</div>
                                                                                <div>{set.weight > 0 ? `${set.weight} kg` : "-"}</div>
                                                                                <div>{set.reps}</div>
                                                                                <div className="text-xs">
                                                                                    {set.completed ? (
                                                                                        <span className="text-green-600">✓ Done</span>
                                                                                    ) : (
                                                                                        <span className="text-muted-foreground">-</span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
