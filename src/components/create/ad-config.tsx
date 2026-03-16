"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useAd } from "@/context/ad-context";
import { AD_FORMATS, CreativeDirection } from "@/lib/types";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  Square,
  RectangleVertical,
  RectangleHorizontal,
  Smartphone,
  Sparkles,
  Upload,
  X,
  Globe,
  Loader2,
  Check,
  AlertCircle,
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

interface ScrapedImage {
  src: string;
  alt: string;
  base64: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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

export function AdConfig() {
  const { adConfig, updateAdConfig } = useAd();

  // Website scraping state
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [scrapedImages, setScrapedImages] = useState<ScrapedImage[]>([]);
  const [isScraping, setIsScraping] = useState(false);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [scrapeMessage, setScrapeMessage] = useState<string | null>(null);

  const handleScrape = useCallback(async () => {
    if (!websiteUrl.trim()) return;

    setIsScraping(true);
    setScrapeError(null);
    setScrapeMessage(null);
    setScrapedImages([]);

    try {
      const res = await fetch("/api/scrape-images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: websiteUrl.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setScrapeError(data.error || "Failed to scrape images");
        return;
      }

      if (data.images && data.images.length > 0) {
        setScrapedImages(data.images);
      } else {
        setScrapeMessage(
          data.message || "No product images found. Try a different URL or upload manually."
        );
      }
    } catch {
      setScrapeError("Network error. Check the URL and try again.");
    } finally {
      setIsScraping(false);
    }
  }, [websiteUrl]);

  const selectScrapedImage = useCallback(
    (img: ScrapedImage) => {
      updateAdConfig({
        productImage: img.base64,
        productImageFileName: img.alt || "product-image.jpg",
      });
    },
    [updateAdConfig]
  );

  const onDropProduct = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;
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
          Add product images, choose format, and set your style.
        </p>
      </div>

      {/* Product / Hero Image */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">Product / Hero Image</Label>
        <p className="text-xs text-muted-foreground">
          Enter your website URL to pull product images, or upload manually.
        </p>

        {/* Show selected product image if we have one */}
        {adConfig.productImage ? (
          <div className="flex items-start gap-4">
            <div className="relative">
              <div className="relative h-36 w-36 overflow-hidden rounded-xl border-2 border-primary/30 bg-card shadow-lg">
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
            </div>
            <div className="flex flex-col gap-1 pt-2">
              <div className="flex items-center gap-1.5 text-sm font-medium text-primary">
                <Check className="h-4 w-4" />
                Image selected
              </div>
              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                {adConfig.productImageFileName}
              </p>
              <button
                onClick={() =>
                  updateAdConfig({ productImage: null, productImageFileName: null })
                }
                className="mt-1 text-xs text-muted-foreground hover:text-foreground underline"
              >
                Choose a different image
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Website URL scraper */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleScrape()}
                    placeholder="e.g. graymatter.co"
                    className="pl-9 text-sm"
                    disabled={isScraping}
                  />
                </div>
                <Button
                  onClick={handleScrape}
                  disabled={!websiteUrl.trim() || isScraping}
                  size="default"
                  className="gap-2 shrink-0"
                >
                  {isScraping ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-4 w-4" />
                      Get Images
                    </>
                  )}
                </Button>
              </div>

              {/* Scrape error */}
              {scrapeError && (
                <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/5 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <p className="text-xs text-red-400">{scrapeError}</p>
                </div>
              )}

              {/* No images found message */}
              {scrapeMessage && (
                <div className="flex items-start gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-yellow-400" />
                  <p className="text-xs text-yellow-400">{scrapeMessage}</p>
                </div>
              )}

              {/* Scraped images grid */}
              {scrapedImages.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Found {scrapedImages.length} images — click one to use it:
                  </p>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
                    {scrapedImages.map((img, i) => (
                      <button
                        key={i}
                        onClick={() => selectScrapedImage(img)}
                        className="group relative aspect-square overflow-hidden rounded-lg border-2 border-border/50 bg-white transition-all hover:border-primary hover:shadow-lg"
                      >
                        <Image
                          src={img.base64}
                          alt={img.alt}
                          fill
                          className="object-cover transition-transform group-hover:scale-105"
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/30">
                          <Check className="h-6 w-6 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Separator className="flex-1" />
              <span className="text-xs text-muted-foreground">or upload manually</span>
              <Separator className="flex-1" />
            </div>

            {/* Manual upload dropzone */}
            <div
              {...getRootProps()}
              className={`flex h-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-border/50 hover:border-primary/50 hover:bg-card"
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-2 text-center">
                <Upload className={`h-5 w-5 ${isDragActive ? "text-primary" : "text-muted-foreground"}`} />
                <div>
                  <p className="text-xs font-medium">
                    {isDragActive ? "Drop image here" : "Drag & drop product image"}
                  </p>
                  <p className="text-xs text-muted-foreground">PNG, JPG, WebP</p>
                </div>
              </div>
            </div>
          </>
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
                  <p className="text-xs text-muted-foreground">{format.label}</p>
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
          <span className="text-sm font-bold text-primary">{adConfig.variationCount}</span>
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
              onClick={() => updateAdConfig({ creativeDirection: d.value })}
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
