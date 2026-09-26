import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "./card";
import { Skeleton } from "./skeleton";

/**
 * Standard page header: title, optional description and right-aligned actions.
 * Use at the top of every admin page so titles look the same everywhere.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <h1 className="truncate text-2xl font-semibold tracking-tight text-foreground">
          {title}
        </h1>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

/** Standard page body width and spacing */
export function PageContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6", className)}>
      {children}
    </div>
  );
}

export type StatTone = "default" | "success" | "warning" | "info" | "destructive";

const TONE_CHIP: Record<StatTone, string> = {
  default: "bg-muted text-muted-foreground",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
  destructive: "bg-destructive/10 text-destructive",
};

/**
 * KPI tile: label, big value, optional hint line (e.g. "12 orders" or a trend).
 * Color lives only in the icon chip so a row of stats stays calm and readable.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "default",
  loading = false,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  hint?: ReactNode;
  icon?: LucideIcon;
  tone?: StatTone;
  loading?: boolean;
  className?: string;
}) {
  return (
    <Card className={cn("min-w-0 p-4 shadow-sm", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {Icon ? (
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-md",
              TONE_CHIP[tone],
            )}
          >
            <Icon className="size-4" />
          </span>
        ) : null}
      </div>
      {loading ? (
        <>
          <Skeleton className="mt-2 h-7 w-28" />
          <Skeleton className="mt-2 h-4 w-20" />
        </>
      ) : (
        <>
          <div className="mt-1 truncate text-2xl font-semibold tabular-nums tracking-tight text-foreground">
            {value}
          </div>
          {hint ? (
            <div className="mt-1 text-xs text-muted-foreground">{hint}</div>
          ) : null}
        </>
      )}
    </Card>
  );
}
