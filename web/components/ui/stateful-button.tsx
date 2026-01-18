"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatefulButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void | Promise<void>;
}

export function StatefulButton({
  children,
  className,
  onClick,
  disabled,
  ...props
}: StatefulButtonProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    if (status === "loading") return;
    
    setStatus("loading");
    try {
      if (onClick) {
        await onClick(e);
      }
      setStatus("success");
      // Reset after animation
      setTimeout(() => setStatus("idle"), 2000);
    } catch (error) {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || status === "loading"}
      className={cn(
        "relative flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-medium transition-all duration-300",
        "bg-accent-primary text-white hover:bg-accent-primary/90",
        "disabled:cursor-not-allowed disabled:opacity-70",
        status === "success" && "bg-emerald-500 hover:bg-emerald-600",
        status === "error" && "bg-rose-500 hover:bg-rose-600",
        className
      )}
      {...props}
    >
      <span
        className={cn(
          "flex items-center gap-2 transition-all duration-300",
          status === "loading" && "opacity-0 scale-95"
        )}
      >
        {children}
      </span>

      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin" />
        </div>
      )}
    </button>
  );
}
