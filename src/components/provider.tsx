"use client";

import { AppProgressProvider } from "@bprogress/next";

export function LooadingProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppProgressProvider
      height="3px"
      color="#6366f1"
      options={{ showSpinner: false }}
    >
      {children}
    </AppProgressProvider>
  );
}
