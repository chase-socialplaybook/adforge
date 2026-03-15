import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

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

    const { images } = await request.json();

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: "No images provided" },
        { status: 400 }
      );
    }

    const imageContent: Anthropic.Messages.ContentBlockParam[] = [];

    for (const img of images) {
      // img is a base64 data URL like "data:image/png;base64,..."
      const [header, data] = img.split(",");
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

    imageContent.push({
      type: "text",
      text: `Analyze these competitor ad creatives and extract the following information. Return ONLY valid JSON with no additional text.

{
  "layoutType": "single image | split layout | text overlay | product showcase | minimal | collage",
  "textPlacement": "top | center | bottom | overlay | left | right",
  "ctaStyle": "button | text link | pill | banner | none",
  "ctaPlacement": "bottom-center | bottom-right | bottom-left | center | top",
  "colorPalette": ["#hex1", "#hex2", "#hex3", "#hex4"],
  "visualHierarchy": ["first element that draws the eye", "second", "third"],
  "copyStructure": {
    "headlineLength": "short (1-3 words) | medium (4-7 words) | long (8+ words)",
    "hasBodyText": true/false,
    "hookFormat": "question | statement | statistic | offer | emotional"
  },
  "mood": "professional | playful | luxurious | urgent | friendly | bold | minimal | energetic",
  "overallStrategy": "A 1-2 sentence summary of the creative strategy and what makes these ads effective"
}

Analyze ALL provided images and synthesize into a single analysis that captures the dominant patterns.`,
    });

    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
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
        { error: "No analysis generated" },
        { status: 500 }
      );
    }

    // Extract JSON from the response (handle potential markdown code blocks)
    let jsonStr = textBlock.text.trim();
    const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }

    let analysis;
    try {
      analysis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("[AdForge] Analysis JSON parse failed:", jsonStr.slice(0, 500));
      return NextResponse.json(
        { error: "Failed to parse analysis. Please try again." },
        { status: 500 }
      );
    }

    console.log(`[AdForge] Analysis completed in ${Date.now() - startTime}ms`);
    return NextResponse.json({ analysis });
  } catch (error) {
    const elapsed = Date.now() - startTime;
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error(`[AdForge] Analysis error after ${elapsed}ms:`, errMsg);

    if (errMsg.includes("401") || errMsg.includes("authentication")) {
      return NextResponse.json(
        { error: "API authentication failed. Check your ANTHROPIC_API_KEY." },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: `Analysis failed: ${errMsg}` },
      { status: 500 }
    );
  }
}
