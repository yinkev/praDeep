import { useEffect, useMemo, useState } from "react";
import { registerServiceWorker } from "@/lib/pwa-utils";

export type SWStatus = "idle" | "installing" | "installed" | "updating";

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms?: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
  prompt: () => Promise<void>;
}

function detectInstalled(): boolean {
  if (typeof window === "undefined") return false;
  const isStandalone = window.matchMedia?.("(display-mode: standalone)")?.matches;
  const isIOSStandalone = (navigator as unknown as { standalone?: boolean }).standalone;
  return Boolean(isStandalone || isIOSStandalone);
}

export interface UsePWAOptions {
  registerServiceWorker?: boolean;
}

export function usePWA(options: UsePWAOptions = {}) {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [swStatus, setSwStatus] = useState<SWStatus>("idle");
  const [updateAvailable, setUpdateAvailable] = useState(false);

  const shouldRegisterServiceWorker = options.registerServiceWorker ?? true;
  const shouldInterceptInstallPrompt = process.env.NODE_ENV === "production";
  const canUsePwaApis = useMemo(() => typeof window !== "undefined", []);

  useEffect(() => {
    if (!canUsePwaApis) return;

    setIsInstalled(detectInstalled());
    setIsOnline(navigator.onLine);

    const mediaQuery =
      window.matchMedia?.("(display-mode: standalone)") ?? null;

    const handleMediaChange = () => setIsInstalled(detectInstalled());
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    const handleBeforeInstallPrompt = (event: Event) => {
      if (!shouldInterceptInstallPrompt) return;
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    mediaQuery?.addEventListener?.("change", handleMediaChange);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      mediaQuery?.removeEventListener?.("change", handleMediaChange);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, [canUsePwaApis, shouldInterceptInstallPrompt]);

  useEffect(() => {
    if (!canUsePwaApis) return;
    if (!shouldRegisterServiceWorker) return;
    if (!("serviceWorker" in navigator)) return;

    let isCancelled = false;

    const onControllerChange = () => {
      setSwStatus("installed");
      setUpdateAvailable(true);
    };

    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    (async () => {
      setSwStatus("installing");
      const registration = await registerServiceWorker();
      if (isCancelled) return;

      if (!registration) {
        setSwStatus("idle");
        return;
      }

      if (registration.waiting) setUpdateAvailable(true);
      if (registration.active) setSwStatus("installed");

      const handleUpdateFound = () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        setSwStatus(navigator.serviceWorker.controller ? "updating" : "installing");

        installingWorker.addEventListener("statechange", () => {
          if (installingWorker.state === "installed") {
            setSwStatus("installed");
            if (navigator.serviceWorker.controller) setUpdateAvailable(true);
          }
        });
      };

      registration.addEventListener("updatefound", handleUpdateFound);
    })();

    return () => {
      isCancelled = true;
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
    };
  }, [canUsePwaApis, shouldRegisterServiceWorker]);

  return { isInstalled, isOnline, installPrompt, swStatus, updateAvailable };
}
