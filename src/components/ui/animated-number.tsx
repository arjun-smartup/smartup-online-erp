"use client";

import React, { useEffect, useState, useRef } from "react";

export interface AnimatedNumberProps {
  /** Target numeric value to count to */
  value: number;
  /** Duration of counting animation in milliseconds (default: 1200ms) */
  duration?: number;
  /** Delay in milliseconds before animation begins */
  delay?: number;
  /** Optional prefix string, e.g. "₹ " */
  prefix?: string;
  /** Optional suffix string, e.g. " / st" */
  suffix?: string;
  /** Custom formatter function (defaults to n.toLocaleString()) */
  format?: (val: number) => string;
  /** Starting number for animation (default: 0) */
  from?: number;
  /** Additional CSS class names */
  className?: string;
}

// Silky smooth Ease-Out-Expo function: explosive start with gradual, elegant deceleration
function easeOutExpo(t: number): number {
  return t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

export function AnimatedNumber({
  value,
  duration = 1200,
  delay = 0,
  prefix = "",
  suffix = "",
  format,
  from = 0,
  className,
}: AnimatedNumberProps) {
  const target = typeof value === "number" && !isNaN(value) ? value : 0;
  const [displayValue, setDisplayValue] = useState<number>(from);
  const prevValueRef = useRef<number>(from);

  useEffect(() => {
    // Accessibility check: Skip animation for users with prefers-reduced-motion
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setDisplayValue(target);
      prevValueRef.current = target;
      return;
    }

    let rafId: number;
    let timerId: ReturnType<typeof setTimeout>;
    const startValue = prevValueRef.current;
    const diff = target - startValue;

    // If no change needed and not initial mount, keep value
    if (diff === 0 && startValue === target) {
      setDisplayValue(target);
      return;
    }

    const startAnimation = () => {
      const startTime = performance.now();

      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(1, Math.max(0, elapsed / duration));
        const eased = easeOutExpo(progress);
        const current = Math.round(startValue + diff * eased);

        setDisplayValue(current);

        if (progress < 1) {
          rafId = requestAnimationFrame(step);
        } else {
          setDisplayValue(target);
          prevValueRef.current = target;
        }
      };

      rafId = requestAnimationFrame(step);
    };

    if (delay > 0) {
      timerId = setTimeout(startAnimation, delay);
    } else {
      startAnimation();
    }

    return () => {
      if (timerId) clearTimeout(timerId);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [target, duration, delay]);

  const formatted = format ? format(displayValue) : displayValue.toLocaleString();

  return (
    <span className={`inline-block tabular-nums ${className || ""}`}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

export default AnimatedNumber;
