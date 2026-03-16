"use client";

import { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useAd } from "@/context/ad-context";
import { AD_FORMATS, CreativeDirection } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Square,
  RectangleVertical,
  RectangleHorizontal,
  Smartphone,
  Sparkles,
  Upload,
  X,
  ImageIcon,
} from "lucide-react";
import Image from "next/image";

const formatIcons: Record<string, React.ElementType> = {
  "feed-square": Square,
  "feed-portrait": RectangleVertical,
  "link-ad": RectangleHorizontal,
  story: Smartphone,
};

const directions: { value: CreativeDirection; label: string; desc: string }[] = [
  { value: "minimal", label: "Minimal", desc: "Clean & spacious" },
  { value: "bold", label: "Bold", desc: "High impact" },
  { value: "editorial", label: "Editorial", desc: "Magazine style" },
  { value: "lifestyle", label: "Lifestyle", desc: "Warm & aspirational" },
  { value: "product-focused", label: "Product", desc: "Product hero" },
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function AdConfig() {
  const { adConfig, updateAdConfig } = useAd();

  const onDropProduct = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      // Resize to max 800px to keep payload manageable
      const base64 = await resizeImage(file, 800);
      updateAdConfig({
        productImage: base64,
        productImageFileName: file.name,
      });
    },
    [updateAdConfig]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropProduct,
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxFiles: 1,
    multiple: false,
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Ad Configuration</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Choose your ad format, upload a product image, and set your style.
        </p>
      </div>

      {/* Product / Hero Image Upload */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Product / Hero Image</Label>
        <p className="text-xs text-muted-foreground">
          Upload a product photo or lifestyle image to feature in your ads. This makes a huge difference in quality.
        </p>

        {adConfig.productImage ? (
          <div className="relative inline-block">
            <div className="relative h-40 w-40 overflow-hidden rounded-xl border border-border/50 bg-card">
              <Image
                src={adConfig.productImage}
                alt="Product"
                fill
                className="object-cover"
              />
            </div>
            <button
              onClick={() =>
                updateAdConfig({ productImage: null, productImageFileName: null })
              }
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            <p className="mt-1.5 text-xs text-muted-foreground truncate max-w-[160px]">
              {adConfig.productImageFileName}
            </p>
          </div>
        ) : (
          <div
            {...getRootProps()}
            className={`flex h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${
              isDragActive
                ? "border-primary bg-primary/5"
                : "border-border/50 hover:border-primary/50 hover:bg-card"
            }`}
          >
            <input {...getInputProps()} />
            <div className="flex flex-col items-center gap-2 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                {isDragActive ? (
                  <ImageIcon className="h-5 w-5 text-primary" />
                ) : (
                  <Upload className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-xs font-medium">
                  {isDragActive ? "Drop image here" : "Upload product image"}
                </p>
                <p className="text-xs text-muted-foreground">PNG, JPG, WebP</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Format selector */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Ad Format</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {AD_FORMATS.map((format) => {
            const Icon = formatIcons[format.id] || Square;
            const isSelected = adConfig.format.id === format.id;
            return (
              <button
                key={format.id}
                onClick={() => updateAdConfig({ format })}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border/50 hover:border-primary/30"
                }`}
              >
                <Icon
                  className={`h-6 w-6 ${isSelected ? "text-primary" : "text-muted-foreground"}`}
                />
                <div className="text-center">
                  <p className="text-xs font-medium">{format.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {format.label}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Variation count */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Variations</Label>
          <span className="text-sm font-bold text-primary">
            {adConfig.variationCount}
          </span>
        </div>
        <Slider
          value={[adConfig.variationCount]}
          onValueChange={(val) =>
            updateAdConfig({ variationCount: Array.isArray(val) ? val[0] : val })
          }
          min={1}
          max={4}
          step={1}
          className="py-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1</span>
          <span>4</span>
        </div>
      </div>

      {/* Creative direction */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Creative Direction</Label>
        <div className="flex flex-wrap gap-2">
          {directions.map((d) => (
            <button
              key={d.value}
              onClick={() =>
                updateAdConfig({ creativeDirection: d.value })
              }
              className={`flex flex-col rounded-lg border px-3.5 py-2 text-left transition-all ${
                adConfig.creativeDirection === d.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 text-muted-foreground hover:border-primary/30"
              }`}
            >
              <span className="text-sm font-medium">{d.label}</span>
              <span className="text-xs opacity-70">{d.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Copy inputs */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Ad Copy</Label>
          <button
            onClick={() =>
              updateAdConfig({ autoGenerateCopy: !adConfig.autoGenerateCopy })
            }
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-all ${
              adConfig.autoGenerateCopy
                ? "bg-primary/10 text-primary"
                : "bg-card text-muted-foreground"
            }`}
          >
            <Sparkles className="h-3 w-3" />
            AI Generate
          </button>
        </div>

        {!adConfig.autoGenerateCopy && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Headline</p>
              <Input
                value={adConfig.headline}
                onChange={(e) => updateAdConfig({ headline: e.target.value })}
                placeholder="e.g. Transform Your Workflow"
                className="text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">Body Copy</p>
              <Textarea
                value={adConfig.bodyCopy}
                onChange={(e) => updateAdConfig({ bodyCopy: e.target.value })}
                placeholder="e.g. Boost your team's productivity with our..."
                className="min-h-[60px] resize-none text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">CTA Text</p>
              <Input
                value={adConfig.ctaText}
                onChange={(e) => updateAdConfig({ ctaText: e.target.value })}
                placeholder="e.g. Get Started Free"
                className="text-sm"
              />
            </div>
          </div>
        )}

        {adConfig.autoGenerateCopy && (
          <p className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
            AI will generate headline, body copy, and CTA based on your brand
            tone and competitor analysis.
          </p>
        )}
      </div>
    </div>
  );
}

async function resizeImage(file: File, maxDim: number): Promise<string> {
  return new Promise((resolve) => {
    const img = document.createElement("img");
    img.onload = () => {
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        const ratio = Math.min(maxDim / width, maxDim / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.src = URL.createObjectURL(file);
  });
}
