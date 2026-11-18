"use client";

import { AppProgressProvider } from "@bprogress/next";
import { OfflineScreen } from "./offline-screen";

export function LooadingProviders({ children }: { children: React.ReactNode }) {
  return (
    <AppProgressProvider
      height="3px"
      color="#6366f1"
      options={{ showSpinner: false }}
    >
      {children}
      <OfflineScreen />
    </AppProgressProvider>
  );
}
