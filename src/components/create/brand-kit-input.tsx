"use client";

import { LogoUpload } from "./logo-upload";
import { ColorPicker } from "./color-picker";
import { FontSelector } from "./font-selector";
import { ToneInput } from "./tone-input";
import { BrandKitUpload } from "./brand-kit-upload";
import { Separator } from "@/components/ui/separator";

export function BrandKitInput() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Brand Kit</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Upload your brand guidelines to auto-fill, or configure manually below.
        </p>
      </div>

      {/* PDF Brand Kit Upload */}
      <BrandKitUpload />

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-xs text-muted-foreground">or configure manually</span>
        <Separator className="flex-1" />
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
