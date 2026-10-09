"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface ProjectGalleryProps {
  images: string[];
  title: string;
}

const CLOSE_MS = 240;
const MAX_TILT = 9; // degrees
const TILT_EASE = 0.1; // lower = floatier

export default function ProjectGallery({ images, title }: ProjectGalleryProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [closing, setClosing] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev" | "none">("none");
  const [mounted, setMounted] = useState(false);

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

  const open = (i: number) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setClosing(false);
    setDirection("none");
    target.current = { x: 0, y: 0 };
    current.current = { x: 0, y: 0 };
    setOpenIndex(i);
  };

  const close = useCallback(() => {
    if (closing) return;
    setClosing(true);
    target.current = { x: 0, y: 0 };
    closeTimer.current = setTimeout(() => {
      stopRaf();
      setOpenIndex(null);
      setClosing(false);
    }, CLOSE_MS);
  }, [closing]);

  const go = useCallback(
    (dir: 1 | -1) => {
      setDirection(dir === 1 ? "next" : "prev");
      setOpenIndex((i) =>
        i === null ? i : (i + dir + images.length) % images.length,
      );
    },
    [images.length],
  );

  const jumpTo = (i: number) => {
    if (openIndex === null || i === openIndex) return;
    setDirection(i > openIndex ? "next" : "prev");
    setOpenIndex(i);
  };

  // Keyboard + scroll lock
  useEffect(() => {
    if (openIndex === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [openIndex, close, go]);

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

  const src = openIndex !== null ? images[openIndex] : null;
  const total = images.length;
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <>
      <div className="ds-detail-gallery-grid">
        {images.map((img, i) => (
          <figure
            className="ds-detail-gallery-item"
            key={`${img}-${i}`}
            data-reveal
          >
            <button
              type="button"
              className="ds-detail-gallery-trigger"
              onClick={() => open(i)}
              aria-label={`Open image ${i + 1} of ${total}`}
            >
              <div className="ds-detail-gallery-image-wrap">
                <img
                  src={img}
                  alt={`${title} detail screenshot ${i + 1}`}
                  loading="lazy"
                />
              </div>
            </button>
            <figcaption>
              <span>Detail view</span>
              <span>{pad(i + 1)}</span>
            </figcaption>
          </figure>
        ))}
      </div>

      {mounted &&
        src &&
        openIndex !== null &&
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

            {total > 1 && (
              <>
                <button
                  type="button"
                  className="ds-lightbox-btn ds-lightbox-prev"
                  onClick={(e) => {
                    e.stopPropagation();
                    go(-1);
                  }}
                  aria-label="Previous image"
                >
                  <ChevronLeft size={22} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  className="ds-lightbox-btn ds-lightbox-next"
                  onClick={(e) => {
                    e.stopPropagation();
                    go(1);
                  }}
                  aria-label="Next image"
                >
                  <ChevronRight size={22} aria-hidden="true" />
                </button>
              </>
            )}

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
                    key={openIndex}
                    className={`ds-lightbox-img is-${direction}`}
                    src={src}
                    alt={`${title} detail screenshot ${openIndex + 1}`}
                    draggable={false}
                  />
                  <span className="ds-lightbox-glare" aria-hidden="true" />
                </div>
                <div className="ds-lightbox-caption">
                  <span>{title}</span>
                  <span aria-live="polite">
                    {openIndex + 1} of {total}
                  </span>
                </div>
              </div>
            </div>

            {total > 1 && total <= 12 && (
              <div
                className="ds-lightbox-dots"
                onClick={(e) => e.stopPropagation()}
              >
                {images.map((_, i) => (
                  <button
                    type="button"
                    key={i}
                    className={`ds-lightbox-dot${i === openIndex ? " active" : ""}`}
                    onClick={() => jumpTo(i)}
                    aria-label={`Go to image ${i + 1}`}
                    aria-current={i === openIndex}
                  />
                ))}
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}
