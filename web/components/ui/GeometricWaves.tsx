"use client";

import { cn } from "@/lib/utils";

export function GeometricWaves({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "pointer-events-none absolute inset-0 overflow-hidden opacity-40 dark:opacity-20",
        className
      )}
    >
      <svg
        className="h-full w-full"
        viewBox="0 0 1200 800"
        preserveAspectRatio="none"
        fill="none"
      >
        <g
          className="text-accent-primary/20 dark:text-accent-primary/10"
          stroke="currentColor"
          strokeWidth="1"
        >
          <path d="M-40 120 C 200 40, 330 70, 520 120 S 900 220, 1240 120" />
          <path d="M-60 210 C 210 140, 360 150, 560 210 S 940 320, 1260 210" />
          <path d="M-80 320 C 220 260, 390 260, 600 320 S 960 460, 1280 320" />
          <path d="M-100 460 C 220 420, 420 410, 640 460 S 980 580, 1300 460" />
          <path d="M-120 610 C 220 590, 450 560, 690 610 S 1000 700, 1320 610" />
        </g>
        <g
          className="text-accent-primary/15 dark:text-accent-primary/5"
          stroke="currentColor"
          strokeWidth="1"
        >
          <path d="M-40 160 C 160 110, 340 110, 520 160 S 920 270, 1240 160" />
          <path d="M-60 260 C 160 220, 360 220, 560 260 S 950 390, 1260 260" />
          <path d="M-80 390 C 160 360, 390 360, 610 390 S 970 520, 1280 390" />
          <path d="M-100 540 C 160 520, 420 510, 650 540 S 980 640, 1300 540" />
        </g>
      </svg>
    </div>
  );
}
