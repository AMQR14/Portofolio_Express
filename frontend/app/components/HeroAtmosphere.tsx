"use client";

import { useEffect, useRef } from "react";

export default function HeroAtmosphere() {
  const atmosphereRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const atmosphere = atmosphereRef.current;
    const hero = atmosphere?.parentElement;
    if (!atmosphere || !hero) return;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let frame = 0;
    let targetX = 50;
    let targetY = 44;
    let currentX = targetX;
    let currentY = targetY;
    let targetProgress = 0;
    let currentProgress = 0;

    const animate = () => {
      const rect = hero.getBoundingClientRect();
      targetProgress = rect.height
        ? Math.min(1, Math.max(0, -rect.top / rect.height))
        : 0;

      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;
      currentProgress += (targetProgress - currentProgress) * 0.14;

      atmosphere.style.setProperty("--hero-glow-x", `${currentX.toFixed(2)}%`);
      atmosphere.style.setProperty("--hero-glow-y", `${currentY.toFixed(2)}%`);
      atmosphere.style.setProperty(
        "--hero-glow-shift",
        `${(currentProgress * 12).toFixed(2)}px`,
      );
      hero.style.setProperty(
        "--hero-grid-shift",
        `${(currentProgress * 14).toFixed(2)}px`,
      );
      hero.style.setProperty(
        "--hero-title-shift",
        `${(-currentProgress * 24).toFixed(2)}px`,
      );

      const stillMoving =
        Math.abs(targetX - currentX) > 0.05 ||
        Math.abs(targetY - currentY) > 0.05 ||
        Math.abs(targetProgress - currentProgress) > 0.001;
      if (stillMoving) {
        frame = requestAnimationFrame(animate);
      } else {
        frame = 0;
      }
    };

    const scheduleUpdate = () => {
      if (!reducedMotion.matches && !frame) {
        frame = requestAnimationFrame(animate);
      }
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (reducedMotion.matches || !finePointer.matches) return;
      const rect = hero.getBoundingClientRect();
      targetX = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
      targetY = Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100));
      scheduleUpdate();
    };

    const resetPointer = () => {
      targetX = 50;
      targetY = 44;
      scheduleUpdate();
    };

    hero.addEventListener("pointermove", handlePointerMove);
    hero.addEventListener("pointerleave", resetPointer);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    scheduleUpdate();

    return () => {
      hero.removeEventListener("pointermove", handlePointerMove);
      hero.removeEventListener("pointerleave", resetPointer);
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      if (frame) cancelAnimationFrame(frame);
      hero.style.removeProperty("--hero-grid-shift");
      hero.style.removeProperty("--hero-title-shift");
    };
  }, []);

  return (
    <div
      ref={atmosphereRef}
      className="ds-hero-atmosphere"
      aria-hidden="true"
    />
  );
}
