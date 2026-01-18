"use client";

import { useReducedMotion } from "framer-motion";

import { Spotlight } from "@/components/ui/spotlight-new";
import { Meteors } from "@/components/ui/meteors";

export function AppBackground() {
  const isReducedMotion = useReducedMotion();

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {!isReducedMotion && (
        <div className="absolute inset-0 opacity-70">
          <Spotlight />
        </div>
      )}

      {!isReducedMotion && (
        <div className="absolute inset-0 hidden lg:block opacity-40">
          <Meteors number={12} />
        </div>
      )}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgb(var(--color-border-subtle))_1px,transparent_0)] [background-size:24px_24px] opacity-60" />
    </div>
  );
}
