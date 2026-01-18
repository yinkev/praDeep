"use client";

import { useEffect, useMemo } from "react";

import { cn } from "@/lib/utils";

import { motion, stagger, useAnimate, useReducedMotion } from "framer-motion";

export function TextGenerateEffect({
  words,
  className,
  filter = true,
  duration = 0.5,
}: {
  words: string;
  className?: string;
  filter?: boolean;
  duration?: number;
}) {
  const isReducedMotion = useReducedMotion();
  const [scope, animate] = useAnimate();

  const wordsArray = useMemo(() => words.split(" ").filter(Boolean), [words]);

  useEffect(() => {
    if (isReducedMotion) return;

    animate(
      "span",
      {
        opacity: 1,
        filter: filter ? "blur(0px)" : "none",
      },
      {
        duration,
        delay: stagger(0.06),
      },
    );
  }, [animate, duration, filter, isReducedMotion]);

  const wordCounts = new Map<string, number>();

  return (
    <div className={cn("font-bold", className)}>
      <motion.div key={words} ref={scope} className="leading-snug tracking-wide">
        {wordsArray.map((word) => {
          const nextCount = (wordCounts.get(word) ?? 0) + 1;
          wordCounts.set(word, nextCount);

          return (
            <motion.span
              key={`${word}-${nextCount}-${words}`}
              className="text-text-primary opacity-0"
              style={{ filter: filter ? "blur(10px)" : "none" }}
            >
              {word}{" "}
            </motion.span>
          );
        })}
      </motion.div>
    </div>
  );
}
