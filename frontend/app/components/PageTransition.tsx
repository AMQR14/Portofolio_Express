"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { gsap } from "gsap";

type TransitionPhase = "idle" | "cover" | "reveal";

export default function PageTransition({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const previousPathname = useRef(pathname);
  const pendingNavigation = useRef(false);
  const pendingHref = useRef<string | null>(null);
  const pendingAuthChange = useRef<(() => void) | null>(null);
  const curtainRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [, startTransition] = useTransition();
  const [phase, setPhase] = useState<TransitionPhase>("idle");

  useEffect(() => {
    if (previousPathname.current === pathname) return;

    previousPathname.current = pathname;
    pendingNavigation.current = false;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      startTransition(() => setPhase("idle"));
      return;
    }
    startTransition(() => setPhase("reveal"));
  }, [pathname, startTransition]);

  useLayoutEffect(() => {
    const curtain = curtainRef.current;
    const label = labelRef.current;
    if (!curtain || !label || phase === "idle") return;

    const timeline = gsap.timeline({
      onComplete: () => {
        if (phase === "cover" && pendingHref.current) {
          router.push(pendingHref.current);
          pendingHref.current = null;
        } else if (phase === "cover" && pendingAuthChange.current) {
          const applyAuthChange = pendingAuthChange.current;
          pendingAuthChange.current = null;
          applyAuthChange();
          pendingNavigation.current = false;
          setPhase("reveal");
        } else if (phase === "reveal") {
          setPhase("idle");
        }
      },
    });

    if (phase === "cover") {
      gsap.set(curtain, { yPercent: 105 });
      gsap.set(label, { autoAlpha: 0, y: 8 });
      timeline.to(curtain, {
        yPercent: 0,
        duration: 0.9,
        ease: "power3.inOut",
      });
      timeline.to(
        label,
        { autoAlpha: 1, y: 0, duration: 0.3, ease: "power2.out" },
        0.55,
      );
      timeline.to(label, {
        autoAlpha: 1,
        y: 0,
        duration: 0.2,
        ease: "none",
      });
    } else {
      gsap.set(curtain, { yPercent: 0 });
      gsap.set(label, { autoAlpha: 1, y: 0 });
      timeline.to(label, {
        autoAlpha: 0,
        y: -8,
        duration: 0.3,
        ease: "power2.in",
      });
      timeline.to(
        curtain,
        { yPercent: -105, duration: 1.65, ease: "power3.inOut" },
        0,
      );
    }

    return () => {
      timeline.kill();
    };
  }, [phase, router]);

  useEffect(() => {
    const handleAuthTransition = (event: Event) => {
      const applyAuthChange = (event as CustomEvent<() => void>).detail;
      if (typeof applyAuthChange !== "function") return;

      if (
        window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        phase !== "idle" ||
        pendingNavigation.current
      ) {
        applyAuthChange();
        return;
      }

      pendingNavigation.current = true;
      pendingHref.current = null;
      pendingAuthChange.current = applyAuthChange;
      setPhase("cover");
    };

    window.addEventListener("portfolio-auth-transition", handleAuthTransition);
    return () => {
      window.removeEventListener(
        "portfolio-auth-transition",
        handleAuthTransition,
      );
    };
  }, [phase]);

  useEffect(() => {
    const handleNavigation = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        !(event.target instanceof Element)
      ) {
        return;
      }

      const link = event.target.closest("a");
      if (!link || link.hasAttribute("download") || link.target === "_blank") {
        return;
      }

      const destination = new URL(link.href, window.location.href);
      if (
        destination.origin !== window.location.origin ||
        destination.pathname === window.location.pathname
      ) {
        return;
      }

      event.preventDefault();
      if (pendingNavigation.current) return;

      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        router.push(
          `${destination.pathname}${destination.search}${destination.hash}`,
        );
        return;
      }

      pendingNavigation.current = true;
      pendingHref.current = `${destination.pathname}${destination.search}${destination.hash}`;
      setPhase("cover");
    };

    document.addEventListener("click", handleNavigation, true);
    return () => {
      document.removeEventListener("click", handleNavigation, true);
    };
  }, [router]);

  return (
    <>
      {children}
      {phase !== "idle" && (
        <div
          ref={curtainRef}
          className={`ds-page-transition is-${phase}`}
          aria-hidden="true"
        >
          <span ref={labelRef} className="ds-page-transition-label">
            AMQR14
          </span>
        </div>
      )}
    </>
  );
}