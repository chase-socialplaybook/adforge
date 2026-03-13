"use client";

import { LogoUpload } from "./logo-upload";
import { ColorPicker } from "./color-picker";
import { FontSelector } from "./font-selector";
import { ToneInput } from "./tone-input";

export function BrandKitInput() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Brand Kit</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Define your brand identity so every ad stays consistent and on-brand.
        </p>
      </div>

      <div className="space-y-6">
        <LogoUpload />
        <ColorPicker />
        <FontSelector />
        <ToneInput />
      </div>
    </div>
  );
}
