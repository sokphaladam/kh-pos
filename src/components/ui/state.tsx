"use client";

import { type ReactNode } from "react";
import { type LucideIcon, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { LatticeLoader, type LatticePatternName } from "./lattice-loader";

/**
 * Standard loading block for pages, sections, cards and charts.
 * Replaces ad-hoc "Loading..." text so every loading state looks the same.
 */
export function LoadingState({
  label = "Loading",
  pattern = "orbit",
  className,
  fullScreen = false,
}: {
  label?: string;
  pattern?: LatticePatternName;
  className?: string;
  /** Fill the viewport height (route-level loading) */
  fullScreen?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex w-full items-center justify-center p-8",
        fullScreen ? "min-h-screen" : "min-h-[160px]",
        className,
      )}
    >
      <LatticeLoader label={label} pattern={pattern} />
    </div>
  );
}

/**
 * Standard empty state: icon, title, optional description and action.
 */
export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-muted">
        <Icon className="size-6 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        {description ? (
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="pt-1">{action}</div> : null}
    </div>
  );
}
