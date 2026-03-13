"use client";

import { useAd } from "@/context/ad-context";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function ToneInput() {
  const { brandKit, updateBrandKit } = useAd();

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">Brand Voice & Tone</Label>
      <Textarea
        value={brandKit.tone}
        onChange={(e) => updateBrandKit({ tone: e.target.value })}
        placeholder="e.g. Professional yet approachable, data-driven, empowering..."
        className="min-h-[80px] resize-none text-sm"
      />
      <p className="text-xs text-muted-foreground">
        Describe how your brand communicates. This helps generate on-brand copy.
      </p>
    </div>
  );
}
