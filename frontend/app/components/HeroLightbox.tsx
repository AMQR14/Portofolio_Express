"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

interface HeroLightboxProps {
  src: string;
  title: string;
}

// Same values as ProjectGallery so the two feel identical
const CLOSE_MS = 240;
const MAX_TILT = 9; // degrees
const TILT_EASE = 0.1; // lower = floatier

export default function HeroLightbox({ src, title }: HeroLightboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [mounted, setMounted] = useState(false);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const target = useRef({ x: 0, y: 0 });
  const current = useRef({ x: 0, y: 0 });
  const raf = useRef<number | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => setMounted(true), []);

  const stopRaf = () => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
  };

  const open = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setClosing(false);
    target.current = { x: 0, y: 0 };
    current.current = { x: 0, y: 0 };
    setIsOpen(true);
  };

  const close = useCallback(() => {
    if (closing) return;
    setClosing(true);
    target.current = { x: 0, y: 0 };
    closeTimer.current = setTimeout(() => {
      stopRaf();
      setIsOpen(false);
      setClosing(false);
      triggerRef.current?.focus();
    }, CLOSE_MS);
  }, [closing]);

  // Esc + scroll lock
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, close]);

  // Cleanup on unmount
  useEffect(
    () => () => {
      stopRaf();
      if (closeTimer.current) clearTimeout(closeTimer.current);
    },
    [],
  );

  // Smooth tilt: ease the current angle toward the target every frame
  const tick = useCallback(() => {
    const card = cardRef.current;
    if (!card) {
      raf.current = null;
      return;
    }
    const c = current.current;
    const t = target.current;
    c.x += (t.x - c.x) * TILT_EASE;
    c.y += (t.y - c.y) * TILT_EASE;
    card.style.transform = `perspective(1400px) rotateX(${c.x.toFixed(3)}deg) rotateY(${c.y.toFixed(3)}deg)`;
    const settled =
      Math.abs(t.x - c.x) < 0.01 && Math.abs(t.y - c.y) < 0.01;
    raf.current = settled ? null : requestAnimationFrame(tick);
  }, []);

  const startRaf = () => {
    if (raf.current === null) raf.current = requestAnimationFrame(tick);
  };

  const handleMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse" || closing) return;
    const stage = stageRef.current;
    const card = cardRef.current;
    if (!stage || !card) return;
    const r = stage.getBoundingClientRect();
    const px = Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
    const py = Math.min(Math.max((e.clientY - r.top) / r.height, 0), 1);
    target.current = {
      x: (0.5 - py) * 2 * MAX_TILT,
      y: (px - 0.5) * 2 * MAX_TILT,
    };
    card.style.setProperty("--glare-x", `${(px * 100).toFixed(1)}%`);
    card.style.setProperty("--glare-y", `${(py * 100).toFixed(1)}%`);
    startRaf();
  };

  const handleLeave = () => {
    target.current = { x: 0, y: 0 };
    startRaf();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={open}
        aria-label={`Open ${title} preview`}
        aria-haspopup="dialog"
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          padding: 0,
          margin: 0,
          border: 0,
          background: "none",
          color: "inherit",
          font: "inherit",
          cursor: "zoom-in",
        }}
      >
        <img
          src={src}
          alt={`${title} project preview`}
          className="ds-detail-image"
          fetchPriority="high"
        />
      </button>

      {mounted &&
        isOpen &&
        createPortal(
          <div
            className={`ds-lightbox${closing ? " is-closing" : ""}`}
            role="dialog"
            aria-modal="true"
            aria-label={`${title} image viewer`}
            onClick={close}
          >
            <button
              type="button"
              className="ds-lightbox-btn ds-lightbox-close"
              onClick={close}
              aria-label="Close image viewer"
            >
              <X size={20} aria-hidden="true" />
            </button>

            <div
              ref={stageRef}
              className="ds-lightbox-stage"
              onClick={(e) => e.stopPropagation()}
              onPointerMove={handleMove}
              onPointerLeave={handleLeave}
            >
              <div ref={cardRef} className="ds-lightbox-card">
                <div className="ds-lightbox-image-wrap">
                  <img
                    className="ds-lightbox-img is-none"
                    src={src}
                    alt={`${title} project preview`}
                    draggable={false}
                  />
                  <span className="ds-lightbox-glare" aria-hidden="true" />
                </div>
                <div className="ds-lightbox-caption">
                  <span>{title}</span>
                  <span>Preview</span>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
