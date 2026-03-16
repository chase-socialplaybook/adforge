"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import {
  BrandKit,
  AdConfig,
  CompetitorAnalysis,
  AdVariation,
  AD_FORMATS,
  WizardStep,
} from "@/lib/types";

interface UploadedImage {
  id: string;
  file: File;
  preview: string;
  base64: string;
}

interface AdContextType {
  // Wizard navigation
  currentStep: WizardStep;
  setCurrentStep: (step: WizardStep) => void;

  // Competitor uploads
  competitorImages: UploadedImage[];
  addCompetitorImages: (files: File[]) => Promise<void>;
  removeCompetitorImage: (id: string) => void;

  // Analysis
  competitorAnalysis: CompetitorAnalysis | null;
  setCompetitorAnalysis: (analysis: CompetitorAnalysis | null) => void;

  // Brand kit
  brandKit: BrandKit;
  updateBrandKit: (updates: Partial<BrandKit>) => void;
  updateBrandColors: (updates: Partial<BrandKit["colors"]>) => void;

  // Ad config
  adConfig: AdConfig;
  updateAdConfig: (updates: Partial<AdConfig>) => void;

  // Generation
  variations: AdVariation[];
  setVariations: (variations: AdVariation[]) => void;
  isGenerating: boolean;
  setIsGenerating: (val: boolean) => void;
  generationStage: string;
  setGenerationStage: (stage: string) => void;
  generationError: string | null;
  setGenerationError: (error: string | null) => void;

  // Reset
  resetAll: () => void;
}

const defaultBrandKit: BrandKit = {
  logo: null,
  logoFileName: null,
  colors: {
    primary: "#1a1a2e",
    secondary: "#16213e",
    accent: "#e94560",
  },
  headingFont: "Inter",
  bodyFont: "Inter",
  tone: "",
};

const defaultAdConfig: AdConfig = {
  format: AD_FORMATS[0],
  variationCount: 2,
  creativeDirection: "bold",
  headline: "",
  bodyCopy: "",
  ctaText: "Learn More",
  autoGenerateCopy: true,
  productImage: null,
  productImageFileName: null,
};

const AdContext = createContext<AdContextType | undefined>(undefined);

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function AdProvider({ children }: { children: React.ReactNode }) {
  const [currentStep, setCurrentStep] = useState<WizardStep>("upload");
  const [competitorImages, setCompetitorImages] = useState<UploadedImage[]>([]);
  const [competitorAnalysis, setCompetitorAnalysis] =
    useState<CompetitorAnalysis | null>(null);
  const [brandKit, setBrandKit] = useState<BrandKit>(defaultBrandKit);
  const [adConfig, setAdConfig] = useState<AdConfig>(defaultAdConfig);
  const [variations, setVariations] = useState<AdVariation[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState("");
  const [generationError, setGenerationError] = useState<string | null>(null);

  const addCompetitorImages = useCallback(async (files: File[]) => {
    const newImages: UploadedImage[] = await Promise.all(
      files.map(async (file) => ({
        id: crypto.randomUUID(),
        file,
        preview: URL.createObjectURL(file),
        base64: await fileToBase64(file),
      }))
    );
    setCompetitorImages((prev) => [...prev, ...newImages].slice(0, 5));
  }, []);

  const removeCompetitorImage = useCallback((id: string) => {
    setCompetitorImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter((i) => i.id !== id);
    });
  }, []);

  const updateBrandKit = useCallback((updates: Partial<BrandKit>) => {
    setBrandKit((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateBrandColors = useCallback(
    (updates: Partial<BrandKit["colors"]>) => {
      setBrandKit((prev) => ({
        ...prev,
        colors: { ...prev.colors, ...updates },
      }));
    },
    []
  );

  const updateAdConfig = useCallback((updates: Partial<AdConfig>) => {
    setAdConfig((prev) => ({ ...prev, ...updates }));
  }, []);

  const resetAll = useCallback(() => {
    competitorImages.forEach((img) => URL.revokeObjectURL(img.preview));
    setCurrentStep("upload");
    setCompetitorImages([]);
    setCompetitorAnalysis(null);
    setBrandKit(defaultBrandKit);
    setAdConfig(defaultAdConfig);
    setVariations([]);
    setIsGenerating(false);
    setGenerationStage("");
    setGenerationError(null);
  }, [competitorImages]);

  return (
    <AdContext.Provider
      value={{
        currentStep,
        setCurrentStep,
        competitorImages,
        addCompetitorImages,
        removeCompetitorImage,
        competitorAnalysis,
        setCompetitorAnalysis,
        brandKit,
        updateBrandKit,
        updateBrandColors,
        adConfig,
        updateAdConfig,
        variations,
        setVariations,
        isGenerating,
        setIsGenerating,
        generationStage,
        setGenerationStage,
        generationError,
        setGenerationError,
        resetAll,
      }}
    >
      {children}
    </AdContext.Provider>
  );
}

export function useAd() {
  const context = useContext(AdContext);
  if (!context) throw new Error("useAd must be used within AdProvider");
  return context;
}
