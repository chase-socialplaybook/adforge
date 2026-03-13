"use client";

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
} from "lucide-react";

const formatIcons: Record<string, React.ElementType> = {
  "feed-square": Square,
  "feed-portrait": RectangleVertical,
  "link-ad": RectangleHorizontal,
  story: Smartphone,
};

const directions: { value: CreativeDirection; label: string }[] = [
  { value: "minimal", label: "Minimal" },
  { value: "bold", label: "Bold" },
  { value: "editorial", label: "Editorial" },
  { value: "lifestyle", label: "Lifestyle" },
  { value: "product-focused", label: "Product" },
];

export function AdConfig() {
  const { adConfig, updateAdConfig } = useAd();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Ad Configuration</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Choose your ad format, style, and copy preferences.
        </p>
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
          onValueChange={(val) => updateAdConfig({ variationCount: Array.isArray(val) ? val[0] : val })}
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
              className={`rounded-lg border px-3.5 py-1.5 text-sm font-medium transition-all ${
                adConfig.creativeDirection === d.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/50 text-muted-foreground hover:border-primary/30"
              }`}
            >
              {d.label}
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
