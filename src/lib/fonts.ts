export interface FontOption {
  name: string;
  value: string;
  category: "sans-serif" | "serif" | "display" | "monospace";
}

export const FONT_OPTIONS: FontOption[] = [
  { name: "Inter", value: "Inter", category: "sans-serif" },
  { name: "DM Sans", value: "DM Sans", category: "sans-serif" },
  { name: "Poppins", value: "Poppins", category: "sans-serif" },
  { name: "Montserrat", value: "Montserrat", category: "sans-serif" },
  { name: "Open Sans", value: "Open Sans", category: "sans-serif" },
  { name: "Raleway", value: "Raleway", category: "sans-serif" },
  { name: "Nunito", value: "Nunito", category: "sans-serif" },
  { name: "Work Sans", value: "Work Sans", category: "sans-serif" },
  { name: "Space Grotesk", value: "Space Grotesk", category: "sans-serif" },
  { name: "Plus Jakarta Sans", value: "Plus Jakarta Sans", category: "sans-serif" },
  { name: "Outfit", value: "Outfit", category: "sans-serif" },
  { name: "Sora", value: "Sora", category: "sans-serif" },
  { name: "Playfair Display", value: "Playfair Display", category: "serif" },
  { name: "Lora", value: "Lora", category: "serif" },
  { name: "Merriweather", value: "Merriweather", category: "serif" },
  { name: "Libre Baskerville", value: "Libre Baskerville", category: "serif" },
  { name: "Cormorant Garamond", value: "Cormorant Garamond", category: "serif" },
  { name: "Bebas Neue", value: "Bebas Neue", category: "display" },
  { name: "Oswald", value: "Oswald", category: "display" },
  { name: "Anton", value: "Anton", category: "display" },
  { name: "Archivo Black", value: "Archivo Black", category: "display" },
  { name: "Space Mono", value: "Space Mono", category: "monospace" },
  { name: "JetBrains Mono", value: "JetBrains Mono", category: "monospace" },
];

export function getGoogleFontsUrl(fonts: string[]): string {
  const families = fonts
    .map((f) => f.replace(/ /g, "+"))
    .map((f) => `family=${f}:wght@400;500;600;700;800;900`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}
