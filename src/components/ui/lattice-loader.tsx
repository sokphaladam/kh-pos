"use client";

/**
 * Animated lattice loading indicator, adapted from React Bits "LatticeLoader"
 * (https://reactbits.dev/c/micro). Cells brighten in a phase-offset wave while
 * working and morph into a check / cross mark on done / error.
 *
 * Adapted to theme tokens and Tailwind v3. Prefer <LoadingState /> for page or
 * section loading; use this directly for inline status (e.g. "Printing…").
 */
import {
  type CSSProperties,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

export type LatticeStatus = "working" | "done" | "error";
export type LatticePatternName = "orbit" | "snake" | "ripple" | "sweep" | "pulse";

type Grid = 3 | 4;
type ResolvedPattern = { cells: (number | null)[]; loop: number; scale: number; lit: number };

const PATTERNS: Record<LatticePatternName, ResolvedPattern & { grid: Grid }> = {
  orbit: { grid: 3, cells: [0, 1, 2, 7, null, 3, 6, 5, 4], loop: 8, scale: 1.2, lit: 62 },
  snake: { grid: 3, cells: [0, 1, 2, 5, 4, 3, 6, 7, 8], loop: 9, scale: 1, lit: 35 },
  ripple: { grid: 3, cells: [2, 1, 2, 1, 0, 1, 2, 1, 2], loop: 4.8, scale: 1.5, lit: 62 },
  sweep: {
    grid: 4,
    cells: [0, 1, 2, 3, 1, 2, 3, 4, 2, 3, 4, 5, 3, 4, 5, 6],
    loop: 5,
    scale: 1,
    lit: 45,
  },
  pulse: {
    grid: 4,
    cells: [2, 1, 1, 2, 1, 0, 0, 1, 1, 0, 0, 1, 2, 1, 1, 2],
    loop: 2.4,
    scale: 2.5,
    lit: 45,
  },
};

const MARKS: Record<Grid, Record<"done" | "error", number[]>> = {
  3: { done: [2, 3, 5, 7], error: [0, 2, 4, 6, 8] },
  4: { done: [7, 8, 10, 13], error: [0, 3, 5, 6, 9, 10, 12, 15] },
};

const CELL =
  "h-[var(--ll-cell)] w-[var(--ll-cell)] rounded-full [background:var(--ll-color)]";

// Literal class names so Tailwind can pick them up
const LIT: Record<number, string> = {
  62: "animate-[lattice-on_var(--ll-cycle)_infinite]",
  45: "animate-[lattice-on-45_var(--ll-cycle)_infinite]",
  35: "animate-[lattice-on-35_var(--ll-cycle)_infinite]",
};

const STYLE = `
@keyframes lattice-on { 0%, 100% { opacity: var(--ll-idle); } 18%, 42% { opacity: 1; } 62% { opacity: var(--ll-idle); } }
@keyframes lattice-on-45 { 0%, 100% { opacity: var(--ll-idle); } 13%, 31% { opacity: 1; } 45% { opacity: var(--ll-idle); } }
@keyframes lattice-on-35 { 0%, 100% { opacity: var(--ll-idle); } 10%, 24% { opacity: 1; } 35% { opacity: var(--ll-idle); } }
@media (prefers-reduced-motion: reduce) {
  .ll-run > span { animation-delay: 0ms !important; animation-duration: 1400ms !important; }
  .ll-mark { transform: none !important; }
}`;

export interface LatticeLoaderProps {
  label?: string;
  doneLabel?: string;
  errorLabel?: string;
  status?: LatticeStatus;
  pattern?: LatticePatternName;
  /** Cell size in px; the lattice is 3-4 cells wide */
  cellSize?: number;
  gap?: number;
  /** Color of the working cells (defaults to the primary token) */
  color?: string;
  showTimer?: boolean;
  className?: string;
  style?: CSSProperties;
}

const fmt = (ds: number) =>
  ds < 600
    ? `${(ds / 10).toFixed(1)}s`
    : `${Math.floor(ds / 600)}m ${((ds % 600) / 10).toFixed(1)}s`;

export function LatticeLoader({
  label = "Loading",
  doneLabel = "Done",
  errorLabel = "Failed",
  status = "working",
  pattern = "orbit",
  cellSize = 5,
  gap = 2,
  color = "hsl(var(--primary))",
  showTimer = false,
  className,
  style,
}: LatticeLoaderProps) {
  const pat = PATTERNS[pattern] ?? PATTERNS.orbit;
  const n = pat.grid;
  const d = 90 * pat.scale;
  const cycle = Math.round(pat.loop * d);
  const markRef = useRef<"done" | "error">("done");
  const mark = status === "working" ? markRef.current : status;
  markRef.current = mark;
  const timerRef = useRef<HTMLSpanElement>(null);
  const [announce, setAnnounce] = useState(`${label}, in progress`);

  useLayoutEffect(() => {
    if (!showTimer || status !== "working") return undefined;
    const startedAt = performance.now();
    const id = setInterval(() => {
      if (timerRef.current)
        timerRef.current.textContent = fmt(
          Math.floor((performance.now() - startedAt) / 100),
        );
    }, 100);
    return () => clearInterval(id);
  }, [status, showTimer]);

  useEffect(() => {
    setAnnounce(
      status === "working"
        ? `${label}, in progress`
        : status === "done"
          ? doneLabel
          : errorLabel,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <span
      role="status"
      data-status={status}
      className={cn(
        "group inline-flex items-center gap-2.5 text-sm leading-none text-muted-foreground",
        className,
      )}
      style={
        {
          "--ll-n": n,
          "--ll-cell": `${cellSize}px`,
          "--ll-gap": `${gap}px`,
          "--ll-color": color,
          "--ll-mark":
            status === "error" ? "hsl(var(--destructive))" : "hsl(var(--success))",
          "--ll-idle": 0.15,
          "--ll-cycle": `${cycle}ms`,
          ...style,
        } as CSSProperties
      }
    >
      <style>{STYLE}</style>
      <span className="grid shrink-0" aria-hidden="true">
        <span className="ll-run grid [grid-area:1/1] [gap:var(--ll-gap)] [grid-template-columns:repeat(var(--ll-n),var(--ll-cell))] [transition:opacity_200ms_ease] group-data-[status=done]:opacity-0 group-data-[status=error]:opacity-0">
          {pat.cells.map((unit, i) => (
            <span
              key={i}
              className={
                unit == null
                  ? cn(CELL, "opacity-[0.07]")
                  : cn(
                      CELL,
                      "[opacity:var(--ll-idle)] [animation-timing-function:cubic-bezier(0.77,0,0.175,1)]",
                      LIT[pat.lit] ?? LIT[62],
                    )
              }
              style={unit == null ? undefined : { animationDelay: `${Math.round(unit * d)}ms` }}
            />
          ))}
        </span>
        <span className="ll-mark grid scale-90 opacity-0 [grid-area:1/1] [gap:var(--ll-gap)] [grid-template-columns:repeat(var(--ll-n),var(--ll-cell))] [transition:opacity_200ms_ease,transform_200ms_cubic-bezier(0.23,1,0.32,1)] group-data-[status=done]:scale-100 group-data-[status=done]:opacity-100 group-data-[status=error]:scale-100 group-data-[status=error]:opacity-100">
          {pat.cells.map((_, i) => (
            <span
              key={i}
              className={cn(
                CELL,
                "[opacity:var(--ll-idle)] data-[on]:opacity-100 data-[on]:[background:var(--ll-mark)]",
              )}
              data-on={MARKS[n][mark].includes(i) ? "" : undefined}
            />
          ))}
        </span>
      </span>
      {label || doneLabel || errorLabel ? (
        <span className="font-medium" aria-hidden="true">
          {status === "working" ? label : status === "done" ? doneLabel : errorLabel}
        </span>
      ) : null}
      {showTimer ? (
        <span ref={timerRef} className="font-mono text-xs tabular-nums opacity-60" aria-hidden="true">
          0.0s
        </span>
      ) : null}
      <span className="sr-only">{announce}</span>
    </span>
  );
}
