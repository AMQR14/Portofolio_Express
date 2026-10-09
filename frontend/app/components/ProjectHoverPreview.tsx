"use client";

import { useEffect, useRef } from "react";

interface PreviewProject {
  title: string;
  image: string;
}

export default function ProjectHoverPreview({
  project,
  visible,
}: {
  project: PreviewProject | null;
  visible: boolean;
}) {
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationFrameId = 0;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    const animate = () => {
      currentX += (targetX - currentX) * 0.15;
      currentY += (targetY - currentY) * 0.15;
      previewRef.current?.style.setProperty(
        "translate",
        `${currentX}px ${currentY}px`,
      );

      if (
        Math.abs(targetX - currentX) > 0.1 ||
        Math.abs(targetY - currentY) > 0.1
      ) {
        animationFrameId = requestAnimationFrame(animate);
      } else {
        animationFrameId = 0;
      }
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
      <div className="ds-floating-view-cursor">
        <span>View</span>
      </div>
    </div>
  );
}
