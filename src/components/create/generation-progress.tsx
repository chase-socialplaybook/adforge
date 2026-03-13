"use client";

import { useAd } from "@/context/ad-context";
import { Loader2, Check, Sparkles } from "lucide-react";

const stages = [
  { key: "analyzing", label: "Analyzing competitor ads" },
  { key: "planning", label: "Planning creative direction" },
  { key: "generating", label: "Generating ad compositions" },
  { key: "finalizing", label: "Finalizing variations" },
];

export function GenerationProgress() {
  const { generationStage } = useAd();

  const currentIndex = stages.findIndex((s) => s.key === generationStage);

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Sparkles className="h-8 w-8 animate-pulse text-primary" />
      </div>
      <h3 className="mb-2 text-xl font-bold">Generating your ads</h3>
      <p className="mb-8 text-sm text-muted-foreground">
        This usually takes 15-30 seconds
      </p>

      <div className="w-full max-w-sm space-y-3">
        {stages.map((stage, i) => {
          const isActive = stage.key === generationStage;
          const isComplete = i < currentIndex;
          const isPending = i > currentIndex;

          return (
            <div
              key={stage.key}
              className={`flex items-center gap-3 rounded-lg px-4 py-2.5 transition-all ${
                isActive ? "bg-primary/5" : ""
              }`}
            >
              <div className="flex h-6 w-6 shrink-0 items-center justify-center">
                {isComplete ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : isActive ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                )}
              </div>
              <span
                className={`text-sm ${
                  isActive
                    ? "font-medium text-foreground"
                    : isComplete
                      ? "text-muted-foreground"
                      : isPending
                        ? "text-muted-foreground/50"
                        : ""
                }`}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
