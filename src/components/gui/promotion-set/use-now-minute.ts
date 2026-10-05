"use client";

import { Formatter } from "@/lib/formatter";
import { useEffect, useState } from "react";

/**
 * Current `YYYY-MM-DD HH:mm:ss` (Asia/Phnom_Penh), refreshed at the start of
 * every minute, so happy-hour promotion cards switch on and off by themselves.
 */
export function useNowMinute(): string {
  const [now, setNow] = useState(() => Formatter.getNowDateTime());
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const tick = () => setNow(Formatter.getNowDateTime());
    const timeout = setTimeout(
      () => {
        tick();
        interval = setInterval(tick, 60_000);
      },
      60_000 - (Date.now() % 60_000),
    );
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
    };
  }, []);
  return now;
}
