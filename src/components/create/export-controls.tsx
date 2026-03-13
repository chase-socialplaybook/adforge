"use client";

import { useState } from "react";
import { Download, Archive, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAd } from "@/context/ad-context";
import { toPng } from "html-to-image";
import { saveAs } from "file-saver";
import JSZip from "jszip";

export function ExportControls() {
  const { variations, adConfig } = useAd();
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportingAll, setExportingAll] = useState(false);

  const getIframeBody = (index: number): HTMLElement | null => {
    const iframes = document.querySelectorAll<HTMLIFrameElement>(
      "[data-ad-export-frame]"
    );
    const iframe = iframes[index];
    return iframe?.contentDocument?.body || null;
  };

  const exportSingle = async (index: number) => {
    const body = getIframeBody(index);
    if (!body) return;

    setExporting(variations[index].id);
    try {
      const { width, height } = adConfig.format;
      const dataUrl = await toPng(body, {
        width,
        height,
        pixelRatio: 2,
        cacheBust: true,
      });
      saveAs(
        dataUrl,
        `adforge-${adConfig.format.id}-v${index + 1}.png`
      );
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(null);
    }
  };

  const exportAll = async () => {
    setExportingAll(true);
    try {
      const zip = new JSZip();
      const { width, height } = adConfig.format;

      for (let i = 0; i < variations.length; i++) {
        const body = getIframeBody(i);
        if (!body) continue;

        const dataUrl = await toPng(body, {
          width,
          height,
          pixelRatio: 2,
          cacheBust: true,
        });
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        zip.file(`adforge-${adConfig.format.id}-v${i + 1}.png`, blob);
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      saveAs(zipBlob, `adforge-${adConfig.format.id}-all.zip`);
    } catch (err) {
      console.error("Export all failed:", err);
    } finally {
      setExportingAll(false);
    }
  };

  if (variations.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-3">
      {variations.map((v, i) => (
        <Button
          key={v.id}
          variant="outline"
          size="sm"
          onClick={() => exportSingle(i)}
          disabled={exporting === v.id}
          className="gap-2"
        >
          {exporting === v.id ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Download V{i + 1}
        </Button>
      ))}

      {variations.length > 1 && (
        <Button
          onClick={exportAll}
          disabled={exportingAll}
          size="sm"
          className="gap-2"
        >
          {exportingAll ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Archive className="h-3.5 w-3.5" />
          )}
          Download All (ZIP)
        </Button>
      )}
    </div>
  );
}
