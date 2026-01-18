"use client";

import React, { useEffect, useMemo, useState } from "react";

import { motion } from "framer-motion";

import { cn } from "@/lib/utils";

type Direction = "TOP" | "LEFT" | "BOTTOM" | "RIGHT";

type MovingMap = Record<Direction, string>;

export function HoverBorderGradient({
  children,
  containerClassName,
  className,
  as: Tag = "button",
  duration = 1,
  clockwise = true,
  ...props
}: React.PropsWithChildren<
  {
    as?: React.ElementType;
    containerClassName?: string;
    className?: string;
    duration?: number;
    clockwise?: boolean;
    type?: string;
  } & React.HTMLAttributes<HTMLElement>
 >) {
  const [hovered, setHovered] = useState(false);
  const [direction, setDirection] = useState<Direction>("TOP");

  const rotateDirection = useMemo(() => {
    return (currentDirection: Direction): Direction => {
      const directions: Direction[] = ["TOP", "LEFT", "BOTTOM", "RIGHT"];
      const currentIndex = directions.indexOf(currentDirection);
      const nextIndex = clockwise
        ? (currentIndex - 1 + directions.length) % directions.length
        : (currentIndex + 1) % directions.length;
      return directions[nextIndex];
    };
  }, [clockwise]);

  const movingMap: MovingMap = useMemo(
    () => ({
      TOP: "radial-gradient(20.7% 50% at 50% 0%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 100%)",
      LEFT: "radial-gradient(16.6% 43.1% at 0% 50%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 100%)",
      BOTTOM:
        "radial-gradient(20.7% 50% at 50% 100%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 100%)",
      RIGHT:
        "radial-gradient(16.2% 41.2% at 100% 50%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 100%)",
    }),
    [],
  );

  const highlight =
    "radial-gradient(75% 181% at 50% 50%, rgba(var(--color-accent-primary), 0.7) 0%, rgba(255, 255, 255, 0) 100%)";

  useEffect(() => {
    if (hovered) return;

    const intervalId = window.setInterval(() => {
      setDirection((prevState) => rotateDirection(prevState));
    }, duration * 1000);

    return () => window.clearInterval(intervalId);
  }, [duration, hovered, rotateDirection]);

  return (
    <Tag
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative inline-flex rounded-2xl p-px",
        "border border-border bg-surface-base/40 shadow-glass-sm backdrop-blur-md",
        "transition-colors duration-300 hover:bg-surface-elevated/40",
        containerClassName,
      )}
      {...props}
    >
      <div
        className={cn(
          "relative z-10 rounded-[inherit] bg-surface-base px-4 py-2 text-text-primary",
          "text-xs font-bold uppercase tracking-widest",
          className,
        )}
      >
        {children}
      </div>

      <motion.div
        className="absolute inset-0 z-0 overflow-hidden rounded-[inherit]"
        style={{ filter: "blur(1.5px)" }}
        initial={{ background: movingMap[direction] }}
        animate={{
          background: hovered
            ? [movingMap[direction], highlight]
            : movingMap[direction],
        }}
        transition={{ ease: "linear", duration }}
      />

      <div className="pointer-events-none absolute inset-[2px] rounded-[inherit] bg-surface-base" />
    </Tag>
  );
}
