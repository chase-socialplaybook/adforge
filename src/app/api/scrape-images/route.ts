import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Normalize URL
    let normalizedUrl = url.trim();
    if (!normalizedUrl.startsWith("http://") && !normalizedUrl.startsWith("https://")) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(normalizedUrl);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // Fetch the HTML
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    let html: string;
    try {
      const res = await fetch(parsedUrl.toString(), {
        signal: controller.signal,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "follow",
      });

      clearTimeout(timeout);

      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
        return NextResponse.json(
          { error: "URL did not return an HTML page" },
          { status: 400 }
        );
      }

      // Only read first 500KB to stay fast
      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const chunks: Uint8Array[] = [];
      let totalBytes = 0;
      const maxBytes = 512 * 1024;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        totalBytes += value.length;
        if (totalBytes > maxBytes) break;
      }
      reader.cancel();

      const decoder = new TextDecoder();
      html = chunks.map((c) => decoder.decode(c, { stream: true })).join("");
    } catch (err) {
      clearTimeout(timeout);
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("abort")) {
        return NextResponse.json(
          { error: "Website took too long to respond. Try a different URL." },
          { status: 408 }
        );
      }
      if (msg.includes("ENOTFOUND") || msg.includes("getaddrinfo")) {
        return NextResponse.json(
          { error: "Website not found. Check the URL and try again." },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: `Could not access website: ${msg}` },
        { status: 500 }
      );
    }

    // Extract image URLs from HTML
    const baseUrl = parsedUrl.origin;
    const candidateImages: Array<{ src: string; alt: string; priority: number }> = [];

    // 1. OG images (highest priority — curated hero images)
    const ogImageRegex = /<meta\s+(?:[^>]*?)property=["']og:image["']\s+(?:[^>]*?)content=["']([^"']+)["']/gi;
    let match;
    while ((match = ogImageRegex.exec(html)) !== null) {
      candidateImages.push({ src: match[1], alt: "Hero image", priority: 10 });
    }
    // Also match content before property
    const ogImageRegex2 = /<meta\s+(?:[^>]*?)content=["']([^"']+)["']\s+(?:[^>]*?)property=["']og:image["']/gi;
    while ((match = ogImageRegex2.exec(html)) !== null) {
      candidateImages.push({ src: match[1], alt: "Hero image", priority: 10 });
    }

    // 2. Twitter card images
    const twitterImgRegex = /<meta\s+(?:[^>]*?)(?:name|property)=["']twitter:image["']\s+(?:[^>]*?)content=["']([^"']+)["']/gi;
    while ((match = twitterImgRegex.exec(html)) !== null) {
      candidateImages.push({ src: match[1], alt: "Card image", priority: 9 });
    }

    // 3. Regular img tags
    const imgRegex = /<img\s+([^>]+)>/gi;
    while ((match = imgRegex.exec(html)) !== null) {
      const attrs = match[1];

      // Extract src (handle src, data-src, data-lazy-src for lazy-loaded images)
      const srcMatch =
        attrs.match(/\bsrc=["']([^"']+)["']/) ||
        attrs.match(/\bdata-src=["']([^"']+)["']/) ||
        attrs.match(/\bdata-lazy-src=["']([^"']+)["']/);
      if (!srcMatch) continue;

      const src = srcMatch[1];
      const altMatch = attrs.match(/\balt=["']([^"']*?)["']/);
      const alt = altMatch?.[1] || "";

      // Extract dimensions
      const widthMatch = attrs.match(/\bwidth=["']?(\d+)/);
      const heightMatch = attrs.match(/\bheight=["']?(\d+)/);
      const w = widthMatch ? parseInt(widthMatch[1]) : 0;
      const h = heightMatch ? parseInt(heightMatch[1]) : 0;

      // Skip tiny images (icons, tracking pixels)
      if ((w > 0 && w < 80) || (h > 0 && h < 80)) continue;

      // Skip common junk patterns
      if (/tracking|pixel|spacer|favicon|sprite|badge|arrow|1x1|blank\.|loading/i.test(src)) continue;

      // Calculate priority — larger images and those with product-related alt text rank higher
      let priority = 5;
      if (w >= 400 || h >= 400) priority = 7;
      if (w >= 600 || h >= 600) priority = 8;
      if (/product|hero|feature|main|banner|shop/i.test(attrs)) priority += 1;
      if (/icon|logo|avatar|thumbnail/i.test(attrs)) priority -= 3;

      candidateImages.push({ src, alt, priority });
    }

    // 4. Also check srcset for high-res versions
    const srcsetRegex = /srcset=["']([^"']+)["']/gi;
    while ((match = srcsetRegex.exec(html)) !== null) {
      const srcsetEntries = match[1].split(",").map((s) => s.trim());
      // Pick the largest from srcset
      let bestSrc = "";
      let bestW = 0;
      for (const entry of srcsetEntries) {
        const parts = entry.split(/\s+/);
        const wMatch = parts[1]?.match(/(\d+)w/);
        const w = wMatch ? parseInt(wMatch[1]) : 0;
        if (w > bestW) {
          bestW = w;
          bestSrc = parts[0];
        }
      }
      if (bestSrc && bestW >= 400) {
        candidateImages.push({ src: bestSrc, alt: "High-res image", priority: 7 });
      }
    }

    if (candidateImages.length === 0) {
      return NextResponse.json({
        images: [],
        message: "No product images found on this page. Try a different URL or upload manually.",
      });
    }

    // Resolve relative URLs and deduplicate
    const seen = new Set<string>();
    const resolved = candidateImages
      .map((img) => {
        let src = img.src;
        if (src.startsWith("//")) src = `https:${src}`;
        else if (src.startsWith("/")) src = `${baseUrl}${src}`;
        else if (!src.startsWith("http")) src = `${baseUrl}/${src}`;

        // Skip data URIs that are tiny SVGs
        if (src.startsWith("data:") && src.length < 500) return null;

        if (seen.has(src)) return null;
        seen.add(src);

        return { ...img, src };
      })
      .filter(Boolean) as Array<{ src: string; alt: string; priority: number }>;

    // Sort by priority and take top 8
    resolved.sort((a, b) => b.priority - a.priority);
    const topCandidates = resolved.slice(0, 8);

    // Fetch images and convert to base64 in parallel
    const imageResults = await Promise.allSettled(
      topCandidates.map(async (img) => {
        const imgController = new AbortController();
        const imgTimeout = setTimeout(() => imgController.abort(), 10000);

        try {
          const res = await fetch(img.src, {
            signal: imgController.signal,
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
              Referer: parsedUrl.toString(),
            },
          });
          clearTimeout(imgTimeout);

          if (!res.ok) return null;

          const contentType = res.headers.get("content-type") || "";
          if (!contentType.startsWith("image/")) return null;

          const contentLength = parseInt(res.headers.get("content-length") || "0");
          // Skip tiny images (<5KB) or huge ones (>5MB)
          if (contentLength > 0 && (contentLength < 5000 || contentLength > 5 * 1024 * 1024)) return null;

          const arrayBuffer = await res.arrayBuffer();
          // Double-check size after download
          if (arrayBuffer.byteLength < 5000 || arrayBuffer.byteLength > 5 * 1024 * 1024) return null;

          const base64 = Buffer.from(arrayBuffer).toString("base64");
          const mimeType = contentType.split(";")[0].trim();
          const dataUrl = `data:${mimeType};base64,${base64}`;

          return {
            src: img.src,
            alt: img.alt || "Product image",
            base64: dataUrl,
            priority: img.priority,
          };
        } catch {
          clearTimeout(imgTimeout);
          return null;
        }
      })
    );

    const images = imageResults
      .map((r) => (r.status === "fulfilled" ? r.value : null))
      .filter(Boolean)
      .sort((a, b) => (b?.priority || 0) - (a?.priority || 0))
      .slice(0, 6)
      .map((img) => ({
        src: img!.src,
        alt: img!.alt,
        base64: img!.base64,
      }));

    if (images.length === 0) {
      return NextResponse.json({
        images: [],
        message: "Found images but couldn't download them. The site may block automated access. Try uploading manually.",
      });
    }

    console.log(`[AdForge] Scraped ${images.length} images from ${parsedUrl.hostname}`);

    return NextResponse.json({ images });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[AdForge] Scrape error:", msg);
    return NextResponse.json(
      { error: `Failed to scrape images: ${msg}` },
      { status: 500 }
    );
  }
}
