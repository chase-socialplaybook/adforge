"use client";

import { useEffect, useRef, useMemo } from "react";
import { useAd } from "@/context/ad-context";
import { AdVariation } from "@/lib/types";

function AdPreviewCard({
  variation,
  index,
  width,
  height,
}: {
  variation: AdVariation;
  index: number;
  width: number;
  height: number;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const doc = iframe.contentDocument;
    if (!doc) return;
    doc.open();
    doc.write(variation.html);
    doc.close();
  }, [variation.html]);

  // Calculate scale to fit preview area (max 360px wide)
  const maxPreviewWidth = 360;
  const scale = Math.min(maxPreviewWidth / width, 1);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold">Variation {index + 1}</h4>
        <span className="text-xs text-muted-foreground">
          {width} x {height}
        </span>
      </div>
      <div
        className="overflow-hidden rounded-xl border border-border/50 bg-white"
        style={{
          width: width * scale,
          height: height * scale,
        }}
      >
        <iframe
          ref={iframeRef}
          data-ad-export-frame
          title={`Ad variation ${index + 1}`}
          style={{
            width,
            height,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            border: "none",
            display: "block",
          }}
          sandbox="allow-same-origin"
        />
      </div>
      {variation.headline && (
        <div className="space-y-1 rounded-lg border border-border/30 bg-card/50 p-3">
          <p className="text-xs font-semibold">{variation.headline}</p>
          {variation.bodyCopy && (
            <p className="text-xs text-muted-foreground">
              {variation.bodyCopy}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export function AdPreview() {
  const { variations, adConfig } = useAd();

  const gridCols = useMemo(() => {
    if (variations.length === 1) return "grid-cols-1";
    if (variations.length === 2) return "grid-cols-1 md:grid-cols-2";
    return "grid-cols-1 md:grid-cols-2";
  }, [variations.length]);

  if (variations.length === 0) return null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Your Ad Creatives</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {variations.length} variation{variations.length > 1 ? "s" : ""}{" "}
          generated at {adConfig.format.label}
        </p>
      </div>

      <div className={`grid gap-6 ${gridCols}`}>
        {variations.map((v, i) => (
          <AdPreviewCard
            key={v.id}
            variation={v}
            index={i}
            width={adConfig.format.width}
            height={adConfig.format.height}
          />
        ))}
      </div>
    </div>
  );
}
