"use client";

import { useAd } from "@/context/ad-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const colorFields = [
  { key: "primary" as const, label: "Primary" },
  { key: "secondary" as const, label: "Secondary" },
  { key: "accent" as const, label: "Accent" },
];

export function ColorPicker() {
  const { brandKit, updateBrandColors } = useAd();

  return (
    <div className="space-y-3">
      <Label className="text-sm font-medium">Brand Colors</Label>
      <div className="grid grid-cols-3 gap-3">
        {colorFields.map(({ key, label }) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center gap-2">
              <label
                className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-border/50"
                style={{ backgroundColor: brandKit.colors[key] }}
              >
                <input
                  type="color"
                  value={brandKit.colors[key]}
                  onChange={(e) => updateBrandColors({ [key]: e.target.value })}
                  className="absolute inset-0 cursor-pointer opacity-0"
                />
              </label>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{label}</p>
                <Input
                  value={brandKit.colors[key]}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                      updateBrandColors({ [key]: val });
                    }
                  }}
                  className="h-7 px-2 text-xs font-mono"
                  placeholder="#000000"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
