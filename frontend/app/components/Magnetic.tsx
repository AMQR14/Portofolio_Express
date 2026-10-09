"use client";

import React, { useRef } from "react";

interface MagneticProps {
  children: React.ReactElement<{ style?: React.CSSProperties; className?: string }>;
  strength?: number; // 0 to 1
  textStrength?: number;
}

export default function Magnetic({
  children,
  strength = 0.35,
  textStrength = 0.5,
}: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const origin = useRef<{ x: number; y: number } | null>(null);

  const isCapable = () => {
    if (typeof window === "undefined") return false;
    // Disable magnetic physics on screens <= 900px or touch screens to keep mobile buttons completely stable
    if (window.innerWidth <= 900) return false;
    return (
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  };

  const handleMouseEnter = () => {
    const element = ref.current;
    if (!element) return;
    element.classList.remove("is-returning");

    if (!isCapable()) {
      element.style.setProperty("translate", "0 0");
      const child = element.firstElementChild;
      if (child instanceof HTMLElement) child.style.setProperty("translate", "0 0");
      origin.current = null;
      return;
    }

    const bounds = element.getBoundingClientRect();
    if (bounds) {
      origin.current = {
        x: bounds.left + bounds.width / 2,
        y: bounds.top + bounds.height / 2,
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isCapable()) return;
    if (!ref.current || !origin.current) return;
    const middleX = e.clientX - origin.current.x;
    const middleY = e.clientY - origin.current.y;
    const x = Math.max(-18, Math.min(18, middleX * strength * 0.7));
    const y = Math.max(-18, Math.min(18, middleY * strength * 0.7));
    ref.current.style.setProperty("translate", `${x}px ${y}px`);
    const child = ref.current.firstElementChild;
    if (child instanceof HTMLElement) {
      child.style.setProperty(
        "translate",
        `${Math.max(-10, Math.min(10, middleX * textStrength * 0.45))}px ${Math.max(-10, Math.min(10, middleY * textStrength * 0.45))}px`,
      );
    }
  };

  const handleMouseLeave = () => {
    origin.current = null;
    const element = ref.current;
    if (!element) return;
    if (!isCapable()) {
      element.classList.remove("is-returning");
      element.style.setProperty("translate", "0 0");
      const child = element.firstElementChild;
      if (child instanceof HTMLElement) child.style.setProperty("translate", "0 0");
      return;
    }

    element.classList.add("is-returning");
    element.style.setProperty("translate", "0 0");
    const child = element.firstElementChild;
    if (child instanceof HTMLElement) child.style.setProperty("translate", "0 0");
  };

  return (
    <div
      ref={ref}
      className="ds-magnetic"
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {React.cloneElement(children)}
    </div>
  );
}
