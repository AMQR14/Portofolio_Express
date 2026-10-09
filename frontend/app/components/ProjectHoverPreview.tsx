"use client";

import { useEffect, useRef } from "react";

interface PreviewProject {
  title: string;
  image: string;
}

// Badge tuning
const CARD_EASE = 0.12; // how quickly the card chases the cursor (lower = more lag = more badge movement)
const BADGE_PULL = 0.9; // how far the badge swings toward the cursor (higher = more)
const BADGE_EASE = 0.16; // lower = floatier
const CARD_HALF_W = 190; // half of .ds-floating-modal-card width (380px)
const CARD_HALF_H = 130; // half of its height (260px)
const BADGE_RADIUS = 40; // half of .ds-floating-view-cursor size (80px)

export default function ProjectHoverPreview({
  project,
  visible,
}: {
  project: PreviewProject | null;
  visible: boolean;
}) {
  const previewRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrameId = 0;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;
    let badgeX = 0;
    let badgeY = 0;

    const clamp = (value: number, limit: number) =>
      Math.max(-limit, Math.min(limit, value));

    const animate = () => {
      currentX += (targetX - currentX) * CARD_EASE;
      currentY += (targetY - currentY) * CARD_EASE;
      previewRef.current?.style.setProperty(
        "translate",
        `${currentX}px ${currentY}px`,
      );

      // The card lags behind the cursor. That gap is how far the cursor
      // is from the card's center, so the badge swings toward it.
      const wantX = clamp(
        (targetX - currentX) * BADGE_PULL,
        CARD_HALF_W - BADGE_RADIUS,
      );
      const wantY = clamp(
        (targetY - currentY) * BADGE_PULL,
        CARD_HALF_H - BADGE_RADIUS,
      );
      badgeX += (wantX - badgeX) * BADGE_EASE;
      badgeY += (wantY - badgeY) * BADGE_EASE;
      badgeRef.current?.style.setProperty(
        "translate",
        `${badgeX.toFixed(2)}px ${badgeY.toFixed(2)}px`,
      );

      const cardMoving =
        Math.abs(targetX - currentX) > 0.1 ||
        Math.abs(targetY - currentY) > 0.1;
      const badgeMoving =
        Math.abs(wantX - badgeX) > 0.1 || Math.abs(wantY - badgeY) > 0.1;

      animationFrameId =
        cardMoving || badgeMoving ? requestAnimationFrame(animate) : 0;
    };

    const handleMouseMove = (event: MouseEvent) => {
      targetX = event.clientX;
      targetY = event.clientY;
      if (!animationFrameId) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div
      ref={previewRef}
      className={`ds-floating-modal-container ${visible ? "active" : ""}`}
    >
      <div className="ds-floating-modal-card">
        {project?.image ? (
          <img
            key={project.image}
            src={project.image}
            alt={project.title}
            className="ds-floating-modal-img"
          />
        ) : (
          <div className="ds-floating-modal-fallback">
            <span>{project?.title}</span>
          </div>
        )}
      </div>
      <div ref={badgeRef} className="ds-floating-view-cursor">
        <span>View</span>
      </div>
    </div>
  );
}
