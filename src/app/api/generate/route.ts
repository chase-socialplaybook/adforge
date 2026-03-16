import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getGoogleFontsUrl } from "@/lib/fonts";

// Vercel function config — extend timeout to 60s
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("[AdForge] ANTHROPIC_API_KEY is not set");
      return NextResponse.json(
        { error: "Server configuration error: API key not configured" },
        { status: 500 }
      );
    }

    const client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    const body = await request.json();
    const { brandKit, adConfig, analysis, competitorImages, productImage } = body;

    if (!brandKit || !adConfig) {
      return NextResponse.json(
        { error: "Missing required fields: brandKit and adConfig" },
        { status: 400 }
      );
    }

    const { format, variationCount, creativeDirection, autoGenerateCopy, headline, bodyCopy, ctaText } = adConfig;
    const { colors, headingFont, bodyFont, tone, logo } = brandKit;

    const fontsUrl = getGoogleFontsUrl([headingFont, bodyFont]);

    // Build the message content — mix of images (vision) and text
    const content: Anthropic.Messages.ContentBlockParam[] = [];

    // Include competitor images as visual references so Claude can SEE and replicate the style
    if (competitorImages && competitorImages.length > 0) {
      content.push({
        type: "text",
        text: "COMPETITOR AD REFERENCES — Study these real ads carefully. Match their level of visual sophistication, layout quality, and professional polish:",
      });

      for (const img of competitorImages.slice(0, 3)) {
        // img is "data:image/png;base64,..."
        const [header, data] = img.split(",");
        const mediaTypeMatch = header.match(/data:(image\/[^;]+)/);
        const mediaType = (mediaTypeMatch?.[1] || "image/png") as
          | "image/png"
          | "image/jpeg"
          | "image/webp"
          | "image/gif";

        content.push({
          type: "image",
          source: { type: "base64", media_type: mediaType, data },
        });
      }
    }

    // Include product image if provided — Claude will embed this as base64 in the HTML
    let productImageInstruction = "";
    if (productImage) {
      content.push({
        type: "text",
        text: "PRODUCT IMAGE — This is the brand's product/hero image. You MUST embed this in the ad as the primary visual element:",
      });

      const [header, data] = productImage.split(",");
      const mediaTypeMatch = header.match(/data:(image\/[^;]+)/);
      const mediaType = (mediaTypeMatch?.[1] || "image/png") as
        | "image/png"
        | "image/jpeg"
        | "image/webp"
        | "image/gif";

      content.push({
        type: "image",
        source: { type: "base64", media_type: mediaType, data },
      });

      productImageInstruction = `
PRODUCT IMAGE EMBEDDING:
- Embed the product image using: <img src="${productImage}" />
- The product image should be the PRIMARY visual element — make it large and prominent
- Position it as a hero image, product showcase, or lifestyle shot depending on the layout
- Use object-fit: cover or contain as appropriate
- Style it with subtle shadows, rounded corners, or other polish`;
    }

    // Include logo if provided
    let logoInstruction = "";
    if (logo) {
      logoInstruction = `
LOGO EMBEDDING:
- Embed the brand logo using: <img src="${logo}" />
- Keep the logo tastefully sized (not too large) — typically 80-120px wide
- Position in a corner or header area as real Meta ads do
- Add a subtle drop shadow if on a busy background`;
    }

    const analysisContext = analysis
      ? `
COMPETITOR ANALYSIS DATA:
- Layout: ${analysis.layoutType} | Text at: ${analysis.textPlacement}
- CTA: ${analysis.ctaStyle} at ${analysis.ctaPlacement}
- Colors they use: ${analysis.colorPalette?.join(", ")}
- Visual flow: ${analysis.visualHierarchy?.join(" → ")}
- Copy: ${analysis.copyStructure?.headlineLength} headline, ${analysis.copyStructure?.hookFormat} hook
- Mood: ${analysis.mood}
- Strategy: ${analysis.overallStrategy}

Replicate the QUALITY and STYLE of the competitor ads but with this brand's identity.`
      : "";

    const copyInstructions = autoGenerateCopy
      ? `Generate compelling, conversion-focused ad copy.
Brand tone: ${tone || "Professional and engaging"}.
Write copy that would actually convert on Meta — punchy headlines, clear value props, strong CTAs.`
      : `Use this exact copy:
Headline: "${headline}"
Body: "${bodyCopy}"
CTA: "${ctaText}"`;

    const prompt = `You are a senior performance marketing designer who creates high-converting Meta (Facebook/Instagram) ads.

TASK: Generate ${variationCount} ad creative(s) as self-contained HTML that look like REAL, professional Meta ads — not basic HTML mockups.

AD SPECIFICATIONS:
- Exact dimensions: ${format.width}px × ${format.height}px
- Format: ${format.name} (${format.label})

BRAND IDENTITY:
- Primary: ${colors.primary} | Secondary: ${colors.secondary} | Accent: ${colors.accent}
- Heading font: ${headingFont} | Body font: ${bodyFont}
${logoInstruction}
${productImageInstruction}

CREATIVE DIRECTION: ${creativeDirection}
${analysisContext}

${copyInstructions}

CRITICAL DESIGN REQUIREMENTS — YOUR ADS MUST LOOK PROFESSIONAL:

1. LAYOUT: Use layouts that real Meta ads use:
   - Hero image taking 50-70% of the ad space
   - Text overlaid on images with proper contrast (dark overlays, gradient overlays)
   - Clean information hierarchy: hook → value prop → CTA
   - Proper spacing and padding (16-32px margins minimum)

2. VISUAL SOPHISTICATION:
   - Use rich CSS: linear-gradient overlays, backdrop-filter blur, box-shadows, border-radius
   - Create depth with layered elements and subtle shadows
   ${!productImage ? `- Since no product image was provided, create compelling visual backgrounds using:
     * Rich multi-stop gradients that feel like lifestyle photography
     * Abstract shapes with glassmorphism effects
     * Bold color blocks with sophisticated overlays
     * Mesh-style gradients (multiple radial-gradients layered)` : ""}
   - Typography should be impactful: large bold headlines (36-64px), clean body text (14-18px)
   - CTA buttons should look clickable: rounded corners, padding, hover-like styling, contrasting color

3. META AD BEST PRACTICES:
   - Headlines should be 3-8 words max, punchy and scroll-stopping
   - Body text should be 1-2 short lines max
   - CTA button should be prominent and use action words
   - The ad should tell a story in under 2 seconds of viewing
   - Use contrast to make text readable over any background
   - Keep text area under 20% of total ad space (Meta's rule)

4. TECHNICAL REQUIREMENTS:
   - Each ad is a complete HTML document with <html><head><body>
   - Root element must be exactly ${format.width}px × ${format.height}px, overflow: hidden
   - Google Fonts: <link href="${fontsUrl}" rel="stylesheet">
   - All CSS inline or in <style> tag
   - body { margin: 0; box-sizing: border-box; overflow: hidden; }
   - All images use inline base64 src (already provided above) — do NOT reference external URLs

5. EACH VARIATION MUST BE VISUALLY DISTINCT:
   - Different layout structure (not just color swaps)
   - Different text positioning
   - Different visual treatment
   - But ALL must maintain brand consistency

${getDirectionGuidelines(creativeDirection)}

Return ONLY a JSON array (no markdown, no code fences, no extra text):
[
  {
    "html": "<!DOCTYPE html><html>...</html>",
    "headline": "The headline used",
    "bodyCopy": "The body copy used",
    "ctaText": "The CTA text used"
  }
]

Generate exactly ${variationCount} variation(s).`;

    content.push({ type: "text", text: prompt });

    console.log(`[AdForge] Generating ${variationCount} variations, format: ${format.name}, direction: ${creativeDirection}, has competitor images: ${!!competitorImages?.length}, has product image: ${!!productImage}`);

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16000,
      messages: [{ role: "user", content }],
    });

    console.log(`[AdForge] Claude response received in ${Date.now() - startTime}ms, stop_reason: ${response.stop_reason}`);

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      console.error("[AdForge] No text block in response:", JSON.stringify(response.content.map(b => b.type)));
      return NextResponse.json(
        { error: "No content generated — Claude returned an empty response" },
        { status: 500 }
      );
    }

    let jsonStr = textBlock.text.trim();

    // Handle potential markdown code blocks
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    // Handle if response starts with text before JSON
    const arrayStart = jsonStr.indexOf("[");
    const arrayEnd = jsonStr.lastIndexOf("]");
    if (arrayStart > 0 && arrayEnd > arrayStart) {
      jsonStr = jsonStr.slice(arrayStart, arrayEnd + 1);
    }

    let variations;
    try {
      variations = JSON.parse(jsonStr);
    } catch {
      console.error("[AdForge] JSON parse failed. Raw response (first 500 chars):", jsonStr.slice(0, 500));
      return NextResponse.json(
        { error: "Failed to parse generated ad data. Please try again." },
        { status: 500 }
      );
    }

    if (!Array.isArray(variations) || variations.length === 0) {
      console.error("[AdForge] Parsed result is not a valid array");
      return NextResponse.json(
        { error: "Generated data was empty. Please try again." },
        { status: 500 }
      );
    }

    const variationsWithIds = variations.map(
      (v: { html: string; headline: string; bodyCopy: string; ctaText: string }, i: number) => ({
        ...v,
        id: `variation-${i + 1}-${Date.now()}`,
      })
    );

    console.log(`[AdForge] Successfully generated ${variationsWithIds.length} variations in ${Date.now() - startTime}ms`);
    return NextResponse.json({ variations: variationsWithIds });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[AdForge] Generation error after ${elapsed}ms:`, errMsg);

    if (errMsg.includes("401") || errMsg.includes("authentication")) {
      return NextResponse.json(
        { error: "API authentication failed. Check your ANTHROPIC_API_KEY in Vercel environment variables." },
        { status: 500 }
      );
    }
    if (errMsg.includes("429") || errMsg.includes("rate")) {
      return NextResponse.json(
        { error: "Rate limited by Claude API. Please wait a moment and try again." },
        { status: 429 }
      );
    }
    if (errMsg.includes("timeout") || errMsg.includes("ETIMEDOUT") || elapsed > 55000) {
      return NextResponse.json(
        { error: "Request timed out. Try generating fewer variations or a simpler direction." },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: `Generation failed: ${errMsg}` },
      { status: 500 }
    );
  }
}

function getDirectionGuidelines(direction: string): string {
  const guidelines: Record<string, string> = {
    minimal: `MINIMAL DIRECTION:
- Clean white/light backgrounds with generous whitespace
- Single accent color for CTA and key elements
- Simple, elegant typography — let the text breathe
- Subtle gradient backgrounds (light to lighter)
- No clutter — every element earns its place`,
    bold: `BOLD DIRECTION:
- High contrast, saturated colors
- Large, impactful typography (48-72px headlines)
- Dynamic diagonal or asymmetric layouts
- Strong geometric shapes and color blocks
- The ad should DEMAND attention in a feed scroll`,
    editorial: `EDITORIAL DIRECTION:
- Magazine-style sophisticated layout
- Serif fonts for headlines, clean sans-serif for body
- Muted, refined color palette
- Elegant spacing and typographic hierarchy
- Think Vogue, Monocle, or high-end publication ads`,
    lifestyle: `LIFESTYLE DIRECTION:
- Warm, aspirational feel
- Soft gradients and organic flowing shapes
- Lifestyle-oriented messaging that evokes emotion
- Warm color temperature in backgrounds
- The viewer should imagine themselves using the product`,
    "product-focused": `PRODUCT-FOCUSED DIRECTION:
- Product image front and center, taking 60-70% of space
- Clean background that makes the product pop
- Feature callouts or benefit badges
- Strong, direct CTA — "Shop Now", "Get Yours"
- Minimal text, maximum product visibility`,
  };
  return guidelines[direction] || guidelines.bold;
}
