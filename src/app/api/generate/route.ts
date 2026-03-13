import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getGoogleFontsUrl } from "@/lib/fonts";

const client = new Anthropic();

export async function POST(request: NextRequest) {
  try {
    const { brandKit, adConfig, analysis } = await request.json();

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

    const logoInstruction = logo
      ? `Include the brand logo. Use this base64 image as an <img> tag: ${logo}`
      : "Do not include a logo image.";

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
2. The HTML must be exactly ${format.width}px wide and ${format.height}px tall
3. Use Google Fonts via: <link href="${fontsUrl}" rel="stylesheet">
4. All styling must be inline CSS or in a <style> tag within the HTML
5. The design must look professional and polished — this is a real ad
6. Use the brand colors as the dominant palette
7. Include visual elements like geometric shapes, gradients, or patterns for visual interest (no external images needed)
8. Text must be crisp and readable at the given dimensions
9. The CTA should be prominent and well-styled
10. Each variation should have a distinct layout or visual approach while maintaining brand consistency

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

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No content generated" },
        { status: 500 }
      );
    }

    let jsonStr = textBlock.text.trim();
    // Handle potential markdown code blocks
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    const variations = JSON.parse(jsonStr);

    // Add IDs to each variation
    const variationsWithIds = variations.map(
      (v: { html: string; headline: string; bodyCopy: string; ctaText: string }, i: number) => ({
        ...v,
        id: `variation-${i + 1}-${Date.now()}`,
      })
    );

    return NextResponse.json({ variations: variationsWithIds });
  } catch (error) {
    console.error("Generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate ad creatives" },
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
