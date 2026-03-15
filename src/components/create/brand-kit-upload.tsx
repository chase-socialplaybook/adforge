"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, Loader2, Upload, Check, AlertCircle, X } from "lucide-react";
import { useAd } from "@/context/ad-context";
import { Button } from "@/components/ui/button";

export function BrandKitUpload() {
  const { updateBrandKit, updateBrandColors } = useAd();
  const [isParsing, setIsParsing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<{
    success: boolean;
    message: string;
    confidence?: Record<string, string>;
  } | null>(null);

  const renderPdfToImages = async (file: File): Promise<string[]> => {
    // Dynamically import pdfjs
    const pdfjsLib = await import("pdfjs-dist");
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageImages: string[] = [];

    // Render up to 8 pages (brand kits are usually short)
    const maxPages = Math.min(pdf.numPages, 8);

    for (let i = 1; i <= maxPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 1.5 }); // Good quality without being huge
      const canvas = document.createElement("canvas");
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d")!;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await page.render({ canvasContext: ctx, viewport, canvas } as any).promise;
      pageImages.push(canvas.toDataURL("image/png"));
    }

    return pageImages;
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      setFileName(file.name);
      setIsParsing(true);
      setParseResult(null);

      try {
        // Render PDF pages to images for Claude Vision
        const pageImages = await renderPdfToImages(file);

        // Send to API for analysis
        const res = await fetch("/api/parse-brand-kit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pages: pageImages }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || "Failed to parse brand kit");
        }

        const { brandData } = await res.json();

        // Apply extracted values to brand kit
        updateBrandColors({
          primary: brandData.colors.primary,
          secondary: brandData.colors.secondary,
          accent: brandData.colors.accent,
        });
        updateBrandKit({
          headingFont: brandData.headingFont,
          bodyFont: brandData.bodyFont,
          tone: brandData.tone || "",
        });

        setParseResult({
          success: true,
          message: `Extracted brand identity from ${file.name}`,
          confidence: brandData.confidence,
        });
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Unknown error";
        console.error("Brand kit parse failed:", msg);
        setParseResult({
          success: false,
          message: msg,
        });
      } finally {
        setIsParsing(false);
      }
    },
    [updateBrandKit, updateBrandColors]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    disabled: isParsing,
  });

  const reset = () => {
    setFileName(null);
    setParseResult(null);
  };

  // Show parsing state
  if (isParsing) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        </div>
        <div>
          <p className="text-sm font-medium">Analyzing {fileName}</p>
          <p className="text-xs text-muted-foreground">
            Extracting colors, fonts, and tone from your brand kit...
          </p>
        </div>
      </div>
    );
  }

  // Show result
  if (parseResult) {
    return (
      <div
        className={`rounded-xl border p-4 ${
          parseResult.success
            ? "border-green-500/20 bg-green-500/5"
            : "border-red-500/20 bg-red-500/5"
        }`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            {parseResult.success ? (
              <Check className="mt-0.5 h-5 w-5 shrink-0 text-green-400" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            )}
            <div>
              <p
                className={`text-sm font-medium ${
                  parseResult.success ? "text-green-400" : "text-red-400"
                }`}
              >
                {parseResult.success ? "Brand kit imported" : "Import failed"}
              </p>
              <p
                className={`mt-0.5 text-xs ${
                  parseResult.success
                    ? "text-green-400/70"
                    : "text-red-400/70"
                }`}
              >
                {parseResult.message}
              </p>
              {parseResult.success && parseResult.confidence && (
                <div className="mt-2 flex gap-3">
                  {Object.entries(parseResult.confidence).map(([key, level]) => (
                    <span
                      key={key}
                      className={`text-xs ${
                        level === "high"
                          ? "text-green-400/60"
                          : level === "medium"
                            ? "text-yellow-400/60"
                            : "text-red-400/60"
                      }`}
                    >
                      {key}: {level}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
          <button
            onClick={reset}
            className="flex h-6 w-6 items-center justify-center rounded-md transition-colors hover:bg-white/10"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
        {!parseResult.success && (
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={reset}
          >
            Try again
          </Button>
        )}
      </div>
    );
  }

  // Show upload dropzone
  return (
    <div
      {...getRootProps()}
      className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 border-dashed p-4 transition-all ${
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-border/50 hover:border-primary/50"
      }`}
    >
      <input {...getInputProps()} />
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-card">
        <FileText className="h-5 w-5 text-muted-foreground" />
      </div>
      <div>
        <p className="text-sm font-medium">
          Upload brand guidelines PDF
        </p>
        <p className="text-xs text-muted-foreground">
          Auto-extract colors, fonts, and tone from your brand kit
        </p>
      </div>
    </div>
  );
}
