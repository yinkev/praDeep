import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function BentoGrid({
  className,
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "mx-auto grid w-full grid-cols-1 gap-4 md:grid-cols-3 md:auto-rows-auto",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function BentoGridItem({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | ReactNode;
  description?: string | ReactNode;
  header?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <article
      className={cn(
        "group/bento row-span-1 flex flex-col justify-between gap-4 rounded-2xl border border-border bg-surface-base/70 p-4 shadow-glass-sm backdrop-blur-md transition-all duration-300",
        "hover:border-accent-primary/20 hover:bg-surface-elevated/50",
        className,
      )}
    >
      {header}
      <div className="transition-transform duration-300 group-hover/bento:translate-x-1">
        {icon}
        <div className="mt-2 text-xs font-bold uppercase tracking-widest text-text-primary">
          {title}
        </div>
        <div className="mt-2 text-sm leading-relaxed text-text-secondary">
          {description}
        </div>
      </div>
    </article>
  );
}
