"use client";

import React, { useMemo } from "react";

import { motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

type MeteorSpec = {
  id: string;
  left: number;
  delay: number;
  duration: number;
};

export function Meteors({
  number = 18,
  className,
}: {
  number?: number;
  className?: string;
}) {
  const isReducedMotion = useReducedMotion();

  const meteors = useMemo<MeteorSpec[]>(() => {
    const specs: MeteorSpec[] = [];

    for (let index = 0; index < number; index += 1) {
      const left = index * (800 / number) - 400;
      const delay = ((index * 37) % 500) / 100;
      const duration = 5 + ((index * 29) % 50) / 10;

      specs.push({
        id: `meteor-${index}`,
        left,
        delay,
        duration,
      });
    }

    return specs;
  }, [number]);

  if (isReducedMotion) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden="true"
    >
      {meteors.map((meteor) => (
          <span
            key={meteor.id}
            className={cn(
              "animate-meteor-effect absolute h-0.5 w-0.5 rounded-[9999px]",
              "bg-slate-500 shadow-[0_0_0_1px_#ffffff10]",
              "before:absolute before:top-1/2 before:h-[1px] before:w-[50px]",
              "before:-translate-y-1/2 before:bg-gradient-to-r before:from-slate-400 before:to-transparent",
              "before:content-['']",
            )}

          style={{
            top: "-40px",
            left: `${meteor.left}px`,
            animationDelay: `${meteor.delay}s`,
            animationDuration: `${meteor.duration}s`,
          }}
        />
      ))}
    </motion.div>
  );
}
