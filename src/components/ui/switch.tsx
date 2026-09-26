"use client";

/**
 * Switch with a squishy, draggable thumb, adapted from React Bits
 * "SquishSwitch" (https://reactbits.dev/c/micro). Same API as the previous
 * Radix switch (checked / defaultChecked / onCheckedChange / disabled / id),
 * so existing usages keep working. Adapted to theme tokens and Tailwind v3.
 */
import {
  type CSSProperties,
  type MouseEventHandler,
  type PointerEvent,
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  useVelocity,
} from "motion/react";
import { cn } from "@/lib/utils";

export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
  name?: string;
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

const WIDTH = 36;
const HEIGHT = 20;
const INSET = 2;
const THUMB = HEIGHT - INSET * 2;
const MIN = INSET;
const MAX = WIDTH - INSET - THUMB;
const MID = (MIN + MAX) / 2;

const FLOW_SPRING = { stiffness: 320, damping: 40, mass: 0.6 };
const SWELL_SPRING = { stiffness: 520, damping: 34, mass: 0.6 };
const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      checked,
      defaultChecked = false,
      onCheckedChange,
      disabled = false,
      id,
      name,
      className,
      onClick,
      ...aria
    },
    forwardedRef,
  ) => {
    const reduce = useReducedMotion();
    const isControlled = checked !== undefined;
    const [inner, setInner] = useState(defaultChecked);
    const on = isControlled ? !!checked : inner;
    const [dragging, setDragging] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    useImperativeHandle(forwardedRef, () => buttonRef.current!);
    const trackRef = useRef<HTMLSpanElement>(null);
    const onRef = useRef(on);
    onRef.current = on;
    const skipClick = useRef(false);
    const grip = useRef<{
      id: number;
      grab: number | null;
      moved: boolean;
      startX: number;
      onAtPress: boolean;
      slop: number;
    } | null>(null);

    const x = useMotionValue(on ? MAX : MIN);
    const flow = useSpring(useVelocity(x), FLOW_SPRING);
    const swell = useSpring(1, SWELL_SPRING);
    const gain = reduce ? 0 : 0.36;
    const stretchOf = (v: number) => 1 + Math.min(0.4, Math.abs(v) / 600) * gain;
    const scaleX = useTransform([flow, swell], ([v, h]: number[]) => stretchOf(v) * h);
    const scaleY = useTransform([flow, swell], ([v, h]: number[]) => h / stretchOf(v));

    const commit = (next: boolean) => {
      if (next === onRef.current) return;
      onRef.current = next;
      if (!isControlled) setInner(next);
      onCheckedChange?.(next);
    };

    useEffect(() => {
      if (dragging) return undefined;
      const target = on ? MAX : MIN;
      if (reduce) {
        x.jump(target);
        return undefined;
      }
      const controls = animate(x, target, {
        type: "spring",
        stiffness: 170,
        damping: 21.5,
        mass: 0.9,
        restDelta: 0.001,
        restSpeed: 0.01,
      });
      return () => controls.stop();
    }, [on, dragging, reduce, x]);

    const localX = (clientX: number) => {
      const el = trackRef.current;
      if (!el) return 0;
      const rect = el.getBoundingClientRect();
      const scale = rect.width / (el.offsetWidth || rect.width) || 1;
      return (clientX - rect.left) / scale;
    };

    const up = (
      e: { pointerId: number; currentTarget: HTMLButtonElement },
      cancelled: boolean,
    ) => {
      const g = grip.current;
      if (!g || g.id !== e.pointerId) return;
      grip.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      if (cancelled) commit(g.onAtPress);
      else if (!g.moved) commit(!onRef.current);
      skipClick.current = true;
      setTimeout(() => {
        skipClick.current = false;
      }, 0);
      setDragging(false);
    };

    return (
      <button
        ref={buttonRef}
        id={id}
        name={name}
        type="button"
        role="switch"
        aria-checked={on}
        aria-disabled={disabled || undefined}
        disabled={disabled}
        data-state={on ? "checked" : "unchecked"}
        {...aria}
        className={cn(
          "peer group relative inline-block shrink-0 cursor-pointer touch-pan-y select-none rounded-full outline-none [-webkit-tap-highlight-color:transparent]",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "disabled:cursor-not-allowed disabled:opacity-50 data-[held]:cursor-grabbing",
          className,
        )}
        data-held={dragging ? "" : undefined}
        style={{ "--sw-w": `${WIDTH}px`, "--sw-h": `${HEIGHT}px` } as CSSProperties}
        onPointerDown={(e: PointerEvent<HTMLButtonElement>) => {
          if (disabled || grip.current || e.button !== 0) return;
          grip.current = {
            id: e.pointerId,
            grab: null,
            moved: false,
            startX: e.clientX,
            onAtPress: onRef.current,
            slop: e.pointerType === "touch" ? 8 : 4,
          };
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {}
          setDragging(true);
        }}
        onPointerMove={(e: PointerEvent<HTMLButtonElement>) => {
          const g = grip.current;
          if (!g || g.id !== e.pointerId) return;
          const lx = localX(e.clientX);
          if (g.grab === null) {
            g.grab = lx - x.get();
            return;
          }
          if (!g.moved && Math.abs(e.clientX - g.startX) > g.slop) g.moved = true;
          if (!g.moved) return;
          const nx = clamp(lx - g.grab, MIN, MAX);
          x.set(nx);
          commit(nx > MID);
        }}
        onPointerUp={(e) => up(e, false)}
        onPointerCancel={(e) => up(e, true)}
        onPointerEnter={(e) => {
          if (e.pointerType === "mouse" && !disabled) swell.set(1.06);
        }}
        onPointerLeave={() => swell.set(1)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && grip.current)
            up({ pointerId: grip.current.id, currentTarget: e.currentTarget }, true);
        }}
        onClick={(e) => {
          onClick?.(e);
          // Clicks inside forms/cards shouldn't bubble to row click handlers
          e.stopPropagation();
          if (skipClick.current) {
            skipClick.current = false;
            return;
          }
          if (!disabled) commit(!onRef.current);
        }}
      >
        <span
          ref={trackRef}
          className="relative block h-[var(--sw-h)] w-[var(--sw-w)] rounded-full bg-input shadow-sm transition-colors duration-200 group-data-[state=checked]:bg-primary motion-reduce:transition-none"
        >
          <motion.span
            aria-hidden="true"
            className="absolute left-0 top-[2px] block size-4 rounded-full bg-background shadow-md"
            style={{ x, scaleX, scaleY }}
          />
        </span>
      </button>
    );
  },
);
Switch.displayName = "Switch";

export { Switch };
