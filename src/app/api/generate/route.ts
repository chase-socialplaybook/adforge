import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getGoogleFontsUrl } from "@/lib/fonts";

// Vercel function config — extend timeout to 60s (requires Hobby plan or above)
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const errors: string[] = [];

  try {
    // Validate API key is present
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
    const { brandKit, adConfig, analysis } = body;

    if (!brandKit || !adConfig) {
      return NextResponse.json(
        { error: "Missing required fields: brandKit and adConfig" },
        { status: 400 }
      );
    }

    const { format, variationCount, creativeDirection, autoGenerateCopy, headline, bodyCopy, ctaText } = adConfig;
    const { colors, headingFont, bodyFont, tone, logo } = brandKit;

    const fontsUrl = getGoogleFontsUrl([headingFont, bodyFont]);

    const analysisContext = analysis
      ? `
COMPETITOR ANALYSIS INSIGHTS:
- Layout type: ${analysis.layoutType}
- Text placement: ${analysis.textPlacement}
- CTA style: ${analysis.ctaStyle} at ${analysis.ctaPlacement}
- Color palette: ${analysis.colorPalette?.join(", ")}
- Visual hierarchy: ${analysis.visualHierarchy?.join(" → ")}
- Copy structure: ${analysis.copyStructure?.headlineLength} headline, ${analysis.copyStructure?.hookFormat} hook
- Mood: ${analysis.mood}
- Strategy: ${analysis.overallStrategy}

Use these insights to guide your layout decisions and creative approach, but apply the brand's own colors and identity.`
      : "No competitor analysis available. Use best practices for Meta ad design.";

    const copyInstructions = autoGenerateCopy
      ? `Generate compelling ad copy (headline, body text, and CTA).
Brand tone: ${tone || "Professional and engaging"}.
Make the copy persuasive and conversion-focused.`
      : `Use this exact copy:
Headline: "${headline}"
Body: "${bodyCopy}"
CTA: "${ctaText}"`;

    // Handle logo properly — send as image block, not text dump
    const logoInstruction = logo
      ? "Include a placeholder area for the brand logo (a styled div with the brand initial) — the logo will be composited separately."
      : "Do not include a logo placeholder.";

    const prompt = `You are an expert Meta ad designer. Generate ${variationCount} ad creative variation(s) as self-contained HTML.

AD SPECIFICATIONS:
- Exact dimensions: ${format.width}px × ${format.height}px
- Format: ${format.name}

BRAND IDENTITY:
- Primary color: ${colors.primary}
- Secondary color: ${colors.secondary}
- Accent color: ${colors.accent}
- Heading font: ${headingFont}
- Body font: ${bodyFont}
${logoInstruction}

CREATIVE DIRECTION: ${creativeDirection}

${analysisContext}

${copyInstructions}

CRITICAL REQUIREMENTS:
1. Each variation must be a COMPLETE, self-contained HTML document
2. The root element (html/body) must be exactly ${format.width}px wide and ${format.height}px tall with overflow:hidden
3. Use Google Fonts via: <link href="${fontsUrl}" rel="stylesheet">
4. All styling must be inline CSS or in a <style> tag within the HTML
5. The design must look professional and polished — this is a real ad
6. Use the brand colors as the dominant palette
7. Include visual elements like geometric shapes, gradients, or patterns for visual interest (no external images needed)
8. Text must be crisp and readable at the given dimensions
9. The CTA should be prominent and well-styled as a button
10. Each variation should have a distinct layout or visual approach while maintaining brand consistency
11. Set body margin to 0 and use box-sizing: border-box

LAYOUT GUIDELINES FOR "${creativeDirection}" DIRECTION:
${getDirectionGuidelines(creativeDirection)}

Return ONLY a JSON array with this structure (no markdown, no code blocks, just raw JSON):
[
  {
    "html": "<!DOCTYPE html><html>...</html>",
    "headline": "The headline used",
    "bodyCopy": "The body copy used",
    "ctaText": "The CTA text used"
  }
]

Generate exactly ${variationCount} variation(s). Each must be visually distinct.`;

    console.log(`[AdForge] Generating ${variationCount} variations, format: ${format.name}, direction: ${creativeDirection}`);

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 16000,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
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

    // Also handle if response starts with text before JSON
    const arrayStart = jsonStr.indexOf("[");
    const arrayEnd = jsonStr.lastIndexOf("]");
    if (arrayStart > 0 && arrayEnd > arrayStart) {
      jsonStr = jsonStr.slice(arrayStart, arrayEnd + 1);
    }

    let variations;
    try {
      variations = JSON.parse(jsonStr);
    } catch (parseError) {
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

    // Add IDs to each variation
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

    // Provide specific error messages for common failures
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
    minimal:
      "Clean, spacious layout with ample whitespace. Limited color usage. Simple typography hierarchy. Let the message breathe. Subtle design elements.",
    bold: "High contrast, large typography, strong visual impact. Use bold colors and geometric shapes. The ad should demand attention. Dynamic compositions with energy.",
    editorial:
      "Magazine-style layout with sophisticated typography. Elegant spacing and refined design elements. Think high-end publication aesthetic. Serif fonts for headlines work well.",
    lifestyle:
      "Warm, inviting feel. Lifestyle-oriented messaging. Soft gradients and organic shapes. The design should evoke aspiration and positive emotions.",
    "product-focused":
      "Product/service at the center. Clear value proposition. Feature-benefit layout. Direct and conversion-oriented. Strong CTA prominence.",
  };
  return guidelines[direction] || guidelines.bold;
}
