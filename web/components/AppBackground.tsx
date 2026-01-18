"use client";

import { useReducedMotion } from "framer-motion";

import { Spotlight } from "@/components/ui/spotlight-new";
import { Meteors } from "@/components/ui/meteors";
import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";

export function AppBackground() {
  const isReducedMotion = useReducedMotion();

  return (
    <div className="fixed inset-0 overflow-hidden -z-10 bg-surface-base">
      {!isReducedMotion && (
        <div className="absolute inset-0 opacity-70 pointer-events-none z-10">
          <Spotlight />
        </div>
      )}

      {/* Ripple Grid - Subtle & Interactive */}
      <div className="absolute inset-0 [mask-image:radial-gradient(ellipse_at_top,black_60%,transparent_100%)] opacity-40">
        <BackgroundRippleEffect
          rows={35}
          cols={80}
          cellSize={40}
        />
      </div>

      {!isReducedMotion && (
        <div className="absolute inset-0 hidden lg:block opacity-30 pointer-events-none z-20">
          <Meteors number={8} />
        </div>
      )}
    </div>
  );
}
