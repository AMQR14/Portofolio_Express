"use client";

import { useEffect, useRef, useState } from "react";

export default function CertificatePdfPreview({
  src,
  className,
  fit = "cover",
}: {
  src: string;
  className?: string;
  fit?: "contain" | "cover";
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    let resizeObserver: ResizeObserver | undefined;
    let cancelRender: (() => void) | undefined;
    let destroyLoadingTask: (() => void) | undefined;

    const loadPreview = async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();
        const loadingTask = pdfjs.getDocument({ url: src });
        destroyLoadingTask = () => {
          void loadingTask.destroy();
        };
        const pdfDocument = await loadingTask.promise;
        const page = await pdfDocument.getPage(1);
        if (cancelled) return;

        const renderPage = () => {
          const canvas = canvasRef.current;
          const container = containerRef.current;
          const context = canvas?.getContext("2d");
          if (!canvas || !container || !context) return;

          const baseViewport = page.getViewport({ scale: 1 });
          const scaleFunction = fit === "cover" ? Math.max : Math.min;
          const scale = scaleFunction(
            container.clientWidth / baseViewport.width,
            container.clientHeight / baseViewport.height,
          );
          const viewport = page.getViewport({ scale });
          const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

          cancelRender?.();
          canvas.width = Math.floor(viewport.width * pixelRatio);
          canvas.height = Math.floor(viewport.height * pixelRatio);
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;
          context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

          const renderTask = page.render({
            canvas,
            canvasContext: context,
            viewport,
            background: "#ffffff",
          });
          cancelRender = () => renderTask.cancel();
          void renderTask.promise.catch((error: unknown) => {
            if (
              error instanceof Error &&
              error.name !== "RenderingCancelledException" &&
              !cancelled
            ) {
              setStatus("error");
            }
          });
        };

        renderPage();
        resizeObserver = new ResizeObserver(renderPage);
        if (containerRef.current) resizeObserver.observe(containerRef.current);
        setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    };

    void loadPreview();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
      cancelRender?.();
      destroyLoadingTask?.();
    };
  }, [fit, src]);

  return (
    <div
      className={`ds-cert-pdf-preview${className ? ` ${className}` : ""}`}
      ref={containerRef}
    >
      <canvas
        ref={canvasRef}
        className="ds-cert-pdf-canvas"
        aria-label="First page of certificate PDF"
      />
      {status !== "ready" && (
        <span className="ds-cert-pdf-status">
          {status === "loading" ? "Loading certificate…" : "PDF preview unavailable"}
        </span>
      )}
    </div>
  );
}
