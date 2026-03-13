"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X, ImageIcon } from "lucide-react";
import { useAd } from "@/context/ad-context";
import Image from "next/image";

export function CompetitorUpload() {
  const { competitorImages, addCompetitorImages, removeCompetitorImage } =
    useAd();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      addCompetitorImages(acceptedFiles);
    },
    [addCompetitorImages]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 5 - competitorImages.length,
    disabled: competitorImages.length >= 5,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">
          Competitor Inspiration
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Upload screenshots of competitor ads you want to draw inspiration
          from. We&apos;ll analyze their layout, copy, and creative strategy.
        </p>
      </div>

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`group relative flex min-h-[200px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all ${
          isDragActive
            ? "border-primary bg-primary/5"
            : competitorImages.length >= 5
              ? "cursor-not-allowed border-border/30 opacity-50"
              : "border-border/50 hover:border-primary/50 hover:bg-card"
        }`}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-3 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Upload
              className={`h-6 w-6 transition-colors ${isDragActive ? "text-primary" : "text-muted-foreground"}`}
            />
          </div>
          {isDragActive ? (
            <p className="text-sm font-medium text-primary">
              Drop your ad screenshots here
            </p>
          ) : (
            <>
              <p className="text-sm font-medium">
                Drag & drop ad screenshots
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG, or WebP — up to 5 images
              </p>
            </>
          )}
        </div>
      </div>

      {/* Preview grid */}
      {competitorImages.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {competitorImages.map((img) => (
            <div
              key={img.id}
              className="group relative aspect-square overflow-hidden rounded-xl border border-border/50 bg-card"
            >
              <Image
                src={img.preview}
                alt="Competitor ad"
                fill
                className="object-cover"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeCompetitorImage(img.id);
                }}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-white opacity-0 transition-opacity hover:bg-black group-hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {competitorImages.length === 0 && (
        <div className="rounded-xl border border-border/30 bg-card/30 p-4">
          <div className="flex items-start gap-3">
            <ImageIcon className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Pro tip
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground/70">
                Upload ads from brands in your niche for best results.
                Screenshots from Meta Ad Library work great. You can also skip
                this step to use default templates.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
