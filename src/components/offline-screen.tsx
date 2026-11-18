"use client";

import { Button } from "@/components/ui/button";
import { isOffline, setOffline, subscribeOffline } from "@/lib/network-status";
import { WifiOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useSyncExternalStore } from "react";
import { mutate } from "swr";

// Full-screen "no internet" page. Rendered as an overlay rather than a route:
// navigating to a new route needs the network, which is exactly what's missing.
export function OfflineScreen() {
  const t = useTranslations("common");
  const offline = useSyncExternalStore(subscribeOffline, isOffline, () => false);
  const [checking, setChecking] = useState(false);

  if (!offline) return null;

  const retry = async () => {
    setChecking(true);
    try {
      const res = await fetch("/api/user/has-user", { cache: "no-store" });
      if (res.ok) {
        setOffline(false);
        mutate(() => true); // refetch everything that failed while offline
      }
    } catch {
      // still offline
    } finally {
      setChecking(false);
    }
  };

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="offline-title"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-background p-6 text-center"
    >
      <WifiOff className="h-16 w-16 text-muted-foreground" aria-hidden />
      <h1 id="offline-title" className="text-2xl font-semibold">
        {t("offlineTitle")}
      </h1>
      <p className="max-w-sm text-muted-foreground">{t("offlineMessage")}</p>
      <Button onClick={retry} disabled={checking}>
        {checking ? t("loading") : t("retry")}
      </Button>
    </div>
  );
}
