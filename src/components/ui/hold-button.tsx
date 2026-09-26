"use client";

/**
 * Hold-to-confirm button, adapted from React Bits "HoldButton"
 * (https://reactbits.dev/c/micro). Use it for destructive or irreversible
 * actions instead of a confirm dialog: the action only fires after the user
 * presses and holds, and a quick tap does nothing (or calls `onTap`).
 *
 * Adapted to the app theme tokens, Button sizes/radius and Tailwind v3.
 */
import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

type HoldButtonVariant = "destructive" | "default" | "success";
type HoldButtonSize = "sm" | "md" | "lg";

export interface HoldButtonProps {
  children?: ReactNode;
  /** Label shown briefly after the hold completes */
  doneLabel?: ReactNode;
  icon?: ReactNode;
  doneIcon?: ReactNode;
  variant?: HoldButtonVariant;
  size?: HoldButtonSize;
  /** Hold duration in ms */
  holdTime?: number;
  releaseTime?: number;
  /** Return to idle this many ms after completing (0 = stay done) */
  resetAfter?: number;
  disabled?: boolean;
  onHold?: () => void;
  onTap?: () => void;
  className?: string;
  "aria-label"?: string;
}

type Phase = "idle" | "holding" | "done";
type Input = "pointer" | "key" | null;

const TAP_MS = 250;
const HIT_PAD = 10;
const LINEAR = (t: number) => t;
const EASE_OUT = (t: number) => 1 - Math.pow(1 - t, 3);

// Same heights as <Button size="sm" | "default" | "lg">
const SIZES: Record<HoldButtonSize, string> = {
  sm: "h-8 px-3 text-xs",
  md: "h-9 px-4 text-sm",
  lg: "h-10 px-8 text-sm",
};

const VARIANTS: Record<
  HoldButtonVariant,
  { bg: string; text: string; fill: string; fillText: string }
> = {
  destructive: {
    bg: "hsl(var(--destructive) / 0.1)",
    text: "hsl(var(--destructive))",
    fill: "hsl(var(--destructive))",
    fillText: "hsl(var(--destructive-foreground))",
  },
  default: {
    bg: "hsl(var(--secondary))",
    text: "hsl(var(--secondary-foreground))",
    fill: "hsl(var(--primary))",
    fillText: "hsl(var(--primary-foreground))",
  },
  success: {
    bg: "hsl(var(--success) / 0.1)",
    text: "hsl(var(--success))",
    fill: "hsl(var(--success))",
    fillText: "hsl(var(--success-foreground))",
  },
};

const LABEL_SPAN =
  "[grid-area:1/1] inline-flex items-center gap-2 whitespace-nowrap [transition:opacity_200ms_ease,filter_200ms_ease] [&_svg]:size-4 [&_svg]:shrink-0";

const WAVE_Y =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='200' viewBox='0 0 20 200' preserveAspectRatio='none'%3E%3Cpath d='M0 0H10C18 8 18 25.3 10 33.3S2 58.7 10 66.7S18 92 10 100S2 125.3 10 133.3S18 158.7 10 166.7S2 192 10 200H0Z'/%3E%3C/svg%3E\")";

const STYLE = `
.hb-root{--hb-w:0px;--hb-h:0px;--hb-p:0}
.hb-fill{clip-path:inset(0 calc((1 - var(--hb-p)) * (100% + 0.75 * var(--hb-wave)) - var(--hb-p) * 0.25 * var(--hb-wave)) 0 0)}
.hb-crest{-webkit-mask-image:${WAVE_Y};mask-image:${WAVE_Y};-webkit-mask-repeat:repeat-y;mask-repeat:repeat-y;-webkit-mask-size:var(--hb-wave) calc(var(--hb-h) * 2);mask-size:var(--hb-wave) calc(var(--hb-h) * 2);-webkit-mask-position-x:calc(-1 * var(--hb-wave) + var(--hb-p) * (var(--hb-w) + var(--hb-wave)));mask-position-x:calc(-1 * var(--hb-wave) + var(--hb-p) * (var(--hb-w) + var(--hb-wave)));-webkit-mask-position-y:calc(-1 * var(--hb-p) * var(--hb-cycles) * var(--hb-h));mask-position-y:calc(-1 * var(--hb-p) * var(--hb-cycles) * var(--hb-h))}
.hb-root[data-phase=holding],.hb-root[data-phase=done]{box-shadow:0 8px 24px -8px color-mix(in srgb,var(--hb-fill) 60%,transparent)}
.hb-root[data-phase=holding][data-input=pointer]{transform:scale(0.97)}
@keyframes hb-pulse{from{opacity:1;box-shadow:0 0 0 0 color-mix(in srgb,var(--hb-fill) 55%,transparent)}to{opacity:0;box-shadow:0 0 0 12px color-mix(in srgb,var(--hb-fill) 0%,transparent)}}
.hb-root[data-phase=done] .hb-pulse{animation:hb-pulse 600ms cubic-bezier(0.23,1,0.32,1) forwards}
@media (prefers-reduced-motion:reduce){
.hb-root{transform:none!important}
.hb-fill{clip-path:inset(0)!important;opacity:0;transition:opacity var(--hb-release) ease!important}
.hb-crest{display:none}
.hb-root[data-phase=holding] .hb-fill,.hb-root[data-phase=done] .hb-fill{opacity:1;transition:opacity var(--hb-hold) linear!important}
.hb-pulse{animation:none!important}
}`;

export function HoldButton({
  children = "Hold to delete",
  doneLabel = "Done",
  icon = null,
  doneIcon = null,
  variant = "destructive",
  size = "md",
  holdTime = 1200,
  releaseTime = 200,
  resetAfter = 1200,
  disabled = false,
  onHold,
  onTap,
  className,
  "aria-label": ariaLabel,
}: HoldButtonProps) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [input, setInput] = useState<Input>(null);
  const phaseRef = useRef<Phase>("idle");
  const inputRef = useRef<Input>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const gesture = useRef<{
    pointerId: number | null;
    start: number;
    rect: DOMRect | null;
  }>({ pointerId: null, start: 0, rect: null });
  const timers = useRef({ complete: 0, reset: 0 });
  const motion = useRef({ raf: 0, p: 0, from: 0, to: 0, start: 0 });
  const hintId = useId();

  const go = (next: Phase, kind: Input = null) => {
    phaseRef.current = next;
    inputRef.current = kind;
    setPhase(next);
    setInput(kind);
  };

  const clearTimers = () => {
    clearTimeout(timers.current.complete);
    clearTimeout(timers.current.reset);
  };

  const drive = (to: number, duration: number, ease: (t: number) => number) => {
    const m = motion.current;
    cancelAnimationFrame(m.raf);
    m.from = m.p;
    m.to = to;
    m.start = performance.now();
    const step = (now: number) => {
      const t = duration > 0 ? Math.min(1, (now - m.start) / duration) : 1;
      m.p = m.from + (m.to - m.from) * ease(t);
      buttonRef.current?.style.setProperty("--hb-p", m.p.toFixed(4));
      if (t < 1) {
        m.raf = requestAnimationFrame(step);
        return;
      }
      m.raf = 0;
      if (m.to === 1) complete();
    };
    m.raf = requestAnimationFrame(step);
  };

  const complete = () => {
    if (phaseRef.current !== "holding") return;
    if (performance.now() - gesture.current.start < holdTime - 50) return;
    clearTimers();
    go("done", inputRef.current);
    onHold?.();
    if (resetAfter > 0) {
      timers.current.reset = window.setTimeout(() => {
        go("idle");
        drive(0, releaseTime, EASE_OUT);
      }, resetAfter);
    }
  };

  const begin = (kind: Input) => {
    if (disabled || phaseRef.current !== "idle") return false;
    const button = buttonRef.current;
    if (!button) return false;
    gesture.current.start = performance.now();
    gesture.current.rect = button.getBoundingClientRect();
    go("holding", kind);
    drive(1, holdTime, LINEAR);
    timers.current.complete = window.setTimeout(complete, holdTime + 100);
    return true;
  };

  const release = ({ drifted = false }: { drifted?: boolean } = {}) => {
    if (phaseRef.current !== "holding") return;
    clearTimers();
    const held = performance.now() - gesture.current.start;
    go("idle");
    drive(0, releaseTime, EASE_OUT);
    if (!drifted && held < TAP_MS) onTap?.();
  };
  const releaseRef = useRef(release);
  releaseRef.current = release;

  const endPointer = (
    e: React.PointerEvent<HTMLButtonElement>,
    options?: { drifted?: boolean },
  ) => {
    if (e.pointerId !== gesture.current.pointerId) return;
    gesture.current.pointerId = null;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId))
        e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}
    release(options);
  };

  useLayoutEffect(() => {
    const button = buttonRef.current;
    if (!button) return undefined;
    const measure = () => {
      button.style.setProperty("--hb-w", `${button.offsetWidth}px`);
      button.style.setProperty("--hb-h", `${button.offsetHeight}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(button);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (phase !== "holding") return undefined;
    const cancel = () => releaseRef.current({ drifted: true });
    const onVisibility = () => {
      if (document.hidden) cancel();
    };
    window.addEventListener("blur", cancel);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("blur", cancel);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [phase]);

  useEffect(() => {
    const t = timers.current;
    const m = motion.current;
    return () => {
      clearTimeout(t.complete);
      clearTimeout(t.reset);
      cancelAnimationFrame(m.raf);
    };
  }, []);

  const colors = VARIANTS[variant];
  const labels = (
    <>
      <span
        className={cn(
          LABEL_SPAN,
          "group-data-[phase=done]:opacity-0 group-data-[phase=done]:blur-[2px]",
        )}
        aria-hidden={phase === "done"}
      >
        {icon}
        {children}
      </span>
      <span
        className={cn(
          LABEL_SPAN,
          "opacity-0 blur-[2px] group-data-[phase=done]:opacity-100 group-data-[phase=done]:blur-0",
        )}
        aria-hidden={phase !== "done"}
      >
        {doneIcon}
        {doneLabel}
      </span>
    </>
  );

  return (
    <button
      ref={buttonRef}
      type="button"
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={hintId}
      data-phase={phase}
      data-input={input ?? undefined}
      className={cn(
        "hb-root group relative isolate inline-grid touch-manipulation select-none place-items-center rounded-md font-medium leading-none outline-none [-webkit-tap-highlight-color:transparent] [-webkit-touch-callout:none] [background:var(--hb-bg)] [color:var(--hb-text)] [transition:transform_160ms_cubic-bezier(0.23,1,0.32,1),box-shadow_200ms_ease]",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:pointer-events-none disabled:opacity-50",
        SIZES[size],
        className,
      )}
      style={
        {
          "--hb-bg": colors.bg,
          "--hb-text": colors.text,
          "--hb-fill": colors.fill,
          "--hb-fill-text": colors.fillText,
          "--hb-hold": `${holdTime}ms`,
          "--hb-cycles": holdTime / 1100,
          "--hb-release": `${releaseTime}ms`,
          "--hb-wave": "5px",
        } as CSSProperties
      }
      onPointerDown={(e) => {
        if (e.button !== 0 || !e.isPrimary || gesture.current.pointerId !== null)
          return;
        // Keep the press from triggering parent click handlers (e.g. cards)
        e.stopPropagation();
        if (!begin("pointer")) return;
        gesture.current.pointerId = e.pointerId;
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {}
      }}
      onPointerMove={(e) => {
        if (e.pointerId !== gesture.current.pointerId) return;
        const r = gesture.current.rect;
        if (!r) return;
        const out =
          e.clientX < r.left - HIT_PAD ||
          e.clientX > r.right + HIT_PAD ||
          e.clientY < r.top - HIT_PAD ||
          e.clientY > r.bottom + HIT_PAD;
        if (out) endPointer(e, { drifted: true });
      }}
      onPointerUp={(e) => endPointer(e)}
      onPointerCancel={(e) => endPointer(e, { drifted: true })}
      onLostPointerCapture={(e) => endPointer(e, { drifted: true })}
      onPointerLeave={(e) => {
        if (e.pointerType !== "touch") endPointer(e, { drifted: true });
      }}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          if (inputRef.current === "key") release({ drifted: true });
          return;
        }
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          if (!e.repeat) begin("key");
        }
      }}
      onKeyUp={(e) => {
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          if (inputRef.current === "key") release();
        }
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      <style>{STYLE}</style>
      <span
        className="hb-pulse pointer-events-none absolute inset-0 z-0 rounded-md opacity-0"
        aria-hidden="true"
      />
      <span className="relative z-[2] grid place-items-center">{labels}</span>
      <span
        className="pointer-events-none absolute inset-0 z-[3] overflow-hidden rounded-md"
        aria-hidden="true"
      >
        <span className="hb-fill absolute inset-0 grid place-items-center [background:var(--hb-fill)] [color:var(--hb-fill-text)]">
          <span className="grid place-items-center">{labels}</span>
        </span>
        <span className="hb-crest absolute inset-0 grid place-items-center [background:var(--hb-fill)] [color:var(--hb-fill-text)]">
          <span className="grid place-items-center">{labels}</span>
        </span>
      </span>
      <span id={hintId} className="sr-only">
        Press and hold for {Math.round(holdTime / 100) / 10} seconds to confirm
      </span>
    </button>
  );
}
