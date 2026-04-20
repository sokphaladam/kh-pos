"use client";
import { useRef } from "react";

export default function useDebounce(timer: number) {
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  return (callback: () => void) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(callback, timer);
  };
}
