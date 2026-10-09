"use client";

import {
  useRef,
  type HTMLAttributes,
  type PointerEvent,
  type PointerEventHandler,
  type ReactNode,
} from "react";

interface TiltCardProps extends HTMLAttributes<HTMLElement> {
  as?: "article" | "div";
  children: ReactNode;
}

export default function TiltCard({
  as = "div",
  children,
  className,
  ...attributes
}: TiltCardProps) {
  const boundsRef = useRef<DOMRect | null>(null);

  const handlePointerEnter: PointerEventHandler<HTMLElement> = (event) => {
    if (event.pointerType === "mouse") {
      boundsRef.current = event.currentTarget.getBoundingClientRect();
    }
  };

  const handlePointerMove: PointerEventHandler<HTMLElement> = (
    event: PointerEvent<HTMLElement>,
  ) => {
    if (
      event.pointerType !== "mouse" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const bounds = boundsRef.current;
    if (!bounds || bounds.width === 0 || bounds.height === 0) return;
    const x = (event.clientX - bounds.left) / bounds.width;
    const y = (event.clientY - bounds.top) / bounds.height;
    const tiltX = (0.5 - y) * 12;
    const tiltY = (x - 0.5) * 12;
    event.currentTarget.style.setProperty("--tilt-x", `${tiltX.toFixed(2)}deg`);
    event.currentTarget.style.setProperty("--tilt-y", `${tiltY.toFixed(2)}deg`);
  };

  const handlePointerLeave: PointerEventHandler<HTMLElement> = (event) => {
    boundsRef.current = null;
    event.currentTarget.style.setProperty("--tilt-x", "0deg");
    event.currentTarget.style.setProperty("--tilt-y", "0deg");
  };

  const cardProps = {
    ...attributes,
    className: `${className ?? ""} ds-tilt-card`.trim(),
  };

  return as === "article" ? (
    <div
      className="ds-tilt-wrap"
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <article {...cardProps}>{children}</article>
    </div>
  ) : (
    <div
      className="ds-tilt-wrap"
      onPointerEnter={handlePointerEnter}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <div {...cardProps}>{children}</div>
    </div>
  );
}
