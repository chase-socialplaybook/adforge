"use client";

import { useAd } from "@/context/ad-context";
import { FONT_OPTIONS } from "@/lib/fonts";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function FontSelector() {
  const { brandKit, updateBrandKit } = useAd();

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Fonts</Label>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Heading Font</p>
          <Select
            value={brandKit.headingFont}
            onValueChange={(v) => v && updateBrandKit({ headingFont: v })}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  <span className="text-sm">{font.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {font.category}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Body Font</p>
          <Select
            value={brandKit.bodyFont}
            onValueChange={(v) => v && updateBrandKit({ bodyFont: v })}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_OPTIONS.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  <span className="text-sm">{font.name}</span>
                  <span className="ml-2 text-xs text-muted-foreground">
                    {font.category}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
