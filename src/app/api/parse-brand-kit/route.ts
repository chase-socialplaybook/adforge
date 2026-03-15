import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { FONT_OPTIONS } from "@/lib/fonts";

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

    const { pages } = await request.json();

    if (!pages || !Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json(
        { error: "No brand kit pages provided" },
        { status: 400 }
      );
    }

    // Build image content blocks from the rendered PDF pages (base64 images)
    const imageContent: Anthropic.Messages.ContentBlockParam[] = [];

    for (const page of pages) {
      const [header, data] = page.split(",");
      const mediaTypeMatch = header.match(/data:(image\/[^;]+)/);
      const mediaType = (mediaTypeMatch?.[1] || "image/png") as
        | "image/png"
        | "image/jpeg"
        | "image/webp"
        | "image/gif";

      imageContent.push({
        type: "image",
        source: {
          type: "base64",
          media_type: mediaType,
          data: data,
        },
      });
    }

    const availableFonts = FONT_OPTIONS.map((f) => f.value);

    imageContent.push({
      type: "text",
      text: `You are analyzing a brand guidelines / brand kit document. Extract the following brand identity information from the pages shown.

Look for:
- **Logo**: Describe the logo briefly (we'll handle the image separately)
- **Colors**: Extract the primary, secondary, and accent colors as hex codes. Look for color palettes, swatches, or color specifications.
- **Fonts/Typography**: Identify the heading and body fonts. Match them to the closest available Google Font from this list: ${availableFonts.join(", ")}
- **Tone/Voice**: Extract any brand voice, tone, or messaging guidelines.

Return ONLY valid JSON with no additional text:
{
  "colors": {
    "primary": "#hex",
    "secondary": "#hex",
    "accent": "#hex"
  },
  "headingFont": "Font Name from the available list",
  "bodyFont": "Font Name from the available list",
  "tone": "A brief description of the brand's voice and tone",
  "logoDescription": "Brief description of the logo for reference",
  "confidence": {
    "colors": "high | medium | low",
    "fonts": "high | medium | low",
    "tone": "high | medium | low"
  }
}

If you cannot determine a value, use reasonable defaults:
- Colors: use the most prominent colors visible in the document
- Fonts: default to "Inter" for both if no typography info is found
- Tone: describe the overall feel of the brand based on the visual style`,
    });

    console.log(`[AdForge] Parsing brand kit PDF (${pages.length} pages)`);

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      messages: [
        {
          role: "user",
          content: imageContent,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "No analysis generated from brand kit" },
        { status: 500 }
      );
    }

    let jsonStr = textBlock.text.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    // Find JSON object in response
    const objStart = jsonStr.indexOf("{");
    const objEnd = jsonStr.lastIndexOf("}");
    if (objStart >= 0 && objEnd > objStart) {
      jsonStr = jsonStr.slice(objStart, objEnd + 1);
    }

    let brandData;
    try {
      brandData = JSON.parse(jsonStr);
    } catch {
      console.error("[AdForge] Brand kit JSON parse failed:", jsonStr.slice(0, 500));
      return NextResponse.json(
        { error: "Failed to parse brand kit data. Please try again." },
        { status: 500 }
      );
    }

    // Validate font values are in our available list
    const fontValues = FONT_OPTIONS.map((f) => f.value);
    if (!fontValues.includes(brandData.headingFont)) {
      brandData.headingFont = "Inter";
    }
    if (!fontValues.includes(brandData.bodyFont)) {
      brandData.bodyFont = "Inter";
    }

    // Validate color hex codes
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    if (!hexRegex.test(brandData.colors?.primary)) brandData.colors.primary = "#1a1a2e";
    if (!hexRegex.test(brandData.colors?.secondary)) brandData.colors.secondary = "#16213e";
    if (!hexRegex.test(brandData.colors?.accent)) brandData.colors.accent = "#e94560";

    console.log(`[AdForge] Brand kit parsed in ${Date.now() - startTime}ms`);

    return NextResponse.json({ brandData });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[AdForge] Brand kit parse error after ${elapsed}ms:`, errMsg);

    return NextResponse.json(
      { error: `Failed to parse brand kit: ${errMsg}` },
      { status: 500 }
    );
  }
}
