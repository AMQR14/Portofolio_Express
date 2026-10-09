"use client";

import Lenis from "lenis";
import { gsap } from "gsap";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

type ScrollTarget = string | number | HTMLElement;
type ScrollTo = (target: ScrollTarget) => void;

const LenisContext = createContext<ScrollTo>((target) => {
  if (typeof target === "number") {
    window.scrollTo({ top: target });
  } else if (typeof target === "string") {
    document.querySelector(target)?.scrollIntoView();
  } else {
    target.scrollIntoView();
  }
});

export function useLenisScroll() {
  return useContext(LenisContext);
}

export default function LenisProvider({
  children,
}: {
  children: ReactNode;
}) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      autoRaf: false,
      anchors: true,
      lerp: 0.1,
      smoothWheel: true,
      wheelMultiplier: 0.9,
    });
    lenisRef.current = lenis;

    const update = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(update);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(update);
      lenis.destroy();
      lenisRef.current = null;
      gsap.ticker.lagSmoothing(500, 33);
    };
  }, []);

  const scrollTo = useCallback<ScrollTo>((target) => {
    const lenis = lenisRef.current;
    if (lenis) {
      lenis.scrollTo(target, { duration: 1.2 });
      return;
    }

    if (typeof target === "number") {
      window.scrollTo({ top: target });
    } else {
      const element =
        typeof target === "string" ? document.querySelector(target) : target;
      element?.scrollIntoView();
    }
  }, []);

  return (
    <LenisContext.Provider value={scrollTo}>{children}</LenisContext.Provider>
  );
}
