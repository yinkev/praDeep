"use client";

import { useTheme } from "@/hooks/useTheme";
import { useGlobal } from "@/context/GlobalContext";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { IconButton } from "@/components/ui/Button";
import {
  Search,
  Bell,
  Sidebar as SidebarIcon,
  ChevronRight,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { AnimatedThemeToggler } from '@/components/ui/animated-theme-toggler';

export default function AppHeader() {
  const { isDark, setTheme } = useTheme();
  const { uiSettings } = useGlobal();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleCommandPalette = () => {
    window.dispatchEvent(new CustomEvent("opentutor:command-palette"));
  };

  const breadcrumbs = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => ({
      label: segment.charAt(0).toUpperCase() + segment.slice(1),
      href: `/${segment}`,
    }));

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface-base/80 px-4 backdrop-blur-md dark:border-white/10 dark:bg-zinc-950/80">
      <div className="flex items-center gap-2">
        <SidebarTrigger />
        
        <div className="hidden items-center gap-1 text-sm text-text-tertiary sm:flex">
          <Link href="/" className="hover:text-text-primary">
            <Home size={16} />
          </Link>
          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.href} className="flex items-center gap-1">
              <ChevronRight size={14} />
              <Link
                href={crumb.href}
                className={cn(
                  "hover:text-text-primary",
                  index === breadcrumbs.length - 1 && "font-medium text-text-primary"
                )}
              >
                {crumb.label}
              </Link>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={handleCommandPalette}
          className="mr-2 hidden items-center gap-2 rounded-lg border border-border bg-surface-elevated/50 px-3 py-1.5 text-xs text-text-tertiary hover:bg-surface-elevated hover:text-text-primary sm:flex dark:border-white/10 dark:bg-white/5"
        >
          <Search size={14} />
          <span>Search...</span>
          <kbd className="ml-2 rounded bg-surface-base px-1.5 py-0.5 font-mono text-[10px] border border-border dark:border-white/10 dark:bg-black/20">
            ⌘K
          </kbd>
        </button>

        <IconButton
          variant="ghost"
          size="sm"
          className="h-8 w-8 text-text-tertiary hover:text-text-primary sm:hidden"
          onClick={handleCommandPalette}
          aria-label="Search"
          icon={<Search size={16} />}
        />

        {/* Theme Toggle */}
        <AnimatedThemeToggler />

        <IconButton
          variant="ghost"
          size="sm"
          className="h-8 w-8 text-text-tertiary hover:text-text-primary"
          aria-label="Notifications"
          icon={<Bell size={16} />}
        />
      </div>
    </header>
  );
}
