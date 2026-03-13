export interface BrandKit {
  logo: string | null; // base64 data URL
  logoFileName: string | null;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  headingFont: string;
  bodyFont: string;
  tone: string;
}

export interface CompetitorAnalysis {
  layoutType: string;
  textPlacement: string;
  ctaStyle: string;
  ctaPlacement: string;
  colorPalette: string[];
  visualHierarchy: string[];
  copyStructure: {
    headlineLength: string;
    hasBodyText: boolean;
    hookFormat: string;
  };
  mood: string;
  overallStrategy: string;
}

export interface AdFormat {
  id: string;
  name: string;
  width: number;
  height: number;
  label: string;
}

export const AD_FORMATS: AdFormat[] = [
  { id: "feed-square", name: "Feed Square", width: 1080, height: 1080, label: "1080 × 1080" },
  { id: "feed-portrait", name: "Feed Portrait", width: 1080, height: 1350, label: "1080 × 1350" },
  { id: "link-ad", name: "Link Ad", width: 1200, height: 628, label: "1200 × 628" },
  { id: "story", name: "Story / Reel", width: 1080, height: 1920, label: "1080 × 1920" },
];

export type CreativeDirection =
  | "minimal"
  | "bold"
  | "editorial"
  | "lifestyle"
  | "product-focused";

export interface AdConfig {
  format: AdFormat;
  variationCount: number;
  creativeDirection: CreativeDirection;
  headline: string;
  bodyCopy: string;
  ctaText: string;
  autoGenerateCopy: boolean;
}

export interface AdVariation {
  id: string;
  html: string;
  headline: string;
  bodyCopy: string;
  ctaText: string;
}

export interface GenerationResult {
  variations: AdVariation[];
  analysis: CompetitorAnalysis | null;
}

export type WizardStep = "upload" | "brand" | "config" | "generate";
