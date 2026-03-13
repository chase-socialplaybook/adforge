"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload, X } from "lucide-react";
import { useAd } from "@/context/ad-context";
import Image from "next/image";

export function LogoUpload() {
  const { brandKit, updateBrandKit } = useAd();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        updateBrandKit({
          logo: reader.result as string,
          logoFileName: file.name,
        });
      };
      reader.readAsDataURL(file);
    },
    [updateBrandKit]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".svg", ".jpg", ".jpeg", ".webp"],
    },
    maxFiles: 1,
  });

  if (brandKit.logo) {
    return (
      <div className="flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4">
        <div className="relative flex h-16 w-16 items-center justify-center rounded-lg bg-white/10">
          <Image
            src={brandKit.logo}
            alt="Brand logo"
            width={48}
            height={48}
            className="max-h-12 max-w-12 object-contain"
          />
        </div>
        <div className="flex-1">
          <p className="text-sm font-medium">{brandKit.logoFileName}</p>
          <p className="text-xs text-muted-foreground">Logo uploaded</p>
        </div>
        <button
          onClick={() => updateBrandKit({ logo: null, logoFileName: null })}
          className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-destructive/10"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    );
  }

  return (
    <div
      {...getRootProps()}
      className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 transition-all ${
        isDragActive
          ? "border-primary bg-primary/5"
          : "border-border/50 hover:border-primary/50"
      }`}
    >
      <input {...getInputProps()} />
      <Upload className="mb-2 h-5 w-5 text-muted-foreground" />
      <p className="text-xs font-medium">Upload logo</p>
      <p className="text-xs text-muted-foreground">PNG, SVG, or JPG</p>
    </div>
  );
}
