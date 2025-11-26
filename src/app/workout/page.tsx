"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Calendar, Dumbbell } from "lucide-react";
import Link from "next/link";
import { storage, Workout } from "@/lib/storage";
import { useAuth } from "@/lib/auth-context";

export default function WorkoutPage() {
    const { user } = useAuth();
    const [workouts, setWorkouts] = useState<Workout[]>([]);

    useEffect(() => {
        if (!user) return;
        
        const loadWorkouts = async () => {
            const data = await storage.getWorkouts(user.uid);
            setWorkouts(data);
        };
        
        loadWorkouts();
    }, [user]);

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

            <div className="space-y-4">
                {workouts.length === 0 ? (
                    <div className="text-center py-10 text-muted-foreground">
                        <Dumbbell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No workouts logged yet.</p>
                        <Link href="/workout/log" className="text-primary hover:underline mt-2 block">
                            Start your first workout
                        </Link>
                    </div>
                ) : (
                    workouts.map((workout) => (
                        <Card key={workout.id}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex justify-between items-center">
                                    <span>{workout.name}</span>
                                    <span className="text-xs font-normal text-muted-foreground flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {new Date(workout.date).toLocaleDateString()}
                                    </span>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">
                                    {workout.exercises.length} Exercises
                                </p>
                                <div className="mt-2 space-y-2">
                                    {(() => {
                                        // Group exercises by their group field
                                        const grouped = workout.exercises.reduce((acc, ex) => {
                                            const group = ex.group || "Ungrouped";
                                            if (!acc[group]) acc[group] = [];
                                            acc[group].push(ex);
                                            return acc;
                                        }, {} as Record<string, typeof workout.exercises>);

                                        const groups = Object.keys(grouped);
                                        return groups.slice(0, 3).map((groupName) => (
                                            <div key={groupName} className="space-y-1">
                                                {groupName !== "Ungrouped" && (
                                                    <div className="text-xs font-semibold text-muted-foreground uppercase">
                                                        {groupName}
                                                    </div>
                                                )}
                                                {grouped[groupName].slice(0, 2).map((ex) => (
                                                    <div key={ex.id} className="text-xs flex justify-between pl-2">
                                                        <span>{ex.name}</span>
                                                        <span className="text-muted-foreground">
                                                            {ex.sets.length} sets
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        ));
                                    })()}
                                    {workout.exercises.length > 3 && (
                                        <div className="text-xs text-muted-foreground pt-1">
                                            + {workout.exercises.length - 3} more
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
