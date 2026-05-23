"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Home, 
  Dumbbell, 
  Plus, 
  Flame, 
  TrendingUp, 
  X, 
  Play, 
  ClipboardList, 
  Utensils, 
  MessageSquare 
} from "lucide-react";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Hide bottom nav on onboarding page
  if (pathname === "/onboarding") {
    return null;
  }

  const handleAction = (href: string) => {
    setShowQuickActions(false);
    router.push(href);
  };

  const navItems = [
    { href: "/", label: "TODAY", icon: Home, id: "home" },
    { href: "/workout", label: "TRAIN", icon: Dumbbell, id: "workout" },
    { href: "#", label: "", icon: Plus, id: "log", cta: true },
    { href: "/nutrition", label: "FUEL", icon: Flame, id: "nutrition" },
    { href: "/progress", label: "STATS", icon: TrendingUp, id: "progress" },
  ];

  return (
    <>
      {/* Floating Glass Dock */}
      <div className="fixed bottom-6 left-4 right-4 z-40 flex items-center justify-between p-2 bg-neutral-900/75 backdrop-blur-xl border border-white/14 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.6),_inset_0_1px_0_rgba(255,255,255,0.08)]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isLog = item.id === "log";
          const isActive = pathname === item.href;

          if (isLog) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setShowQuickActions(true)}
                className="w-12 h-12 rounded-full bg-[oklch(0.90_0.22_128)] text-[oklch(0.20_0.06_128)] flex items-center justify-center shadow-[0_6px_18px_rgba(168,232,55,0.25),_inset_0_-2px_0_rgba(0,0,0,0.12)] active:scale-95 transition-transform cursor-pointer"
                aria-label="Add Action"
              >
                <Plus className="h-6 w-6 stroke-[2.5]" />
              </button>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-1.5 transition-colors relative cursor-pointer",
                isActive ? "text-white" : "text-neutral-500 hover:text-white"
              )}
            >
              <Icon 
                className={cn(
                  "h-5 w-5 transition-colors", 
                  isActive ? "text-[oklch(0.90_0.22_128)]" : "text-neutral-500"
                )} 
              />
              <span className="font-mono-jetbrains text-[8px] tracking-[0.16em] font-medium">
                {item.label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[oklch(0.90_0.22_128)] shadow-[0_0_6px_oklch(0.90_0.22_128)]" />
              )}
            </Link>
          );
        })}
      </div>

      {/* Quick Actions overlay */}
      {showQuickActions && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/85 backdrop-blur-md animate-fade-in">
          {/* Close button area */}
          <div className="absolute top-6 right-6">
            <button
              onClick={() => setShowQuickActions(false)}
              className="p-3 bg-neutral-900 border border-white/8 rounded-full text-white/70 hover:text-white transition-colors cursor-pointer"
              type="button"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Action List */}
          <div className="p-6 pb-32 space-y-6 max-w-md mx-auto w-full">
            <div className="text-center mb-2">
              <h2 className="text-xl font-medium tracking-tight">Quick Actions</h2>
              <p className="text-sm text-neutral-500 mt-1">What would you like to track?</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleAction("/workout/session")}
                className="flex flex-col items-center gap-3 p-5 bg-neutral-950 border border-white/8 hover:border-[oklch(0.90_0.22_128)] transition-all group text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-[oklch(0.90_0.22_128)]/10 text-[oklch(0.90_0.22_128)] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Play className="h-5 w-5 fill-current" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-sm">Start Session</div>
                  <div className="text-[10px] text-neutral-500 mt-1">Live active workout</div>
                </div>
              </button>

              <button
                onClick={() => handleAction("/workout/log")}
                className="flex flex-col items-center gap-3 p-5 bg-neutral-950 border border-white/8 hover:border-[oklch(0.90_0.22_128)] transition-all group text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-[oklch(0.90_0.22_128)]/10 text-[oklch(0.90_0.22_128)] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <ClipboardList className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-sm">Log Workout</div>
                  <div className="text-[10px] text-neutral-500 mt-1">Add completed sets</div>
                </div>
              </button>

              <button
                onClick={() => handleAction("/nutrition/log")}
                className="flex flex-col items-center gap-3 p-5 bg-neutral-950 border border-white/8 hover:border-[oklch(0.90_0.22_128)] transition-all group text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Utensils className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-sm">Log Meal</div>
                  <div className="text-[10px] text-neutral-500 mt-1">Record food macros</div>
                </div>
              </button>

              <button
                onClick={() => handleAction("/assistant")}
                className="flex flex-col items-center gap-3 p-5 bg-neutral-950 border border-white/8 hover:border-[oklch(0.90_0.22_128)] transition-all group text-left cursor-pointer"
              >
                <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-sm">Ask Coach</div>
                  <div className="text-[10px] text-neutral-500 mt-1">Chat with Gemini</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
