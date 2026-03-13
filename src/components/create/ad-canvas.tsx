"use client";

import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { AdVariation, AdFormat } from "@/lib/types";

interface AdCanvasProps {
  variation: AdVariation;
  format: AdFormat;
  scale?: number;
}

export interface AdCanvasHandle {
  getExportElement: () => HTMLIFrameElement | null;
}

export const AdCanvas = forwardRef<AdCanvasHandle, AdCanvasProps>(
  function AdCanvas({ variation, format, scale }, ref) {
    const iframeRef = useRef<HTMLIFrameElement>(null);

    useImperativeHandle(ref, () => ({
      getExportElement: () => iframeRef.current,
    }));

    useEffect(() => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      const doc = iframe.contentDocument;
      if (!doc) return;

      doc.open();
      doc.write(variation.html);
      doc.close();
    }, [variation.html]);

    const containerWidth = format.width;
    const containerHeight = format.height;
    const displayScale = scale || 0.3;

    return (
      <div
        className="overflow-hidden rounded-lg"
        style={{
          width: containerWidth * displayScale,
          height: containerHeight * displayScale,
        }}
      >
        <iframe
          ref={iframeRef}
          title={`Ad variation ${variation.id}`}
          style={{
            width: containerWidth,
            height: containerHeight,
            transform: `scale(${displayScale})`,
            transformOrigin: "top left",
            border: "none",
          }}
          sandbox="allow-same-origin"
        />
      </div>
    );
  }
);
