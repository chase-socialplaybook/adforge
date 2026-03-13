"use client";

import { useCallback } from "react";
import { AdProvider, useAd } from "@/context/ad-context";
import { CompetitorUpload } from "@/components/create/competitor-upload";
import { BrandKitInput } from "@/components/create/brand-kit-input";
import { AdConfig } from "@/components/create/ad-config";
import { AdPreview } from "@/components/create/ad-preview";
import { ExportControls } from "@/components/create/export-controls";
import { GenerationProgress } from "@/components/create/generation-progress";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Upload,
  Palette,
  Settings,
  Check,
} from "lucide-react";
import { WizardStep } from "@/lib/types";

const steps: { key: WizardStep; label: string; icon: React.ElementType }[] = [
  { key: "upload", label: "Inspiration", icon: Upload },
  { key: "brand", label: "Brand Kit", icon: Palette },
  { key: "config", label: "Configure", icon: Settings },
  { key: "generate", label: "Generate", icon: Sparkles },
];

function CreateContent() {
  const {
    currentStep,
    setCurrentStep,
    competitorImages,
    brandKit,
    adConfig,
    variations,
    isGenerating,
    setIsGenerating,
    setGenerationStage,
    setVariations,
    setCompetitorAnalysis,
    competitorAnalysis,
  } = useAd();

  const stepIndex = steps.findIndex((s) => s.key === currentStep);

  const goNext = useCallback(() => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].key);
    }
  }, [stepIndex, setCurrentStep]);

  const goPrev = useCallback(() => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex].key);
    }
  }, [stepIndex, setCurrentStep]);

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    setVariations([]);
    setCurrentStep("generate");

    try {
      let analysis = competitorAnalysis;

      // Step 1: Analyze competitor ads if we have them
      if (competitorImages.length > 0 && !analysis) {
        setGenerationStage("analyzing");
        const analyzeRes = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            images: competitorImages.map((img) => img.base64),
          }),
        });
        if (analyzeRes.ok) {
          const data = await analyzeRes.json();
          analysis = data.analysis;
          setCompetitorAnalysis(analysis);
        }
      }

      // Step 2: Plan creative direction
      setGenerationStage("planning");
      await new Promise((r) => setTimeout(r, 500));

      // Step 3: Generate ad compositions
      setGenerationStage("generating");
      const generateRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brandKit,
          adConfig,
          analysis,
        }),
      });

      if (!generateRes.ok) {
        throw new Error("Generation failed");
      }

      const data = await generateRes.json();

      // Step 4: Finalize
      setGenerationStage("finalizing");
      await new Promise((r) => setTimeout(r, 500));

      setVariations(data.variations);
    } catch (error) {
      console.error("Generation failed:", error);
    } finally {
      setIsGenerating(false);
      setGenerationStage("");
    }
  }, [
    competitorImages,
    competitorAnalysis,
    brandKit,
    adConfig,
    setIsGenerating,
    setVariations,
    setCurrentStep,
    setGenerationStage,
    setCompetitorAnalysis,
  ]);

  const canGenerate =
    brandKit.colors.primary && brandKit.headingFont && brandKit.bodyFont;

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      {/* Step indicator */}
      <div className="mb-8">
        <div className="flex items-center gap-2">
          {steps.map((step, i) => {
            const isActive = step.key === currentStep;
            const isComplete =
              i < stepIndex ||
              (step.key === "generate" && variations.length > 0);
            const Icon = step.icon;

            return (
              <div key={step.key} className="flex items-center gap-2">
                {i > 0 && (
                  <div
                    className={`h-px w-8 sm:w-12 ${
                      i <= stepIndex
                        ? "bg-primary"
                        : "bg-border"
                    }`}
                  />
                )}
                <button
                  onClick={() => !isGenerating && setCurrentStep(step.key)}
                  disabled={isGenerating}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : isComplete
                        ? "text-primary/70 hover:text-primary"
                        : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {isComplete && !isActive ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                  <span className="hidden sm:inline">{step.label}</span>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Step content */}
      <div className="grid gap-8 lg:grid-cols-[1fr,auto]">
        <div className="min-w-0">
          {currentStep === "upload" && <CompetitorUpload />}
          {currentStep === "brand" && <BrandKitInput />}
          {currentStep === "config" && <AdConfig />}
          {currentStep === "generate" && isGenerating && (
            <GenerationProgress />
          )}
          {currentStep === "generate" && !isGenerating && (
            <div className="space-y-6">
              <AdPreview />
              {variations.length > 0 && <ExportControls />}
              {variations.length === 0 && !isGenerating && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Sparkles className="mb-4 h-12 w-12 text-muted-foreground/30" />
                  <h3 className="text-lg font-semibold">Ready to generate</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Click the button below to create your ad variations.
                  </p>
                  <Button
                    onClick={handleGenerate}
                    disabled={!canGenerate}
                    className="mt-6 gap-2"
                    size="lg"
                  >
                    <Sparkles className="h-4 w-4" />
                    Generate Ads
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      {currentStep !== "generate" && (
        <div className="mt-8 flex items-center justify-between border-t border-border/50 pt-6">
          <Button
            variant="outline"
            onClick={goPrev}
            disabled={stepIndex === 0}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          {currentStep === "config" ? (
            <Button
              onClick={handleGenerate}
              disabled={!canGenerate || isGenerating}
              className="gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Generate Ads
            </Button>
          ) : (
            <Button onClick={goNext} className="gap-2">
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      )}

      {/* Regenerate button when viewing results */}
      {currentStep === "generate" && variations.length > 0 && (
        <div className="mt-8 flex items-center justify-between border-t border-border/50 pt-6">
          <Button
            variant="outline"
            onClick={() => setCurrentStep("config")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Edit Settings
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            variant="outline"
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Regenerate
          </Button>
        </div>
      )}
    </div>
  );
}

export default function CreatePage() {
  return (
    <AdProvider>
      <CreateContent />
    </AdProvider>
  );
}
