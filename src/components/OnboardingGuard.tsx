"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { storage } from "@/lib/storage";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [checkingOnboarding, setCheckingOnboarding] = useState(true);

    useEffect(() => {
        const checkOnboarding = async () => {
            if (loading || !user) {
                setCheckingOnboarding(false);
                return;
            }

            // Allow access to onboarding page
            if (pathname === "/onboarding") {
                setCheckingOnboarding(false);
                return;
            }

            try {
                const profile = await storage.getUserProfile(user.uid);
                
                if (!profile || !profile.completedOnboarding) {
                    router.push("/onboarding");
                }
            } catch (error) {
                console.error("Error checking onboarding:", error);
                // On error, allow access (don't block user)
            } finally {
                setCheckingOnboarding(false);
            }
        };

        checkOnboarding();
    }, [user, loading, pathname, router]);

    if (loading || checkingOnboarding) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}


